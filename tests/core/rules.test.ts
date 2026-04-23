import { describe, expect, it } from "vitest";
import { parsePolicyFromUnknown } from "../../src/core/parser.js";
import { analyzePolicy } from "../../src/core/analyzer.js";

describe("rule engine", () => {
  it("detects admin-level wildcard policy", () => {
    const policy = parsePolicyFromUnknown(
      {
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }]
      },
      "admin"
    );
    const findings = analyzePolicy(policy);
    expect(findings.some((f) => f.ruleId === "wildcard-action")).toBe(true);
    expect(findings.some((f) => f.ruleId === "admin-policy-pattern")).toBe(true);
  });

  it("detects broad service wildcard and missing condition", () => {
    const policy = parsePolicyFromUnknown(
      {
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: "s3:*", Resource: "*" }]
      },
      "broad"
    );
    const findings = analyzePolicy(policy);
    expect(findings.some((f) => f.ruleId === "broad-service-wildcard")).toBe(true);
    expect(findings.some((f) => f.ruleId === "missing-conditions-risky-pattern")).toBe(true);
  });

  it("detects sensitive IAM actions", () => {
    const policy = parsePolicyFromUnknown(
      {
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: ["iam:PassRole"], Resource: "*" }]
      },
      "sensitive"
    );
    const findings = analyzePolicy(policy);
    expect(findings.some((f) => f.ruleId === "sensitive-actions")).toBe(true);
  });
});
