import { describe, expect, it } from "vitest";
import { formatReport } from "../../src/report/index.js";
import type { ReportPayload } from "../../src/types/index.js";

const payload: ReportPayload = {
  generatedAt: "2026-01-01T00:00:00.000Z",
  toolVersion: "0.1.0",
  result: {
    source: "policy.json",
    policy: {
      source: "policy.json",
      statements: [],
      version: "2012-10-17"
    },
    findings: [
      {
        id: "1",
        ruleId: "wildcard-action",
        title: "Action wildcard",
        severity: "critical",
        statementIndex: 0,
        description: "Too broad",
        evidence: ["Action includes '*'"],
        recommendation: "Narrow actions"
      }
    ],
    risk: {
      score: 92,
      level: "critical",
      breakdown: {
        base: 28,
        findingContributions: [{ findingId: "1", severity: "critical", points: 28 }],
        adminPatternBonus: 20,
        compoundedBonus: 0
      }
    },
    suggestions: [],
    candidatePolicy: undefined
  }
};

describe("report formatting", () => {
  it("renders json and markdown", () => {
    const asJson = formatReport(payload, "json");
    const asMd = formatReport(payload, "markdown");
    expect(asJson).toContain("\"toolVersion\": \"0.1.0\"");
    expect(asMd).toContain("# PermissionGuard Report");
    expect(asMd).toContain("Action wildcard");
  });
});
