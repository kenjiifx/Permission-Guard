import chalk from "chalk";
import type { ReportPayload, ScanResult, Severity } from "../types/index.js";

function badge(severity: Severity, colorize: boolean): string {
  const value = severity.toUpperCase();
  if (!colorize) return `[${value}]`;
  switch (severity) {
    case "critical":
      return chalk.bgRed.black(` ${value} `);
    case "high":
      return chalk.bgYellow.black(` ${value} `);
    case "medium":
      return chalk.bgBlue.white(` ${value} `);
    default:
      return chalk.bgGray.white(` ${value} `);
  }
}

export function toTerminal(result: ScanResult, opts?: { color?: boolean }): string {
  const colorize = opts?.color ?? true;
  const lines: string[] = [];
  lines.push("PermissionGuard Scan Report");
  lines.push(`Source: ${result.source}`);
  lines.push(`Risk Score: ${result.risk.score}/100 (${result.risk.level})`);
  lines.push(`Findings: ${result.findings.length}`);
  lines.push("");

  if (result.findings.length === 0) {
    lines.push("No risky patterns detected by current rule set.");
  } else {
    for (const finding of result.findings) {
      lines.push(`${badge(finding.severity, colorize)} ${finding.title}`);
      lines.push(`  Why it matters: ${finding.description}`);
      lines.push(`  Evidence: ${finding.evidence.join(" | ")}`);
      lines.push(`  Recommendation: ${finding.recommendation}`);
      lines.push("");
    }
  }

  if (result.candidatePolicy) {
    lines.push("Candidate safer policy can be generated with `suggest` mode.");
  }

  return lines.join("\n");
}

export function toJson(payload: ReportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function toMarkdown(payload: ReportPayload): string {
  const { result } = payload;
  const lines: string[] = [];
  lines.push("# PermissionGuard Report");
  lines.push("");
  lines.push(`- **Generated:** ${payload.generatedAt}`);
  lines.push(`- **Source:** ${result.source}`);
  lines.push(`- **Risk score:** ${result.risk.score}/100 (${result.risk.level})`);
  lines.push(`- **Findings:** ${result.findings.length}`);
  lines.push("");
  lines.push("## Findings");
  lines.push("");

  if (result.findings.length === 0) {
    lines.push("No findings under current rule set.");
  } else {
    for (const finding of result.findings) {
      lines.push(`### ${finding.title} (${finding.severity.toUpperCase()})`);
      lines.push("");
      lines.push(`- **Statement index:** ${finding.statementIndex}`);
      lines.push(`- **Why it matters:** ${finding.description}`);
      lines.push(`- **Evidence:** ${finding.evidence.join("; ")}`);
      lines.push(`- **Recommendation:** ${finding.recommendation}`);
      lines.push("");
    }
  }

  lines.push("## Suggestions");
  lines.push("");
  if (result.suggestions.length === 0) {
    lines.push("No suggestions generated.");
  } else {
    for (const suggestion of result.suggestions) {
      lines.push(
        `- **${suggestion.confidence}**: ${suggestion.summary} Recommended action: ${suggestion.recommendation}`
      );
    }
  }

  return lines.join("\n");
}
