import { describe, expect, it } from "vitest";
import { buildSuggestions, generateCandidatePolicy } from "../../src/core/suggester.js";
import { parsePolicyFromUnknown } from "../../src/core/parser.js";
import type { Finding } from "../../src/types/index.js";

describe("suggestion engine", () => {
  it("marks wildcard action as manual-only", () => {
    const findings: Finding[] = [
      {
        id: "x",
        ruleId: "wildcard-action",
        title: "wild",
        severity: "critical",
        statementIndex: 0,
        description: "d",
        evidence: [],
        recommendation: "r"
      }
    ];
    const suggestions = buildSuggestions(findings);
    expect(suggestions[0]?.confidence).toBe("manual-only");
  });

  it("creates candidate policy for review-safe patches", () => {
    const policy = parsePolicyFromUnknown(
      {
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: "s3:*", Resource: "*" }]
      },
      "input"
    );
    const findings: Finding[] = [
      {
        id: "f1",
        ruleId: "broad-service-wildcard",
        title: "s3 broad",
        severity: "high",
        statementIndex: 0,
        description: "d",
        evidence: ["Action includes 's3:*'"],
        recommendation: "r"
      },
      {
        id: "f2",
        ruleId: "wildcard-resource",
        title: "resource broad",
        severity: "high",
        statementIndex: 0,
        description: "d",
        evidence: [],
        recommendation: "r"
      }
    ];
    const suggestions = buildSuggestions(findings);
    const candidate = generateCandidatePolicy(policy, suggestions);
    expect(candidate).toBeDefined();
    expect(candidate?.statements[0]?.actions).toContain("s3:getobject");
  });
});
