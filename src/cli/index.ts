#!/usr/bin/env node
import { Command } from "commander";
import { runScanCommand } from "./commands/scan.js";
import { runSuggestCommand } from "./commands/suggest.js";
import { runReportCommand } from "./commands/report.js";
import { runFetchCommand } from "./commands/fetch.js";
import { runExplainCommand } from "./commands/explain.js";
import { runBatchCommand } from "./commands/batch.js";
import type { ReportFormat } from "../report/index.js";
import { loadPermissionGuardConfig, mergeFlagsWithConfig } from "./config.js";

const program = new Command();
const ALLOWED_REPORT_FORMATS: ReportFormat[] = ["terminal", "json", "markdown", "sarif"];
const ALLOWED_BATCH_FORMATS = ["terminal", "json", "markdown"] as const;

program
  .name("permissionguard")
  .description("Detect overly broad AWS IAM permissions and generate safer reviewable suggestions.")
  .version("0.1.0");

function withCommonFlags(command: Command): Command {
  return command
    .option("--role <roleName>", "Fetch and analyze policies attached to an IAM role")
    .option("--strict", "Exit non-zero when medium/high/critical findings are detected")
    .option("--fail-on <severity>", "Exit non-zero when finding severity meets threshold")
    .option("--min-severity <severity>", "Only include findings at or above severity threshold")
    .option("--quiet", "Suppress terminal output")
    .option("--json", "Emit JSON output")
    .option("--output <path>", "Write output to file")
    .option("--no-color", "Disable colored output");
}

withCommonFlags(program.command("scan [input]").description("Scan a local IAM policy file or IAM role"))
  .action(async (input, options) => {
    try {
      const merged = mergeFlagsWithConfig(options, await loadPermissionGuardConfig());
      process.exitCode = await runScanCommand(input, merged);
    } catch (error) {
      process.stderr.write(`Error: ${(error as Error).message}\n`);
      process.exitCode = 1;
    }
  });

withCommonFlags(
  program.command("suggest [input]").description("Generate findings, risk score, and candidate safer policy")
    .option("--candidate-output <path>", "Write generated candidate policy JSON to file")
).action(async (input, options) => {
  try {
    const merged = mergeFlagsWithConfig(options, await loadPermissionGuardConfig());
    process.exitCode = await runSuggestCommand(input, merged);
  } catch (error) {
    process.stderr.write(`Error: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
});

withCommonFlags(
  program
    .command("report [input]")
    .description("Generate findings report in terminal, JSON, Markdown, or SARIF")
    .option(
      "--format <format>",
      "terminal|json|markdown|sarif",
      (value: string): ReportFormat => {
        if (!ALLOWED_REPORT_FORMATS.includes(value as ReportFormat)) {
          throw new Error(`Invalid --format '${value}'. Use terminal, json, markdown, or sarif.`);
        }
        return value as ReportFormat;
      },
      "terminal"
    )
).action(async (input, options: { format: ReportFormat }) => {
  try {
    const config = await loadPermissionGuardConfig();
    const merged = mergeFlagsWithConfig(options as { format: ReportFormat }, config);
    merged.format = options.format ?? config.reportFormat ?? "terminal";
    process.exitCode = await runReportCommand(input, merged as { format: ReportFormat });
  } catch (error) {
    process.stderr.write(`Error: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
});

program
  .command("fetch")
  .description("Fetch inline and attached managed policies for an IAM role")
  .requiredOption("--role <roleName>", "Role name to fetch")
  .option("--output <path>", "Write fetched payload to file")
  .action(async (options: { role: string; output?: string }) => {
    try {
      process.exitCode = await runFetchCommand(options.role, options.output);
    } catch (error) {
      process.stderr.write(`Error: ${(error as Error).message}\n`);
      process.exitCode = 1;
    }
  });

withCommonFlags(
  program
    .command("batch <target>")
    .description("Scan all JSON policy files under a directory or single file")
    .option(
      "--format <format>",
      "terminal|json|markdown",
      (value: string): "terminal" | "json" | "markdown" => {
        if (!ALLOWED_BATCH_FORMATS.includes(value as (typeof ALLOWED_BATCH_FORMATS)[number])) {
          throw new Error(`Invalid --format '${value}'. Use terminal, json, or markdown.`);
        }
        return value as "terminal" | "json" | "markdown";
      },
      "terminal"
    )
).action(async (target, options: { format: "terminal" | "json" | "markdown" }) => {
  try {
    const config = await loadPermissionGuardConfig();
    const merged = mergeFlagsWithConfig(options, config);
    merged.format = options.format ?? config.batchFormat ?? "terminal";
    process.exitCode = await runBatchCommand(target, merged as { format: "terminal" | "json" | "markdown" });
  } catch (error) {
    process.stderr.write(`Error: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
});

program
  .command("explain [ruleId]")
  .description("List available detection rules or explain a specific rule")
  .action(async (ruleId?: string) => {
    try {
      process.exitCode = await runExplainCommand(ruleId);
    } catch (error) {
      process.stderr.write(`Error: ${(error as Error).message}\n`);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv).catch((error: Error) => {
  process.stderr.write(`Unhandled error: ${error.message}\n`);
  process.exitCode = 1;
});
