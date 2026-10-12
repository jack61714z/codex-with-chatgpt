import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => fs.readFileSync(file, "utf8");
const fence = (text: string, heading: string) => {
  const section = text.slice(text.indexOf(heading) + heading.length);
  return section.match(/```(?:text)?\n([\s\S]*?)\n```/)![1];
};
const axes = ["original_goal", "scope", "interfaces", "architecture", "workflow_ownership", "runtime_data_security", "related_dependencies"];
const question = "Chat，請依原始目標與累積變更實際審查：是否造成整體飄移？";

describe("copied C2C entry contracts (static content, not fresh host behavior)", () => {
  const docs = read("docs/protocol.md");
  const skill = read("skill/references/protocol.md");
  const connection = read("skill/references/connection-and-recovery.md");
  const project = fence(docs, "## Project instruction template");
  const boot = fence(docs, "## Boot prompt");
  it("copies the exact Project instructions to both installation projections", () => {
    expect(fence(skill, "## Project instruction template")).toBe(project);
    expect(fence(connection, "### Project instructions (paste")).toBe(project);
    expect(fence(skill, "## Boot prompt")).toBe(boot);
  });
  it.each([ ["Project", project], ["boot", boot] ])("%s separates transport from the selected project contract", (_, copied) => {
    expect(copied).toContain("selected project operating instructions");
    expect(copied).toContain("roles, permissions, review duties, record format and loop limits");
    expect(copied).toContain("installed codex-with-chatgpt skill's references/legacy-policy-migration.md");
    expect(copied).toContain("source checkout: skill/references/legacy-policy-migration.md");
    expect(copied).toContain("mark the affected source/decision UNKNOWN");
    expect(copied).toContain("need no legacy policy or companion method");
    expect(copied).toContain("Carry required records, completion requests and next-action text unchanged");
    expect(copied).toContain("never prefill a review verdict");
    expect(copied).toContain("Delivery is not acceptance or effect authority");
    expect(copied).not.toContain("format 1.0.1 / package 0.3.3");
    expect(copied).not.toContain(question);
    const full = read("skill/references/full-format.md");
    for (const axis of axes) expect(full).toContain(`AXIS: ${axis}`);
    expect(full).toContain(question);
  });
  it("preserves legacy policy selection and its complete loop rule without requiring it for new adopters", () => {
    const migration = read("skill/references/legacy-policy-migration.md");
    expect(migration).toContain("New adopters with an adequate task contract do not need");
    expect(migration).toContain("No private account plugin is needed");
    expect(migration).toContain("before replacing the transport entry");
    expect(migration).toContain("retain that consumer's previous usable instruction set");
    expect(migration).toContain("Read `maxIterations` from the workspace's `.c2c.json`");
    expect(migration).toContain("workflow default of 12 iterations");
    expect(migration).toContain("return progress, unresolved issues and loop evidence to Chat");
    expect(migration).toContain("explicit compatibility review");
  });
  it("removes unsupported browser recipes and anchors installed navigation references", () => {
    for (const old of ["setupBrowserRuntime", "agent.browsers", "tabs.new()", "markHandoff", "markDeliverable", "control-in-app-browser", "`docs/protocol.md`"]) expect(connection).not.toContain(old);
    expect(connection).toContain("current provider's documented");
    expect(connection).toContain("exactly one entry call on first invocation");
    expect(connection).toContain("Never silently substitute another browser/surface");
    expect(connection).not.toContain("cua.createBrowserTab");
    expect(connection).not.toContain("cua.getTab");
    expect(connection).toContain("[protocol.md §Boot prompt](protocol.md#boot-prompt)");
    expect(connection).toContain("explicit informed consent accepting that impact");
    expect(connection).toContain("do not run an external-launch command");
  });
  it("keeps first-failure investigation and no-blind-retry distinct from hooks or new approval loops", () => {
    const policy = read("skill/references/collaboration-policy.md");
    expect(policy).toContain("first meaningful failure, invoke Progressive Investigation");
    expect(policy).toContain("no identical blind retry");
    expect(policy).toContain("neither authorizes an automatic second wave");
    expect(policy).toContain("nor imposes a universal cap on every first error");
    expect(policy).toContain("without treating the first plausible cause as proven");
    expect(policy).toContain("does not disable plugins or hooks");
    expect(policy).toContain("report exception permits the requested evidence");
    const troubleshooting = read("docs/troubleshooting.md");
    expect(troubleshooting).not.toContain("First move, always");
    expect(troubleshooting).not.toContain("### Completely stuck");
    expect(troubleshooting).toContain("c2c doctor --no-fix --json");
    expect(troubleshooting).toContain("uncertain running process or an access denial");
  });
});

it("documents explicit runtime checkpoint persistence without the removed coding-workflow reference", () => {
  for (const file of ["docs/protocol.md", "skill/references/protocol.md"]) {
    const text = read(file);
    expect(text).toContain("## Runtime checkpoint transitions");
    expect(text).toContain("Inspect `c2c session -w <ws> --json` before any INIT");
    expect(text).toContain("c2c session set -w <ws> --task <id> --iteration <n> --protocol-state PLAN_RECEIVED --waiting-for none");
    expect(text).toContain("c2c session set -w <ws> --task <id> --iteration <n> --protocol-state EXECUTING --waiting-for none");
    expect(text).toContain("c2c record does not advance the session checkpoint");
    expect(text).toContain("--state EXECUTED --protocol-state EXECUTED_LOCAL --waiting-for none");
    expect(text).toContain("Verify the receipt is visible in the bound Chat conversation before persisting EXECUTED_SENT");
    expect(text).toContain("--protocol-state EXECUTED_SENT --waiting-for GPT_REVIEW");
    expect(text).toContain("--state DONE --clear-checkpoint");
    expect(text).toContain("does not enforce the loop limit at runtime");
  }
  expect(read("skill/references/connection-and-recovery.md")).not.toContain("checkpoint flags from the coding workflow");
});

it("runs the documented checkpoint commands in a synthetic CLI workspace and proves record does not advance it", async () => {
  const path = await import("node:path");
  const { spawnSync } = await import("node:child_process");
  const { makeTmpDir, cleanup } = await import("./helpers.js");
  const { Workspace } = await import("../src/workspace/manager.js");
  const { readSession } = await import("../src/session/state.js");
  const root = makeTmpDir("documented checkpoint");
  const previous = process.env.C2C_STATE_DIR;
  process.env.C2C_STATE_DIR = path.join(root, "synthetic-state");
  try {
    const workspace = new Workspace(root);
    const section = read("docs/protocol.md").split("## Runtime checkpoint transitions")[1].split("## Scoped assignment")[0];
    const lines = section.match(/```sh\n([\s\S]*?)\n```/)![1].split("\n");
    const expectedStates = ["INIT", "PLAN_RECEIVED", "EXECUTING", "EXECUTING", "EXECUTED_LOCAL", "EXECUTED_SENT", undefined];
    const expectedWaits = ["GPT_PLAN", "none", "none", "none", "none", "GPT_REVIEW", undefined];
    expect(lines).toHaveLength(expectedStates.length);
    for (const [index, line] of lines.entries()) {
      const args = line.split(/\s+/).slice(1).map((arg) => arg
        .replaceAll("<ws>", root).replaceAll("<id>", "synthetic-doc-task").replaceAll("<n>", "3")
        .replaceAll("<goal>", "fixture-goal").replaceAll("<paths>", "src/a.ts").replaceAll("<summary>", "fixture-checks")
        .replaceAll("<status>", "ok").replaceAll("<executor>", "codex"));
      const result = spawnSync(process.execPath, ["--import", "tsx", path.join(process.cwd(), "src/cli/index.ts"), ...args], {
        cwd: process.cwd(), encoding: "utf8", env: { ...process.env, C2C_STATE_DIR: process.env.C2C_STATE_DIR },
      });
      expect(result.status, result.stderr).toBe(0);
      const saved = readSession(workspace.id);
      expect(saved?.checkpoint?.protocolState).toBe(expectedStates[index]);
      expect(saved?.checkpoint?.waitingFor).toBe(expectedWaits[index]);
      expect(saved?.taskId).toBe("synthetic-doc-task");
      expect(saved?.iteration).toBe(3);
    }
    expect(readSession(workspace.id)?.lastState).toBe("DONE");
  } finally {
    if (previous === undefined) delete process.env.C2C_STATE_DIR; else process.env.C2C_STATE_DIR = previous;
    cleanup(root);
  }
});
