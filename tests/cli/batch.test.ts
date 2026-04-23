import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { runBatchCommand } from "../../src/cli/commands/batch.js";

const adminPolicy = JSON.stringify({
  Version: "2012-10-17",
  Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }]
});

const scopedPolicy = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: ["s3:GetObject"],
      Resource: ["arn:aws:s3:::bucket/*"]
    }
  ]
});

describe("batch command", () => {
  it("scans multiple files and returns nonzero by fail-on threshold", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pg-batch-"));
    await writeFile(join(dir, "admin.json"), adminPolicy, "utf8");
    await writeFile(join(dir, "scoped.json"), scopedPolicy, "utf8");

    const code = await runBatchCommand(dir, {
      format: "json",
      quiet: true,
      failOn: "high"
    });
    expect(code).toBe(2);
  });
});
