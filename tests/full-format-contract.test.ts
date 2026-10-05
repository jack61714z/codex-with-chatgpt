import fs from "node:fs";
import { describe, it, expect } from "vitest";

describe("static document contract (not host behavior)", () => {
  it("ships canonical full records and literal drift question", () => {
    const full = fs.readFileSync("skill/references/full-format.md", "utf8");
    expect(full).toContain("FORMAT_VERSION: 1.0.1");
    expect(full).toContain("PACKAGE_VERSION: 0.3.3");
    expect(full).toContain("Chat，請依原始目標與累積變更實際審查：是否造成整體飄移？");
    for (const axis of ["original_goal", "scope", "interfaces", "architecture", "workflow_ownership", "runtime_data_security", "related_dependencies"]) expect(full).toContain(`AXIS: ${axis}`);
    expect(full).toContain("never substitute for ITERATION");
    expect(full).toContain("null with reason");
    expect(full).toContain("UNKNOWN if execution identity is not verified");
  });
});

it("all skill Markdown references resolve", () => {
  function inspect(dir: string) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = `${dir}/${item.name}`;
      if (item.isDirectory()) inspect(file);
      else if (file.endsWith(".md")) for (const match of fs.readFileSync(file, "utf8").matchAll(/\]\(([^)]+)\)/g)) {
        const target = match[1].split("#")[0];
        if (!target || /^[a-z]+:/.test(target)) continue;
        expect(fs.existsSync(new URL(target, `file://${process.cwd()}/${file}`)), `${file}: ${target}`).toBe(true);
      }
    }
  }
  inspect("skill");
});

it("installer includes dependencies and preserves customized files", async () => {
  const { installSkill } = await import("../scripts/install-skill.mjs");
  const os = await import("node:os");
  const path = await import("node:path");
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "c2c-full-install-"));
  try {
    const destination = path.join(root, "installed");
    const baseline = path.join(root, "baseline");
    fs.cpSync("skill", baseline, { recursive: true });
    installSkill("skill", destination);
    for (const name of fs.readdirSync("skill/references")) expect(fs.readFileSync(path.join(destination, "references", name), "utf8")).toBe((name === "connection-and-recovery.md" ? fs.readFileSync(path.join("skill/references", name), "utf8").replaceAll("<ACTUAL_CHECKOUT_PATH>", process.cwd()) : fs.readFileSync(path.join("skill/references", name), "utf8")));
    expect(fs.readFileSync(path.join(destination, "references/full-format.md"), "utf8"))
      .toBe(fs.readFileSync("skill/references/full-format.md", "utf8"));
    fs.writeFileSync(path.join(destination, "custom.md"), "custom instructions");
    fs.appendFileSync(path.join(destination, "references/connection-and-recovery.md"), "\ncustom local launcher\n");
    const result = installSkill("skill", destination, baseline);
    expect(result.conflicts).toEqual([]);
    const candidate = path.join(root, "candidate");
    fs.cpSync("skill", candidate, { recursive: true });
    for (const fixture of [candidate, baseline]) {
      const connection = path.join(fixture, "references/connection-and-recovery.md");
      fs.writeFileSync(connection, fs.readFileSync(connection, "utf8").replaceAll("<ACTUAL_CHECKOUT_PATH>", process.cwd()));
    }
    fs.mkdirSync(path.join(candidate, "templates"));
    fs.writeFileSync(path.join(candidate, "templates/example.md"), "template dependency");
    fs.appendFileSync(path.join(candidate, "references/protocol.md"), "\nnew owned policy\n");
    const update = installSkill(candidate, destination, baseline);
    expect(update.conflicts).toEqual([]);
    expect(fs.readFileSync(path.join(destination, "templates/example.md"), "utf8")).toBe("template dependency");
    expect(fs.readFileSync(path.join(destination, "references/protocol.md"), "utf8")).toContain("new owned policy");
    expect(update.backup).not.toBeNull();
    if (update.backup) fs.rmSync(update.backup, { recursive: true, force: true });
    expect(fs.readFileSync(path.join(destination, "custom.md"), "utf8")).toBe("custom instructions");
    expect(fs.readFileSync(path.join(destination, "references/connection-and-recovery.md"), "utf8")).toContain("custom local launcher");
    fs.appendFileSync(path.join(destination, "SKILL.md"), "\ncustom changed policy\n");
    fs.appendFileSync(path.join(baseline, "SKILL.md"), "\nold baseline\n");
    expect(installSkill("skill", destination, baseline).conflicts).toContain("SKILL.md");
    expect(fs.readFileSync(path.join(destination, "SKILL.md"), "utf8")).toContain("custom changed policy");
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});


it("compact pointer and continuation retain document-only semantics", () => {
  const protocol = fs.readFileSync("skill/references/protocol.md", "utf8");
  expect(protocol).toContain("ITERATION: <numeric checkpoint iteration, or UNKNOWN>");
  expect(protocol).toContain("REPAIR_LABEL: <separate label or NONE>");
  expect(protocol).toContain("EXECUTOR: <verified actual executor or UNKNOWN>");
  expect(protocol).toContain("EXECUTED_SENT waits for Chat review and never sends the pointer again");
  expect(protocol).toContain("BLOCKED names the affected action");
  expect(protocol).toContain("NEXT_AUTHORIZED_ACTION: Chat，請依原始目標與累積變更實際審查：是否造成整體飄移？");
  const full = fs.readFileSync("skill/references/full-format.md", "utf8");
  expect(full).toContain("original requirement/baseline, actual cumulative changes");
  expect(full).toContain("Forty green tests");
  expect(full).toContain("cannot prefill Chat PASS");
  expect(full).toContain("NO_DRIFT_SUPPORTED requires every relevant axis supported by read evidence");
});

it("daily requested update uses the complete installer, not optional SKILL-only copying", () => {
  const maintenance = fs.readFileSync("skill/references/maintenance.md", "utf8");
  expect(maintenance).toContain("For every requested local skill install/update, use the checkout's complete-directory helper");
  expect(maintenance).toContain("Save the previous source tree before changing the checkout");
  const chinese = fs.readFileSync("README.zh-CN.md", "utf8");
  expect(chinese).not.toContain("有新版本会自动更新");
  expect(chinese).not.toContain("已存在就 git pull 更新");
  expect(chinese).toContain("scripts/install-skill.mjs");
});

it("recognizes native and Windows connection-reference paths (portable inputs, not a Windows host run)", async () => {
  const { isConnectionReference } = await import("../scripts/install-skill.mjs");
  const path = await import("node:path");
  expect(isConnectionReference(path.join("references", "connection-and-recovery.md"))).toBe(true);
  expect(isConnectionReference(path.win32.join("references", "connection-and-recovery.md"))).toBe(true);
  expect(isConnectionReference(path.posix.join("references", "connection-and-recovery.md"))).toBe(true);
  expect(isConnectionReference(path.win32.join("references", "protocol.md"))).toBe(false);
});

it("entry and policy retain the accepted whole-drift definition", () => {
  for (const file of ["skill/SKILL.md", "skill/references/collaboration-policy.md"]) {
    const text = fs.readFileSync(file, "utf8");
    expect(text).toContain("unqualified 飄移 / drift always means overall drift");
    expect(text).toContain("whether governance work has displaced the original deliverables");
    expect(text).toContain("Latest-patch alignment or green checks alone cannot support an overall no-drift conclusion");
    expect(text).toContain("overall verdict is UNKNOWN unless already-read evidence establishes material DRIFT_FOUND");
    expect(text).toContain("never present a scoped PASS as an overall verdict");
  }
});
