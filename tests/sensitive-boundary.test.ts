import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Workspace } from "../src/workspace/manager.js";
import { readWorkspaceImage } from "../src/workspace/media.js";
import { findRipgrep, resetRipgrepCache, searchWorkspace } from "../src/workspace/search.js";
import { gitDiff, gitStatus } from "../src/workspace/git.js";
import { cleanup, makeTmpDir, write, git } from "./helpers.js";

const processCalls = vi.hoisted(() => [] as { args: string[]; options: { cwd?: string } }[]);
vi.mock("node:child_process", async (original) => {
  const actual = await original<typeof import("node:child_process")>();
  return { ...actual, spawn: (file: string, args: string[], options: object) => {
    processCalls.push({ args, options });
    return actual.spawn(file, args, options);
  } };
});

const marker = "SYNTHETIC_PRIVACY_MARKER";
const denied = ["records.db", "records.sqlite", "records.sqlite3", "records.db-wal", "records.db-shm",
  "records.sqlite-journal", "records.sqlite3-wal", "bot.session", "bot.session-journal",
  "sessions.json", "session.json", "auth/tokens.json", "token.json", "credentials.json",
  ".env", "private/notes.md", "private-state/runtime.json", "private-state/auth/store.json"];
const safe = ["src/auth.ts", "src/db.ts", "src/session.ts", "tests/tokens.test.ts", "tests/bot.session.test.ts",
  "schemas/schema.sql", "migrations/001.sql", "docs/session.md", "sessions/README.md", ".env.example"];
let root: string;
let outside: string;

beforeEach(() => {
  root = makeTmpDir("privacy-boundary"); outside = makeTmpDir("privacy-outside");
  vi.stubEnv("C2C_STATE_DIR", path.join(root, "private-state"));
  write(root, ".c2cignore", "private/\n!records.db\n!auth/tokens.json\n");
  write(root, ".gitignore", "src/db.ts\n");
  for (const file of [...denied, ...safe]) write(root, file, marker + "\n");
  processCalls.length = 0;
  resetRipgrepCache();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); resetRipgrepCache(); cleanup(root); cleanup(outside); });

function contentAccesses() {
  const seen: string[] = [];
  const capture = (file: unknown) => {
    if (typeof file !== "string") return;
    let canonical = file;
    try { canonical = fs.realpathSync.native(file); } catch { /* missing file */ }
    if (canonical.startsWith(root + path.sep) || canonical.startsWith(outside + path.sep)) seen.push(canonical);
  };
  for (const method of ["readFile", "open"] as const) {
    const original = fs.promises[method];
    vi.spyOn(fs.promises, method).mockImplementation(((file: unknown, ...args: unknown[]) => {
      capture(file); return (original as Function)(file, ...args);
    }) as never);
  }
  const readSync = fs.readFileSync;
  vi.spyOn(fs, "readFileSync").mockImplementation(((file: unknown, ...args: unknown[]) => {
    capture(file); return (readSync as Function)(file, ...args);
  }) as never);
  const stream = fs.createReadStream;
  vi.spyOn(fs, "createReadStream").mockImplementation(((file: unknown, ...args: unknown[]) => {
    capture(file); return (stream as Function)(file, ...args);
  }) as never);
  return seen;
}

describe("shared pre-content privacy boundary", () => {
  it("denies database/session/token/state reads before binary probe or stream open", async () => {
    const ws = new Workspace(root); const accesses = contentAccesses();
    for (const file of denied) {
      await expect(ws.readFile(file), file).rejects.toMatchObject({ code: "ACCESS_DENIED_SENSITIVE_FILE" });
    }
    expect(accesses).toEqual([]);
  });
  it("preserves code/docs/SQL/test names and does not make gitignore an authorization policy", async () => {
    const ws = new Workspace(root);
    for (const file of safe) expect((await ws.readFile(file)).content, file).toContain(marker);
  });
  it("protects requested aliases, canonical targets and ignored directory roots", async () => {
    fs.symlinkSync(path.join(root, "src/auth.ts"), path.join(root, "private/allowed-link.ts"));
    fs.symlinkSync(path.join(root, "records.db"), path.join(root, "safe-link.txt"));
    fs.symlinkSync(path.join(root, "private-state"), path.join(root, "state-alias"));
    const ws = new Workspace(root); const accesses = contentAccesses();
    for (const file of ["private", "private/allowed-link.ts", "safe-link.txt", "state-alias/runtime.json",
      "workspace:/records.db", "auth\\tokens.json", path.join(root, "sessions.json"), "RECORDS.DB"])
      expect(() => ws.resolve(file), file).toThrow(/ACCESS_DENIED_SENSITIVE_FILE/);
    await expect(ws.listDirectory("private")).rejects.toMatchObject({ code: "ACCESS_DENIED_SENSITIVE_FILE" });
    expect(accesses).toEqual([]);
  });
  it("hides protected state and ignored directory entries", async () => {
    const entries = (await new Workspace(root).listDirectory(".", { depth: 4, limit: 1000 })).entries.map(x => x.path);
    for (const file of denied) expect(entries, file).not.toContain(file);
    expect(entries).not.toContain("private/"); expect(entries).not.toContain("private-state/");
    expect(entries).toContain("src/auth.ts");
  });
  it("denies ignored and state images before content access, while safe images work", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
    for (const file of ["private/pixel.png", "private-state/pixel.png", "docs/pixel.png"]) fs.writeFileSync(write(root, file, ""), png);
    const ws = new Workspace(root); const accesses = contentAccesses();
    for (const file of ["private/pixel.png", "private-state/pixel.png"])
      await expect(readWorkspaceImage(ws, file)).rejects.toMatchObject({ code: "ACCESS_DENIED_SENSITIVE_FILE" });
    expect(accesses).toEqual([]);
    expect((await readWorkspaceImage(ws, "docs/pixel.png")).mimeType).toBe("image/png");
  });
  it("guards project/package JSON metadata aliases before reading", () => {
    const target = write(outside, "metadata.json", JSON.stringify({ name: "SYNTHETIC_PRIVATE_NAME", scripts: { test: marker } }));
    fs.symlinkSync(target, path.join(root, ".c2c.json")); fs.symlinkSync(target, path.join(root, "package.json"));
    const accesses = contentAccesses(); const ws = new Workspace(root);
    expect(ws.name).toBe(path.basename(root)); expect(ws.detectProject().scripts).toEqual({});
    expect(accesses).not.toContain(target);
  });
  it("fails closed on unsafe ignore-policy aliases before opening the target", () => {
    fs.unlinkSync(path.join(root, ".c2cignore"));
    const target = write(outside, "policy.txt", "private/\n"); fs.symlinkSync(target, path.join(root, ".c2cignore"));
    const accesses = contentAccesses(); expect(() => new Workspace(root)).toThrow();
    expect(accesses).not.toContain(target);
  });
  it.each(["node", "ripgrep"])("%s authorizes candidates before content reads, even with an explicit glob", async engine => {
    if (engine === "ripgrep" && !findRipgrep()) throw new Error("Real ripgrep required for this security regression");
    vi.stubEnv("C2C_DISABLE_RG", engine === "node" ? "1" : "0"); resetRipgrepCache();
    const ws = new Workspace(root); const accesses = contentAccesses();
    const result = await searchWorkspace(ws, { query: marker, glob: "**/*", limit: 100 });
    expect(result.engine).toBe(engine); const paths = result.matches.map(x => x.path);
    for (const file of denied) { expect(paths, file).not.toContain(file); expect(accesses).not.toContain(path.join(root, file)); }
    expect(paths).toContain("src/auth.ts"); expect(paths).toContain("schemas/schema.sql");
    if (engine === "ripgrep") {
      const calls = processCalls.filter(x => x.args.includes("--json")); expect(calls.length).toBeGreaterThan(0);
      for (const call of calls) {
        expect(call.args).toContain("--no-config"); expect(call.args).toContain("--no-ignore");
        const files = call.args.slice(call.args.indexOf("--") + 2); expect(files.length).toBeGreaterThan(0);
        for (const file of files) {
          expect(fs.statSync(file).isFile(), file).toBe(true);
          expect(denied.map(x => path.join(root, x))).not.toContain(file);
          expect(file.startsWith(root + path.sep)).toBe(true);
        }
      }
    }
  });
  it.each(["node", "ripgrep"])("%s retains explicit safe file and subdirectory search", async engine => {
    vi.stubEnv("C2C_DISABLE_RG", engine === "node" ? "1" : "0"); resetRipgrepCache(); const ws = new Workspace(root);
    expect((await searchWorkspace(ws, { query: marker, path: "workspace:/src/auth.ts" })).matches.map(x => x.path)).toEqual(["src/auth.ts"]);
    expect((await searchWorkspace(ws, { query: marker, path: "src", glob: "*.ts" })).matches.map(x => x.path).sort()).toEqual(["src/auth.ts", "src/db.ts", "src/session.ts"]);
  });
  it("protects a workspace rooted at C2C state without reading its policy or metadata", () => {
    vi.stubEnv("C2C_STATE_DIR", root);
    const accesses = contentAccesses();
    expect(() => new Workspace(root)).toThrow();
    expect(accesses).toEqual([]);
  });
  it("rejects an ignore-policy alias to a default protected target", () => {
    fs.unlinkSync(path.join(root, ".c2cignore"));
    fs.symlinkSync(path.join(root, ".env"), path.join(root, ".c2cignore"));
    const accesses = contentAccesses();
    expect(() => new Workspace(root)).toThrow();
    expect(accesses).toEqual([]);
  });
  it.each(["node", "ripgrep"])("%s preserves alias-specific custom rules while walking", async engine => {
    write(root, ".c2cignore", "alias/secret.md\n");
    write(root, "docs/secret.md", marker);
    fs.symlinkSync(path.join(root, "docs"), path.join(root, "alias"));
    vi.stubEnv("C2C_DISABLE_RG", engine === "node" ? "1" : "0"); resetRipgrepCache();
    const ws = new Workspace(root); const accesses = contentAccesses();
    const found = await searchWorkspace(ws, { query: marker, path: "workspace:/alias" });
    expect(found.matches.map(x => x.path)).toContain("docs/session.md");
    expect(found.matches.map(x => x.path)).not.toContain("docs/secret.md");
    expect(accesses).not.toContain(path.join(root, "docs/secret.md"));
    expect((await ws.listDirectory("alias")).entries.map(x => x.path)).not.toContain("docs/secret.md");
    expect((await searchWorkspace(ws, { query: marker, path: "/" })).matches.length).toBeGreaterThan(0);
  });
  it("ripgrep globs can only shrink the vetted candidate set, including negation and braces", async () => {
    vi.stubEnv("C2C_DISABLE_RG", "0"); resetRipgrepCache(); const ws = new Workspace(root);
    for (const glob of ["*.{ts,sql}", "!*.ts", "**/*.db", "**/*.json"]) {
      processCalls.length = 0;
      const result = await searchWorkspace(ws, { query: marker, glob, limit: 100 });
      expect(result.engine).toBe("ripgrep");
      for (const call of processCalls.filter(x => x.args.includes("--json"))) {
        for (const file of call.args.slice(call.args.indexOf("--") + 2)) {
          expect(fs.statSync(file).isFile()).toBe(true);
          expect(denied.map(x => path.join(root, x))).not.toContain(file);
        }
      }
      if (glob === "*.{ts,sql}") expect(result.matches.map(x => x.path)).toContain("schemas/schema.sql");
      if (glob === "!*.ts") expect(result.matches.some(x => x.path.endsWith(".ts"))).toBe(false);
      if (glob.endsWith(".db") || glob.endsWith(".json")) expect(result.matches).toEqual([]);
    }
  });
  it("ripgrep bounds file arguments and preserves truncation across batches", async () => {
    vi.stubEnv("C2C_DISABLE_RG", "0"); resetRipgrepCache();
    for (let i = 0; i < 65; i++) write(root, `bulk/file-${i}.txt`, "BATCH_MARKER\n");
    const result = await searchWorkspace(new Workspace(root), { query: "BATCH_MARKER", path: "bulk", limit: 60 });
    expect(result.engine).toBe("ripgrep"); expect(result.matchCount).toBe(60); expect(result.truncated).toBe(true);
    const calls = processCalls.filter(x => x.args.includes("--json")); expect(calls).toHaveLength(2);
    for (const call of calls) expect(call.args.slice(call.args.indexOf("--") + 2).length).toBeLessThanOrEqual(50);
  });
  it("retains Git filtering for new protected defaults and state while preserving safe diffs", () => {
    git(root, "init", "-b", "main"); git(root, "add", "-f", "."); git(root, "commit", "-m", "synthetic baseline");
    write(root, "records.db", "SYNTHETIC_PRIVATE_DIFF\n");
    write(root, "auth/tokens.json", "SYNTHETIC_PRIVATE_DIFF\n");
    write(root, "private-state/runtime.json", "SYNTHETIC_PRIVATE_DIFF\n");
    write(root, "src/auth.ts", "SYNTHETIC_SAFE_DIFF\n");
    const ws = new Workspace(root); const status = gitStatus(ws);
    expect(status.unstaged.map(x => x.path)).toEqual(["src/auth.ts"]); expect(status.hidden.changes).toBe(3);
    const diff = gitDiff(ws).diff; expect(diff).toContain("SYNTHETIC_SAFE_DIFF"); expect(diff).not.toContain("SYNTHETIC_PRIVATE_DIFF");
  });

  it("filters NUL-delimited status paths before exposing unusual names or rename endpoints", () => {
    const privatePath = "private-state/line\nbreak.db";
    const privateToken = "auth/line\nbreak/tokens.json";
    const safePath = 'docs/line\nbreak\t"中文.txt';
    const privateOrigin = "private-state/rename\nfrom.txt";
    const safeOrigin = "docs/rename\nsafe.txt";
    for (const file of [privatePath, privateToken, safePath, privateOrigin, safeOrigin]) write(root, file, `baseline ${file}\n`);
    git(root, "init", "-b", "main"); git(root, "add", "-f", "."); git(root, "commit", "-m", "synthetic status baseline");
    for (const file of [privatePath, privateToken, safePath]) write(root, file, "changed\n");
    git(root, "mv", privateOrigin, "docs/renamed-from-private.txt");
    git(root, "mv", safeOrigin, "private-state/rename\nto.txt");
    write(root, "private-state/untracked\nname.txt", "synthetic\n");
    const ws = new Workspace(root); const status = gitStatus(ws);
    expect(status.unstaged.map(x => x.path)).toEqual([safePath]);
    expect(status.staged).toEqual([]); expect(status.untracked).toEqual([]);
    expect(status.hidden).toEqual({ changes: 5, conflicts: 0 });
    expect(status.branch).toBe("main");
  });
  it("keeps nested workspace Git diff filtering closed for state, custom and default paths", () => {
    write(root, "project/.c2cignore", "/private/\n");
    for (const file of ["safe.txt", "private/notes.md", "private-state/runtime.json", "records.db"])
      write(root, "project/" + file, "baseline\n");
    git(root, "init", "-b", "main"); git(root, "add", "-f", "."); git(root, "commit", "-m", "synthetic nested baseline");
    vi.stubEnv("C2C_STATE_DIR", path.join(root, "project/private-state"));
    const nested = new Workspace(path.join(root, "project"));
    for (const file of ["private/notes.md", "private-state/runtime.json", "records.db"])
      write(root, "project/" + file, "SYNTHETIC_NESTED_PRIVATE_DIFF\n");
    write(root, "project/safe.txt", "SYNTHETIC_NESTED_SAFE_DIFF\n");
    const nestedStatus = gitStatus(nested);
    expect(nestedStatus.unstaged.map(x => x.path)).toEqual(["safe.txt"]);
    expect(nestedStatus.hidden.changes).toBe(3);
    const diff = gitDiff(nested).diff;
    expect(diff).not.toContain("SYNTHETIC_NESTED_PRIVATE_DIFF");
    // Existing coordinate mismatch omits the safe change; repair separately.
    expect(diff).not.toContain("SYNTHETIC_NESTED_SAFE_DIFF");
  });

  it("withholds the exact quoted tracked-state reproduction and counts its hidden change", () => {
    const file = "private-state/line\nbreak.db";
    write(root, ".gitignore", "*\n"); write(root, file, "synthetic baseline\n");
    git(root, "init", "-b", "main"); git(root, "add", "-f", file); git(root, "commit", "-m", "synthetic quoted baseline");
    write(root, file, "synthetic changed\n");
    const status = gitStatus(new Workspace(root));
    expect(status.unstaged).toEqual([]); expect(status.staged).toEqual([]); expect(status.untracked).toEqual([]);
    expect(status.hidden).toEqual({ changes: 1, conflicts: 0 });
  });

});
