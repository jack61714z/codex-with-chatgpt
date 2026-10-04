import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
export type UpdateRelation = "equal" | "ahead" | "behind" | "diverged" | "unknown";
export interface GitResult { ok: boolean; status: number | null; stdout: string }
export type GitRunner = (args: string[]) => GitResult;
export interface UpdateCache {
  schema: 3; date: string; repoRoot: string; originFingerprint: string; localCommit: string; remoteCommit: string;
  relation: UpdateRelation; updateAvailable: boolean;
}
const isCommitId = (value: unknown): value is string =>
  typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value);

export function classifyUpdate(local: string, remote: string, git: GitRunner): UpdateRelation {
  if (!isCommitId(local) || !isCommitId(remote)) return "unknown";
  if (local === remote) return "equal";
  if (!git(["cat-file", "-e", `${local}^{commit}`]).ok ||
      !git(["cat-file", "-e", `${remote}^{commit}`]).ok) return "unknown";
  const forward = git(["merge-base", "--is-ancestor", local, remote]);
  if (forward.status === 0) return "behind";
  if (forward.status !== 1) return "unknown";
  const reverse = git(["merge-base", "--is-ancestor", remote, local]);
  if (reverse.status === 0) return "ahead";
  if (reverse.status !== 1) return "unknown";
  // A negative result in truncated history cannot establish divergence.
  const shallow = git(["rev-parse", "--is-shallow-repository"]);
  return shallow.ok && shallow.stdout === "false" ? "diverged" : "unknown";
}

export function cachedUpdate(value: unknown, today: string, root: string, local: string, origin: string | null): UpdateCache | null {
  if (!value || typeof value !== "object") return null;
  const cache = value as Partial<UpdateCache>;
  if (!origin || !/^[a-f0-9]{64}$/.test(origin) || cache.originFingerprint !== origin || cache.schema !== 3 ||
      cache.date !== today || cache.repoRoot !== root || cache.localCommit !== local ||
      !isCommitId(cache.localCommit) || !isCommitId(cache.remoteCommit) ||
      !["equal", "ahead", "behind", "diverged"].includes(cache.relation ?? "") ||
      cache.updateAvailable !== (cache.relation === "behind") ||
      (cache.relation === "equal") !== (cache.localCommit === cache.remoteCommit)) return null;
  return cache as UpdateCache;
}

export function runUpdateGit(root: string, args: string[]): { ok: boolean; status: number | null; stdout: string } {
  const result = spawnSync("git", ["--no-lazy-fetch", ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 8000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_NO_LAZY_FETCH: "1" },
    windowsHide: true,
  });
  return { ok: result.status === 0, status: result.status, stdout: (result.stdout ?? "").trim() };
}

export function fingerprintOrigin(url: string): string | null {
  return url ? createHash("sha256").update(url).digest("hex") : null;
}
