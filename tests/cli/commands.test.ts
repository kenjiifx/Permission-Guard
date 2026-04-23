import { describe, expect, it } from "vitest";
import { runScanCommand } from "../../src/cli/commands/scan.js";

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
});
