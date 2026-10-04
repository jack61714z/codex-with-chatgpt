import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Workspace, workspacePathInput } from "./manager.js";

export interface SearchOptions {
  query: string;
  path?: string;
  glob?: string;
  limit?: number;
  regex?: boolean;
}

export interface SearchMatch {
  path: string;
  line: number;
  text: string;
}

export interface SearchResult {
  matches: SearchMatch[];
  matchCount: number;
  truncated: boolean;
  engine: "ripgrep" | "node";
}

const RG_CANDIDATES = [
  "rg",
  "/opt/homebrew/bin/rg",
  "/usr/local/bin/rg",
  "/usr/bin/rg",
  "/Applications/Cursor.app/Contents/Resources/app/node_modules/@vscode/ripgrep/bin/rg",
  "/Applications/Visual Studio Code.app/Contents/Resources/app/node_modules/@vscode/ripgrep/bin/rg",
];

let cachedRg: string | null | undefined;

export function findRipgrep(): string | null {
  if (process.env.C2C_DISABLE_RG === "1") return null;
  if (cachedRg !== undefined) return cachedRg;
  if (process.env.C2C_RG_PATH) {
    cachedRg = process.env.C2C_RG_PATH;
    return cachedRg;
  }
  for (const candidate of RG_CANDIDATES) {
    try {
      const result = spawnSync(candidate, ["--version"], {
        stdio: "ignore",
        timeout: 3000,
        windowsHide: true,
      });
      if (result.status === 0) {
        cachedRg = candidate;
        return candidate;
      }
    } catch {
      // try next candidate
    }
  }
  cachedRg = null;
  return null;
}

/** For tests. */
export function resetRipgrepCache(): void {
  cachedRg = undefined;
}

interface Candidate { abs: string; rel: string; requested: string }

/** Enumerate metadata only. Content readers receive this vetted file set. */
async function searchCandidates(ws: Workspace, requested: string): Promise<Candidate[]> {
  const files: Candidate[] = [];
  const visit = async (input: string): Promise<void> => {
    try {
      const { abs, rel } = ws.resolve(input);
      const stat = await fs.promises.stat(abs);
      if (ws.ignoreRules.isHidden(rel) || (stat.isDirectory() && rel !== "" && ws.ignoreRules.isHidden(rel + "/"))) return;
      if (stat.isFile()) {
        if (stat.size <= 2 * 1024 * 1024) files.push({ abs, rel, requested: input });
      } else if (stat.isDirectory()) {
        const entries = await fs.promises.readdir(abs, { withFileTypes: true });
        for (const entry of entries) {
          // Preserve existing no-follow behavior during recursive traversal.
          if (entry.isDirectory() || entry.isFile()) await visit(path.join(input, entry.name));
        }
      }
    } catch { /* denied, missing, or unreadable candidate */ }
  };
  await visit(workspacePathInput(requested));
  return files;
}

async function globFiles(ws: Workspace, rgBin: string, searchAbs: string, glob: string): Promise<Set<string>> {
  // Explicit file arguments bypass rg -g. Its filename-only traversal preserves
  // rg's glob language; intersect this metadata with the authorized candidates.
  return new Promise((resolve, reject) => {
    const child = spawn(rgBin, ["--no-config", "--files", "--no-ignore", "--hidden", "--null", "-g", glob, "--", searchAbs],
      { cwd: ws.root, windowsHide: true });
    const chunks: Buffer[] = [];
    child.stdout.on("data", chunk => chunks.push(Buffer.from(chunk)));
    child.stderr.resume();
    child.on("error", reject);
    child.on("close", code => {
      if (code !== 0 && code !== 1) return reject(new Error("ripgrep filename selection failed"));
      resolve(new Set(Buffer.concat(chunks).toString("utf8").split("\0").filter(Boolean).map(file => path.resolve(ws.root, file))));
    });
  });
}

async function searchWithRipgrep(
  ws: Workspace, rgBin: string, searchAbs: string, candidates: Candidate[], opts: SearchOptions, limit: number
): Promise<SearchResult> {
  const selected = opts.glob ? await globFiles(ws, rgBin, searchAbs, opts.glob) : null;
  const matches: SearchMatch[] = [];
  let truncated = false;
  const batches: Candidate[][] = [];
  let batch: Candidate[] = []; let bytes = 0;
  for (const file of candidates) {
    if (selected && !selected.has(file.abs)) continue;
    const cost = Buffer.byteLength(file.abs) + 1;
    if (batch.length && (batch.length >= 50 || bytes + cost > 32 * 1024)) { batches.push(batch); batch = []; bytes = 0; }
    batch.push(file); bytes += cost;
  }
  if (batch.length) batches.push(batch);
  for (const candidates of batches) {
    const files = candidates.filter(file => {
      try { return ws.resolve(file.requested).abs === file.abs && fs.statSync(file.abs).isFile(); } catch { return false; }
    });
    if (!files.length) continue; // Never invoke rg without files (stdin/directory fallback).
    const allowed = new Map(files.map(file => [file.abs, file.rel]));
    const args = ["--no-config", "--no-ignore", "--json", "--max-filesize", "2M", "--max-count", String(limit + 1)];
    if (!opts.regex) args.push("-F");
    args.push("--smart-case", "--", opts.query, ...files.map(file => file.abs));
    await new Promise<void>((resolve, reject) => {
      const child = spawn(rgBin, args, { cwd: ws.root, windowsHide: true });
      const rl = readline.createInterface({ input: child.stdout });
      child.stderr.resume();
      rl.on("line", line => {
        if (truncated) return;
        try {
          const event = JSON.parse(line) as { type: string; data?: { path?: { text?: string }; line_number?: number; lines?: { text?: string } } };
          if (event.type !== "match" || !event.data?.path?.text) return;
          const rel = allowed.get(path.resolve(ws.root, event.data.path.text));
          if (rel === undefined) return;
          if (matches.length >= limit) { truncated = true; child.kill("SIGTERM"); return; }
          matches.push({ path: rel, line: event.data.line_number ?? 0,
            text: (event.data.lines?.text ?? "").trimEnd().slice(0, 500) });
        } catch { /* ignore malformed JSON lines */ }
      });
      child.on("error", reject);
      child.on("close", code => {
        if (!truncated && code !== 0 && code !== 1) reject(new Error("ripgrep content search failed"));
        else resolve();
      });
    });
    if (truncated) break;
  }
  return { matches, matchCount: matches.length, truncated, engine: "ripgrep" };
}

async function searchWithNode(ws: Workspace, candidates: Candidate[], opts: SearchOptions, limit: number): Promise<SearchResult> {
  const matcher = opts.regex ? new RegExp(opts.query, "i") : null;
  const needle = opts.query.toLowerCase();
  const globRegex = opts.glob ? globToRegex(opts.glob) : null;
  const matches: SearchMatch[] = [];
  let truncated = false;
  for (const file of candidates) {
    if (globRegex && !globRegex.test(file.rel)) continue;
    let content: string;
    try {
      if (ws.resolve(file.requested).abs !== file.abs) continue;
      content = await fs.promises.readFile(file.abs, "utf8");
    } catch { continue; }
    if (content.includes("\0")) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (matcher ? matcher.test(line) : line.toLowerCase().includes(needle)) {
        if (matches.length >= limit) { truncated = true; break; }
        matches.push({ path: file.rel, line: i + 1, text: line.trimEnd().slice(0, 500) });
      }
    }
    if (truncated) break;
  }
  return { matches, matchCount: matches.length, truncated, engine: "node" };
}

function globToRegex(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]]/g, "\\$&")
    .replace(/\*\*\//g, "\u0000")
    .replace(/\*\*/g, "\u0001")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\u0000/g, "(?:.*/)?")
    .replace(/\u0001/g, ".*");
  return new RegExp(`(^|/)${escaped}$`, "i");
}

export async function searchWorkspace(ws: Workspace, opts: SearchOptions): Promise<SearchResult> {
  if (!opts.query || opts.query.length < 2) {
    return { matches: [], matchCount: 0, truncated: false, engine: "node" };
  }
  const limit = Math.min(200, Math.max(1, Math.floor(opts.limit ?? 50)));
  const { abs } = ws.resolve(opts.path ?? ".");
  const candidates = await searchCandidates(ws, opts.path ?? ".");
  const rg = findRipgrep();
  if (rg) {
    try {
      return await searchWithRipgrep(ws, rg, abs, candidates, opts, limit);
    } catch {
      // fall through to node engine
    }
  }
  return searchWithNode(ws, candidates, opts, limit);
}
