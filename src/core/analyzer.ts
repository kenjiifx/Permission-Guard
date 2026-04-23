import { v1Rules } from "./rules/registry.js";
import type { Finding, NormalizedPolicyDocument, Rule } from "../types/index.js";

export interface AnalyzeOptions {
  rules?: Rule[];
}

export function analyzePolicy(policy: NormalizedPolicyDocument, options?: AnalyzeOptions): Finding[] {
  const rules = options?.rules ?? v1Rules;
  const findings: Finding[] = [];

  for (const statement of policy.statements) {
    for (const rule of rules) {
      const ruleFindings = rule.evaluate({ policy, statement });
      findings.push(...ruleFindings);
    }
  }

  return findings;
}
