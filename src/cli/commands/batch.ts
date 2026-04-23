import { writeJsonFile, writeTextFile } from "../../utils/io.js";
import { discoverPolicyJsonFiles } from "../../utils/files.js";
import { runBatchScan } from "../../core/batch.js";
import { scoreFindings } from "../../core/scorer.js";
import { formatBatchJson, formatBatchMarkdown, formatBatchTerminal } from "../../report/batch.js";
import { applyResultFilters, exitCodeForFindings, type CommonFlags } from "./shared.js";
import type { ReportFormat } from "../../report/index.js";

export async function runBatchCommand(
  target: string,
  flags: CommonFlags & { format: Exclude<ReportFormat, "sarif"> }
): Promise<number> {
  const files = await discoverPolicyJsonFiles(target);
  if (files.length === 0) {
    throw new Error(`No JSON policy files found in '${target}'.`);
  }

  const batch = await runBatchScan(target, files);
  const filtered = {
    ...batch,
    results: batch.results.map((result) => applyResultFilters(result, flags))
  };
  filtered.findings = filtered.results.flatMap((result) => result.findings);
  filtered.aggregatedRisk = scoreFindings(filtered.findings);

  const output =
    flags.format === "json"
      ? formatBatchJson(filtered)
      : flags.format === "markdown"
        ? formatBatchMarkdown(filtered)
        : formatBatchTerminal(filtered);

  if (!flags.quiet) {
    process.stdout.write(`${output}\n`);
  }
  if (flags.output) {
    if (flags.format === "json") await writeJsonFile(flags.output, JSON.parse(output));
    else await writeTextFile(flags.output, output);
  }

  const strongestExit = filtered.results.reduce((acc, result) => Math.max(acc, exitCodeForFindings(result, flags)), 0);
  return strongestExit;
}
