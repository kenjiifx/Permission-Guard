import type { BatchScanResult, Severity } from "../types/index.js";

function severitySummary(findings: BatchScanResult["findings"]): Record<Severity, number> {
  return findings.reduce<Record<Severity, number>>(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 }
  );
}

export function formatBatchTerminal(result: BatchScanResult): string {
  const summary = severitySummary(result.findings);
  const lines: string[] = [];
  lines.push("PermissionGuard Batch Report");
  lines.push(`Target: ${result.target}`);
  lines.push(`Scanned files: ${result.scannedFiles}`);
  lines.push(`Successful scans: ${result.successfulScans}`);
  lines.push(`Failed scans: ${result.failedScans.length}`);
  lines.push(`Aggregated risk: ${result.aggregatedRisk.score}/100 (${result.aggregatedRisk.level})`);
  lines.push(
    `Severity summary: critical=${summary.critical}, high=${summary.high}, medium=${summary.medium}, low=${summary.low}`
  );
  lines.push("");

  if (result.failedScans.length > 0) {
    lines.push("Failed files:");
    for (const failed of result.failedScans) {
      lines.push(`- ${failed.source}: ${failed.error}`);
    }
    lines.push("");
  }

  if (result.results.length > 0) {
    lines.push("Top risky files:");
    const ranked = [...result.results]
      .sort((a, b) => b.risk.score - a.risk.score)
      .slice(0, 10)
      .map((scan) => `- ${scan.source}: risk=${scan.risk.score}, findings=${scan.findings.length}`);
    lines.push(...ranked);
  } else {
    lines.push("No valid IAM policies were scanned.");
  }

  return lines.join("\n");
}

export function formatBatchMarkdown(result: BatchScanResult): string {
  const summary = severitySummary(result.findings);
  const lines: string[] = [];
  lines.push("# PermissionGuard Batch Report");
  lines.push("");
  lines.push(`- **Target:** ${result.target}`);
  lines.push(`- **Scanned files:** ${result.scannedFiles}`);
  lines.push(`- **Successful scans:** ${result.successfulScans}`);
  lines.push(`- **Failed scans:** ${result.failedScans.length}`);
  lines.push(`- **Aggregated risk:** ${result.aggregatedRisk.score}/100 (${result.aggregatedRisk.level})`);
  lines.push(
    `- **Severity summary:** critical=${summary.critical}, high=${summary.high}, medium=${summary.medium}, low=${summary.low}`
  );
  lines.push("");

  lines.push("## Top Risky Files");
  lines.push("");
  const ranked = [...result.results]
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 10);
  if (ranked.length === 0) {
    lines.push("No valid IAM policies were scanned.");
  } else {
    for (const scan of ranked) {
      lines.push(`- \`${scan.source}\`: risk=${scan.risk.score}, findings=${scan.findings.length}`);
    }
  }
  lines.push("");

  if (result.failedScans.length > 0) {
    lines.push("## Failed Files");
    lines.push("");
    for (const failed of result.failedScans) {
      lines.push(`- \`${failed.source}\`: ${failed.error}`);
    }
  }
  return lines.join("\n");
}

export function formatBatchJson(result: BatchScanResult): string {
  return JSON.stringify(result, null, 2);
}
