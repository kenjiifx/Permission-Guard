import { analyzePolicy } from "./analyzer.js";
import { scoreFindings } from "./scorer.js";
import { buildSuggestions, generateCandidatePolicy } from "./suggester.js";
import type { NormalizedPolicyDocument, ScanResult } from "../types/index.js";

export function runScan(policy: NormalizedPolicyDocument): ScanResult {
  const findings = analyzePolicy(policy);
  const risk = scoreFindings(findings);
  const suggestions = buildSuggestions(findings);
  const candidatePolicy = generateCandidatePolicy(policy, suggestions);
  return {
    source: policy.source,
    policy,
    findings,
    risk,
    suggestions,
    candidatePolicy
  };
}
