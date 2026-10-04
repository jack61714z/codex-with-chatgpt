import fs from "node:fs";
import { describe, expect, it, afterEach } from "vitest";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { classifyUpdate, cachedUpdate, type GitRunner, runUpdateGit, fingerprintOrigin } from "../src/update/check.js";
import { makeTmpDir, makeGitRepo, git, write, cleanup } from "./helpers.js";
const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) cleanup(dir); });
function fixture() {
  const root = makeTmpDir("update-ancestry"); dirs.push(root); makeGitRepo(root);
  const base = git(root, "rev-parse", "HEAD").trim();
  write(root, "next.txt", "next"); git(root, "add", "next.txt"); git(root, "commit", "-m", "next");
  const next = git(root, "rev-parse", "HEAD").trim();
  return { root, base, next };
}
function runner(root: string): GitRunner {
  return (args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", GIT_TERMINAL_PROMPT: "0" } });
    return { ok: result.status === 0, status: result.status, stdout: (result.stdout ?? "").trim() };
  };
}
describe("update ancestry using real local Git graphs", () => {
  it("equal", () => { const f = fixture(); expect(classifyUpdate(f.next, f.next, runner(f.root))).toBe("equal"); });
  it("remote ahead means a proven update", () => {
    const f = fixture(); expect(runner(f.root)(["merge-base", "--is-ancestor", f.base, f.next]).status).toBe(0);
    expect(classifyUpdate(f.base, f.next, runner(f.root))).toBe("behind");
  });
  it("local ahead is not an update", () => {
    const f = fixture(); expect(runner(f.root)(["merge-base", "--is-ancestor", f.next, f.base]).status).toBe(1);
    expect(classifyUpdate(f.next, f.base, runner(f.root))).toBe("ahead");
  });
  it("real divergence is not an update", () => {
    const f = fixture(); git(f.root, "checkout", "-b", "other", f.base);
    write(f.root, "other.txt", "other"); git(f.root, "add", "other.txt"); git(f.root, "commit", "-m", "other");
    const other = git(f.root, "rev-parse", "HEAD").trim(); const run = runner(f.root);
    expect(run(["merge-base", "--is-ancestor", f.next, other]).status).toBe(1);
    expect(run(["merge-base", "--is-ancestor", other, f.next]).status).toBe(1);
    expect(classifyUpdate(f.next, other, run)).toBe("diverged");
  });
  it("an advertised but unavailable object cannot prove an update", () => {
    const f = fixture(); const absent = "f".repeat(40); const run = runner(f.root);
    expect(run(["cat-file", "-e", `${absent}^{commit}`]).ok).toBe(false);
    expect(classifyUpdate(f.next, absent, run)).toBe("unknown");
  });
  it("shallow false ancestry is unknown even when both commit objects are present", () => {
    const f = fixture(); const shallow = makeTmpDir("update-shallow"); dirs.push(shallow);
    git(shallow, "clone", "--depth", "1", pathToFileURL(f.root).href, ".");
    git(shallow, "fetch", "--depth", "1", "origin", f.base);
    const run = runner(shallow);
    expect(run(["rev-parse", "--is-shallow-repository"]).stdout).toBe("true");
    expect(run(["cat-file", "-e", `${f.base}^{commit}`]).ok).toBe(true);
    expect(run(["cat-file", "-e", `${f.next}^{commit}`]).ok).toBe(true);
    expect(run(["merge-base", "--is-ancestor", f.base, f.next]).status).toBe(1);
    expect(classifyUpdate(f.next, f.base, run)).toBe("unknown");
  });
  it("a positive ancestry proof is still usable in shallow history", () => {
    const f = fixture(); const shallow = makeTmpDir("update-shallow-proof"); dirs.push(shallow);
    git(shallow, "clone", "--depth", "2", pathToFileURL(f.root).href, ".");
    const run = runner(shallow);
    expect(run(["rev-parse", "--is-shallow-repository"]).stdout).toBe("true");
    expect(run(["merge-base", "--is-ancestor", f.base, f.next]).status).toBe(0);
    expect(classifyUpdate(f.base, f.next, run)).toBe("behind");
  });
  it("Git failure and malformed remote values cannot prove an update", () => {
    const f = fixture(); const failed: GitRunner = () => ({ ok: false, status: 2, stdout: "" });
    expect(classifyUpdate(f.base, f.next, failed)).toBe("unknown");
    expect(classifyUpdate(f.base, "not-a-sha", runner(f.root))).toBe("unknown");
  });
});
describe("daily cache belongs to an exact checkout and local HEAD", () => {
  const today = "2026-10-04", local = "a".repeat(40), remote = "b".repeat(40);
  const cache = { schema: 3 as const, date: today, repoRoot: "/synthetic/checkout", localCommit: local,
    originFingerprint: "1".repeat(64), remoteCommit: remote, relation: "behind" as const, updateAvailable: true };
  it("reuses a valid same-head proof", () => { expect(cachedUpdate(cache, today, cache.repoRoot, local, "1".repeat(64))).toEqual(cache); });
  it("rejects the old inequality cache", () => {
    expect(cachedUpdate({ date: today, updateAvailable: true, remoteCommit: remote }, today, cache.repoRoot, local, "1".repeat(64))).toBeNull();
  });
  it("rejects a changed local HEAD", () => { expect(cachedUpdate(cache, today, cache.repoRoot, remote, "1".repeat(64))).toBeNull(); });
  it("rejects another checkout and an older day", () => {
    expect(cachedUpdate(cache, today, "/synthetic/other", local, "1".repeat(64))).toBeNull();
    expect(cachedUpdate(cache, "2026-10-05", cache.repoRoot, local, "1".repeat(64))).toBeNull();
  });
  it("rejects unknown or contradictory cached update flags", () => {
    expect(cachedUpdate({ ...cache, relation: "unknown" }, today, cache.repoRoot, local, "1".repeat(64))).toBeNull();
    expect(cachedUpdate({ ...cache, relation: "ahead" }, today, cache.repoRoot, local, "1".repeat(64))).toBeNull();
  });
});


describe("remote identity and promisor boundaries", () => {
  it("hashes the effective URL without persisting credential-bearing text", () => {
    const secret = "https://synthetic-user:synthetic-password@host.invalid/repo";
    expect(fingerprintOrigin(secret)).toMatch(/^[a-f0-9]{64}$/);
    expect(fingerprintOrigin(secret)).not.toContain("synthetic");
    expect(fingerprintOrigin("")).toBeNull();
  });
  it("rejects unchanged-HEAD cache from a changed or absent effective origin", () => {
    const local = "a".repeat(40), remote = "b".repeat(40), origin = "1".repeat(64);
    const cache = { schema: 3, date: "2026-10-04", repoRoot: "/fixture", localCommit: local,
      remoteCommit: remote, relation: "behind", updateAvailable: true, originFingerprint: origin };
    expect(cachedUpdate(cache, cache.date, cache.repoRoot, local, "2".repeat(64))).toBeNull();
    expect(cachedUpdate(cache, cache.date, cache.repoRoot, local, null)).toBeNull();
  });
  it("never acquires a missing commit from a real reachable promisor remote", () => {
    const f = fixture(); git(f.root, "config", "uploadpack.allowFilter", "true");
    git(f.root, "config", "uploadpack.allowAnySHA1InWant", "true");
    const client = makeTmpDir("update-promisor"); dirs.push(client);
    git(client, "clone", "--filter=blob:none", "--no-checkout", pathToFileURL(f.root).href, ".");
    expect(git(client, "config", "--get", "remote.origin.promisor").trim()).toBe("true");
    write(f.root, "later.txt", "later"); git(f.root, "add", "later.txt"); git(f.root, "commit", "-m", "later");
    const remote = git(f.root, "rev-parse", "HEAD").trim();
    const probe = () => spawnSync("git", ["--no-lazy-fetch", "cat-file", "-e", `${remote}^{commit}`], { cwd: client });
    expect(probe().status).not.toBe(0);
    const trace = write(client, "trace.json", "");
    const previous = process.env.GIT_TRACE2_EVENT; process.env.GIT_TRACE2_EVENT = trace;
    try { expect(classifyUpdate(f.next, remote, (args) => runUpdateGit(client, args))).toBe("unknown"); }
    finally { if (previous === undefined) delete process.env.GIT_TRACE2_EVENT; else process.env.GIT_TRACE2_EVENT = previous; }
    expect(probe().status).not.toBe(0);
    expect(fs.readFileSync(trace, "utf8")).not.toMatch(/"child_start"/);
    // The control proves this is fetch-capable, rather than an unreachable remote.
    expect(spawnSync("git", ["cat-file", "-e", `${remote}^{commit}`], { cwd: client }).status).toBe(0);
    expect(probe().status).toBe(0);
  });
});
