import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fingerprintOrigin } from "../src/update/check.js";
import { Workspace } from "../src/workspace/manager.js";
import { writeTunnelState } from "../src/tunnel/state.js";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, isolateStateDir, makeGitRepo, makeTmpDir, write, git } from "./helpers.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliEntry = path.join(projectRoot, "src/cli/index.ts");

function runCli(args: string[], extraEnv: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, ["--import", "tsx", cliEntry, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
  });
}

describe("machine-wide commands accept leftover -w", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs) cleanup(dir);
    dirs.length = 0;
    delete process.env.C2C_STATE_DIR;
    delete process.env.CODEX_HOME;
  });

  it("update-check --json -w does not fail with unknown option", () => {
    dirs.push(isolateStateDir());
    const result = runCli(["update-check", "--json", "-w", "C:/Projects/aquant"], {
      C2C_STATE_DIR: process.env.C2C_STATE_DIR,
    });
    expect(result.stderr).not.toMatch(/unknown option/i);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { ok: boolean };
    expect(payload.ok).toBe(true);
  });

  it("a fresh unknown ancestry result invalidates an earlier positive cache without fetching", () => {
    const stateDir = isolateStateDir(); const remote = makeTmpDir("update-local-origin");
    dirs.push(stateDir, remote); makeGitRepo(remote);
    const localCommit = git(projectRoot, "rev-parse", "HEAD").trim();
    const remoteCommit = git(remote, "rev-parse", "HEAD").trim();
    expect(spawnSync("git", ["cat-file", "-e", `${remoteCommit}^{commit}`], { cwd: projectRoot }).status).not.toBe(0);
    const cache = path.join(stateDir, "update-check.json");
    fs.writeFileSync(cache, JSON.stringify({ schema: 3, originFingerprint: fingerprintOrigin(pathToFileURL(remote).href), date: new Date().toLocaleDateString("en-CA"), repoRoot: projectRoot,
      localCommit, remoteCommit, relation: "behind", updateAvailable: true }));
    const remoteUrl = pathToFileURL(remote).href;
    const environment = { C2C_STATE_DIR: stateDir, GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null",
      GIT_CONFIG_KEY_0: `url.${remoteUrl}.insteadOf`,
      GIT_CONFIG_VALUE_0: git(projectRoot, "remote", "get-url", "origin").trim() };
    const fixtureGit = (args: string[]) => spawnSync("git", args, { cwd: projectRoot,
      encoding: "utf8", env: { ...process.env, ...environment } });
    const resolvedOrigin = fixtureGit(["remote", "get-url", "origin"]);
    expect(resolvedOrigin.status).toBe(0);
    expect(resolvedOrigin.stdout.trim()).toBe(remoteUrl);
    const advertisement = fixtureGit(["ls-remote", "origin", "HEAD"]);
    expect(advertisement.status, advertisement.stderr).toBe(0);
    expect(advertisement.stdout.trim().split(/\s+/)[0]).toBe(remoteCommit);
    for (const args of [["update-check", "--force", "--json"], ["update-check", "--json"]]) {
      const result = runCli(args, environment);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ ok: true, checked: false, updateAvailable: false,
        localCommit, remoteCommit, relation: "unknown" });
      expect(fs.existsSync(cache)).toBe(false);
      expect(spawnSync("git", ["cat-file", "-e", `${remoteCommit}^{commit}`], { cwd: projectRoot }).status).not.toBe(0);
    }
  });

  it("rechecks the same HEAD after effective origin rewrites, switches and removal", () => {
    const stateDir = isolateStateDir(); const remote = makeTmpDir("update-origin-a");
    const client = makeTmpDir("update-origin-client"); const other = makeTmpDir("update-origin-b");
    dirs.push(stateDir, remote, client, other); makeGitRepo(remote);
    git(client, "clone", pathToFileURL(remote).href, ".");
    git(other, "clone", pathToFileURL(remote).href, ".");
    const local = git(client, "rev-parse", "HEAD").trim();
    write(remote, "later.txt", "later"); git(remote, "add", "later.txt"); git(remote, "commit", "-m", "later");
    git(client, "fetch", "origin"); // Fixture preparation makes the ancestry proof locally available.
    fs.cpSync(path.join(projectRoot, "src"), path.join(client, "src"), { recursive: true });
    fs.symlinkSync(path.join(projectRoot, "node_modules"), path.join(client, "node_modules"), "junction");
    const environment = { ...process.env, C2C_STATE_DIR: stateDir,
      GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
    const check = () => {
      const result = spawnSync(process.execPath, ["--import", "tsx", path.join(client, "src/cli/index.ts"),
        "update-check", "--json"], { cwd: client, encoding: "utf8", env: environment });
      expect(result.status, result.stderr).toBe(0); return JSON.parse(result.stdout);
    };
    const cache = path.join(stateDir, "update-check.json");
    expect(check()).toMatchObject({ checked: true, relation: "behind", updateAvailable: true });
    const initialCache = JSON.parse(fs.readFileSync(cache, "utf8"));
    expect(initialCache.originFingerprint).toBe(fingerprintOrigin(pathToFileURL(remote).href));
    expect(check()).toMatchObject({ checked: false, relation: "behind", updateAvailable: true });
    // Change only effective URL via Git rewrite, without touching HEAD or configured origin.
    git(client, "config", `url.${pathToFileURL(other).href}.insteadOf`, pathToFileURL(remote).href);
    expect(git(client, "remote", "get-url", "origin").trim()).toBe(pathToFileURL(other).href);
    expect(check()).toMatchObject({ checked: true, relation: "equal", updateAvailable: false });
    expect(JSON.parse(fs.readFileSync(cache, "utf8")).originFingerprint).not.toBe(initialCache.originFingerprint);
    git(client, "config", "--remove-section", `url.${pathToFileURL(other).href}`);
    expect(check()).toMatchObject({ checked: true, relation: "behind", updateAvailable: true });
    git(client, "remote", "set-url", "origin", pathToFileURL(other).href);
    expect(check()).toMatchObject({ checked: true, relation: "equal", updateAvailable: false });
    git(client, "remote", "remove", "origin");
    expect(check()).toMatchObject({ checked: false, relation: "unknown", updateAvailable: false });
    expect(fs.existsSync(cache)).toBe(false);
    expect(git(client, "rev-parse", "HEAD").trim()).toBe(local);
  });

  it("prefs --json -w does not fail with unknown option", () => {
    dirs.push(isolateStateDir());
    const result = runCli(["prefs", "--json", "-w", "C:/Projects/aquant"], {
      C2C_STATE_DIR: process.env.C2C_STATE_DIR,
    });
    expect(result.stderr).not.toMatch(/unknown option/i);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { ok: boolean };
    expect(payload.ok).toBe(true);
  });

  it("sandbox-allow --json -w does not fail with unknown option", () => {
    const stateDir = isolateStateDir();
    const codexHome = makeTmpDir("cli-w-codex-home");
    dirs.push(stateDir, codexHome);
    const result = runCli(["sandbox-allow", "--json", "-w", "C:/Projects/aquant"], {
      C2C_STATE_DIR: stateDir,
      CODEX_HOME: codexHome,
    });
    expect(result.stderr).not.toMatch(/unknown option/i);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { ok: boolean };
    expect(payload.ok).toBe(true);
  });

  it("doctor reports a missing named tunnel credential without attempting repair", () => {
    const stateDir = isolateStateDir();
    const root = makeTmpDir("doctor-named-credential");
    const credentialDir = makeTmpDir("doctor-named-credential-file");
    dirs.push(stateDir, root, credentialDir);
    makeGitRepo(root);
    const workspace = new Workspace(root);
    const tunnelId = "11111111-1111-4111-8111-111111111111";
    writeTunnelState({
      workspaceId: workspace.id,
      preference: "named",
      provider: "cloudflare-named",
      tunnelName: "c2c-test",
      tunnelId,
      hostname: "c2c-test.example.com",
    });
    const certPath = write(credentialDir, "cert.pem", "synthetic cert");
    const credentialPath = path.join(credentialDir, `${tunnelId}.json`);
    const result = runCli(["doctor", "--json", "--no-fix", "-w", root], {
      C2C_STATE_DIR: stateDir,
      TUNNEL_ORIGIN_CERT: certPath,
      TUNNEL_CRED_FILE: credentialPath,
      C2C_TUNNEL_PROTOCOL: undefined,
    });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
    const payload = JSON.parse(result.stdout) as {
      report: { tunnel?: { ok: boolean; detail?: string } };
      namedRepair: { needed: boolean; userMessage?: string };
    };
    expect(payload.report.tunnel).toEqual({ ok: false, detail: "NAMED_TUNNEL_CREDENTIAL_MISSING_CREDENTIALS" });
    expect(payload.namedRepair.needed).toBe(true);
    expect(payload.namedRepair.userMessage).toContain("cloudflared tunnel token");
    expect(payload.namedRepair.userMessage).not.toContain("synthetic cert");
  });
});
