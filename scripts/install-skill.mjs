// Local text-only skill installation; no bridge, plugin, credential or config changes.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

function files(root, prefix = "") {
  const result = [];
  for (const entry of fs.readdirSync(path.join(root, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${relative}`);
    if (entry.isDirectory()) result.push(...files(root, relative));
    else if (entry.isFile() && /\.(md|json)$/.test(entry.name)) result.push(relative);
    else throw new Error(`Not a skill text file: ${relative}`);
  }
  return result;
}

function read(root, relative) {
  if (!root || !fs.existsSync(path.join(root, relative))) return null;
  return fs.readFileSync(path.join(root, relative), "utf8");
}

export function isConnectionReference(relative) {
  return relative.replaceAll("\\", "/") === "references/connection-and-recovery.md";
}

export function installSkill(source, destination, baseline = null) {
  source = path.resolve(source);
  destination = path.resolve(destination);
  // Verify every existing destination ancestor before any mutation.
  for (let ancestor = destination; ; ancestor = path.dirname(ancestor)) {
    if (fs.existsSync(ancestor) && fs.lstatSync(ancestor).isSymbolicLink()) throw new Error(`Refusing symlink: ${ancestor}`);
    if (path.dirname(ancestor) === ancestor) break;
  }
  const incoming = files(source);
  if (!incoming.includes("SKILL.md")) throw new Error("Missing SKILL.md");
  if (fs.existsSync(destination)) files(destination);
  const updates = [], preserved = [], conflicts = [];
  for (const relative of incoming) {
    let next = read(source, relative);
    let old = read(baseline, relative);
    if (isConnectionReference(relative)) {
      const checkout = path.dirname(source);
      next = next.replaceAll("<ACTUAL_CHECKOUT_PATH>", checkout);
      old = old?.replaceAll("<ACTUAL_CHECKOUT_PATH>", checkout) ?? null;
    }
    const current = read(destination, relative);
    if (current === next) continue;
    if (current === null || (old !== null && current === old)) updates.push([relative, next]);
    else if (old === next) preserved.push(relative); // No incoming change; keep local customization.
    else conflicts.push(relative); // Never overwrite an overlapping customized file.
  }
  // A conflict leaves the entire install intact; caller can reconcile the concrete text.
  if (conflicts.length) return { updated: [], preserved, conflicts, backup: null };
  let backup = null;
  if (fs.existsSync(destination) && updates.length) {
    backup = fs.mkdtempSync(path.join(os.tmpdir(), "c2c-skill-backup-"));
    fs.cpSync(destination, path.join(backup, "skill"), { recursive: true });
  }
  for (const [relative, content] of updates) {
    const target = path.join(destination, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    if (fs.readFileSync(target, "utf8") !== content) throw new Error(`Readback mismatch: ${relative}`);
  }
  return { updated: updates.map(([relative]) => relative), preserved, conflicts, backup };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [source, destination, baseline] = process.argv.slice(2);
  if (!source || !destination) throw new Error("Usage: node scripts/install-skill.mjs <skill-source> <destination> [previous-source]");
  const result = installSkill(source, destination, baseline);
  console.log(JSON.stringify(result, null, 2));
  if (result.conflicts.length) process.exitCode = 1;
}
