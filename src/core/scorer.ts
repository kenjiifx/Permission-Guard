import type { Finding, RiskScore, Severity } from "../types/index.js";

const severityWeight: Record<Severity, number> = {
  low: 5,
  medium: 10,
  high: 18,
  critical: 28
};

function riskLevel(score: number): RiskScore["level"] {
  if (score >= 80) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

export function scoreFindings(findings: Finding[]): RiskScore {
  const contributions = findings.map((finding) => ({
    findingId: finding.id,
    severity: finding.severity,
    points: severityWeight[finding.severity]
  }));

  const base = contributions.reduce((sum, entry) => sum + entry.points, 0);
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const adminPatternBonus = findings.some((f) => f.ruleId === "admin-policy-pattern") ? 20 : 0;
  const compoundedBonus = criticalCount > 1 ? Math.min(15, (criticalCount - 1) * 5) : 0;
  const score = Math.min(100, base + adminPatternBonus + compoundedBonus);

  return {
    score,
    level: riskLevel(score),
    breakdown: {
      base,
      findingContributions: contributions,
      adminPatternBonus,
      compoundedBonus
    }
  };
}
