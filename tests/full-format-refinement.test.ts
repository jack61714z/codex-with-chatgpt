import fs from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

// Static document requirements only. These tests do not prove host loading,
// agent decisions, external review completion, or merge permission.
const canonical = fs.readFileSync("skill/references/full-format.md", "utf8");
const result = canonical.split("## 2. Codex EXECUTION_RESULT")[1]?.split("## 3. Chat CHAT_REVIEW")[0] ?? "";
function slot(name: string): string {
  const match = result.match(new RegExp(`^${name}:([^\\n]*(?:\\n(?![A-Z][A-Z_]+:|\\x60\\x60\\x60)[^\\n]*)*)`, "m"));
  return match?.[1] ?? "";
}

describe("canonical refinement: static contract requirements", () => {
  it("separates implementation, Chat review, external review and merge eligibility evidence and pending items", () => {
    expect(result).toMatch(/implementation/i);
    expect(result).toMatch(/Chat[ _-]+review/i);
    expect(result).toMatch(/external[ _-]+review/i);
    expect(result).toMatch(/merge[ _-]+eligib/i);
    expect(result).toMatch(/pending/i);
  });

  it("invariant impact names mistaken assumptions, same-root siblings and inspection boundary", () => {
    const impact = slot("INVARIANT_IMPACT");
    expect(impact).toMatch(/assumptions?|premises?/i);
    expect(impact).toMatch(/mistaken|incorrect|invalid|false/i);
    expect(impact).toMatch(/same[ _-]+root/i);
    expect(impact).toMatch(/siblings?/i);
    expect(impact).toMatch(/boundar/i);
  });

  it("checks include counterexample preconditions, expected/actual observations and fixture validity", () => {
    const checks = slot("CHECKS");
    expect(checks).toMatch(/counterexamples?/i);
    expect(checks).toMatch(/preconditions?/i);
    expect(checks).toMatch(/expected/i);
    expect(checks).toMatch(/actual/i);
    expect(checks).toMatch(/fixtures?/i);
    expect(checks).toContain("evidence that the fixture really constructs the claimed condition rather than merely naming it");
  });

  it("findings compare current main/successor fixes before repair and separate ownership tracking from residual defects", () => {
    const findings = slot("FINDINGS_AND_DISPOSITION");
    expect(findings).toMatch(/current[ _-]+main/i);
    expect(findings).toMatch(/successor/i);
    expect(findings).toMatch(/before/i);
    expect(findings).toMatch(/repair|fix/i);
    expect(findings).toMatch(/ownership/i);
    expect(findings).toMatch(/tracking[ _-]+ownership/i);
    expect(findings).toMatch(/remaining|residual/i);
    expect(findings).toMatch(/defects?|bugs?/i);
  });
});


it("binds exact canonical bytes and public repository provenance", () => {
  const metadata = JSON.parse(fs.readFileSync("skill/references/approved-source.json", "utf8"));
  const raw = fs.readFileSync(`skill/${metadata.canonical_path}`);
  expect(metadata.format_version).toBe("1.0.1");
  expect(metadata.package_version).toBe("0.3.2");
  expect(raw.length).toBe(13197);
  expect(createHash("sha256").update(raw).digest("hex"))
    .toBe("b3c06134818c0e6d5725b207c1c87e05858b661f7ce23973ca30d241dc17b663");
  expect(metadata.sha256).toBe(createHash("sha256").update(raw).digest("hex"));
  expect(metadata.source.kind).toBe("repository-copy");
  expect(metadata.source.repository).toBe("https://github.com/jack61714z/codex-with-chatgpt");
  expect(metadata.source.path).toBe("skill/references/full-format.md");
  expect(metadata.source.description).toContain("does not prove host activation or remote publication");
  expect(metadata.source).not.toHaveProperty("basis_release");
  expect(metadata.source).not.toHaveProperty("published_release");
  expect(canonical).toContain("This separation adds no protocol state, review requirement or approval gate.");
});
