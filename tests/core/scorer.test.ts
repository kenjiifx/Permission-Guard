import { describe, expect, it } from "vitest";
import { scoreFindings } from "../../src/core/scorer.js";
import type { Finding } from "../../src/types/index.js";

const finding = (id: string, severity: Finding["severity"], ruleId = "x"): Finding => ({
  id,
  ruleId,
  title: id,
  severity,
  statementIndex: 0,
  description: id,
  evidence: [],
  recommendation: "fix"
});

describe("risk scoring", () => {
  it("compounds critical findings and caps at 100", () => {
    const risk = scoreFindings([
      finding("a", "critical", "admin-policy-pattern"),
      finding("b", "critical"),
      finding("c", "high")
    ]);
    expect(risk.score).toBeGreaterThanOrEqual(80);
    expect(risk.score).toBeLessThanOrEqual(100);
    expect(risk.level).toBe("critical");
  });

  it("returns low for empty findings", () => {
    const risk = scoreFindings([]);
    expect(risk.score).toBe(0);
    expect(risk.level).toBe("low");
  });
});
