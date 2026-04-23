import chalk from "chalk";
import type { ReportPayload, ScanResult, Severity } from "../types/index.js";

function severitySummary(findings: ScanResult["findings"]): Record<Severity, number> {
  return findings.reduce<Record<Severity, number>>(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 }
  );
}

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
  const summary = severitySummary(result.findings);
  lines.push(
    `Severity Summary: critical=${summary.critical}, high=${summary.high}, medium=${summary.medium}, low=${summary.low}`
  );
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
  const summary = severitySummary(result.findings);
  lines.push(
    `- **Severity summary:** critical=${summary.critical}, high=${summary.high}, medium=${summary.medium}, low=${summary.low}`
  );
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

const sarifLevelBySeverity: Record<Severity, "note" | "warning" | "error"> = {
  low: "note",
  medium: "warning",
  high: "error",
  critical: "error"
};

export function toSarif(payload: ReportPayload): string {
  const rules = Array.from(
    new Map(
      payload.result.findings.map((finding) => [
        finding.ruleId,
        {
          id: finding.ruleId,
          name: finding.title,
          shortDescription: { text: finding.description }
        }
      ])
    ).values()
  );

  const results = payload.result.findings.map((finding) => ({
    ruleId: finding.ruleId,
    level: sarifLevelBySeverity[finding.severity],
    message: {
      text: `${finding.title}: ${finding.recommendation}`
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: payload.result.source
          },
          region: {
            startLine: finding.statementIndex + 1
          }
        }
      }
    ],
    properties: {
      severity: finding.severity,
      evidence: finding.evidence
    }
  }));

  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "PermissionGuard",
            version: payload.toolVersion,
            rules
          }
        },
        results
      }
    ]
  };
  return JSON.stringify(sarif, null, 2);
}
