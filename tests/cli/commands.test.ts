import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { runScanCommand } from "../../src/cli/commands/scan.js";
import { runSuggestCommand } from "../../src/cli/commands/suggest.js";

describe("cli command flows", () => {
  it("returns strict nonzero for critical findings", async () => {
    const code = await runScanCommand("examples/admin-policy.json", {
      strict: true,
      quiet: true,
      json: false,
      color: false
    });
    expect(code).toBe(3);
  });

  it("returns zero without strict mode", async () => {
    const code = await runScanCommand("examples/broad-s3-policy.json", {
      strict: false,
      quiet: true,
      json: false,
      color: false
    });
    expect(code).toBe(0);
  });

  it("supports fail-on severity thresholds", async () => {
    const highThreshold = await runScanCommand("examples/broad-s3-policy.json", {
      failOn: "high",
      quiet: true,
      json: false,
      color: false
    });
    expect(highThreshold).toBe(2);

    const criticalThreshold = await runScanCommand("examples/broad-s3-policy.json", {
      failOn: "critical",
      quiet: true,
      json: false,
      color: false
    });
    expect(criticalThreshold).toBe(0);
  });

  it("keeps suggest candidate output as valid policy json", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "pg-suggest-"));
    const candidateOutputPath = join(tempDir, "candidate.json");
    const reportOutputPath = join(tempDir, "report.txt");

    await runSuggestCommand("examples/broad-s3-policy.json", {
      output: reportOutputPath,
      candidateOutput: candidateOutputPath,
      quiet: true,
      json: false,
      color: false
    });

    const candidateRaw = await readFile(candidateOutputPath, "utf8");
    const parsed = JSON.parse(candidateRaw) as { Statement?: unknown[] };
    expect(Array.isArray(parsed.Statement)).toBe(true);

    const reportRaw = await readFile(reportOutputPath, "utf8");
    expect(reportRaw).toContain("PermissionGuard Scan Report");
  });
});
