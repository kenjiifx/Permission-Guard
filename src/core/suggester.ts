import type {
  Finding,
  NormalizedPolicyDocument,
  Suggestion,
  SuggestionConfidence
} from "../types/index.js";

function confidenceForRule(ruleId: string): SuggestionConfidence {
  if (ruleId === "wildcard-action" || ruleId === "admin-policy-pattern" || ruleId === "sensitive-actions") {
    return "manual-only";
  }
  if (ruleId === "wildcard-resource" || ruleId === "excessive-write-permissions") {
    return "review-needed";
  }
  return "safe";
}

function recommendationForFinding(finding: Finding): string {
  switch (finding.ruleId) {
    case "wildcard-action":
      return "Replace Action '*' with only required API actions per workload.";
    case "wildcard-resource":
      return "Replace Resource '*' with explicit ARN list for the intended resources.";
    case "broad-service-wildcard":
      return "Replace service wildcard with known operations (for example s3:GetObject, s3:PutObject).";
    case "sensitive-actions":
      return "Keep this action only if required, scope tightly, and add restrictive conditions.";
    case "admin-policy-pattern":
      return "Decompose this admin-like statement into task-specific statements with explicit resources.";
    case "excessive-write-permissions":
      return "Isolate mutating actions and scope them to narrow resource ARNs.";
    case "missing-resource-scoping":
      return "Use concrete service resource ARNs to reduce access blast radius.";
    case "missing-conditions-risky-pattern":
      return "Add context-aware conditions such as principal, source account, region, or tagging constraints.";
    case "allow-with-notaction":
      return "Refactor NotAction-based Allow statement into explicit Action allowlists with scoped resources.";
    case "allow-with-notresource":
      return "Replace NotResource in Allow statements with explicit resource ARN allowlists.";
    case "wildcard-principal":
      return "Replace wildcard principals with specific AWS account, role, or service principals.";
    default:
      return finding.recommendation;
  }
}

function patchFromFinding(finding: Finding): Suggestion["candidatePatch"] | undefined {
  if (finding.ruleId === "broad-service-wildcard") {
    const evidenceAction = finding.evidence.find((item) => item.startsWith("Action includes"));
    const rawAction = evidenceAction?.split("'")[1] ?? "";
    const service = rawAction.split(":")[0];
    if (!service) return undefined;
    if (service === "s3") {
      return {
        statementIndex: finding.statementIndex,
        replaceActions: ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
        note: "Candidate baseline set for common S3 read/write/list usage. Review before apply."
      };
    }
    return {
      statementIndex: finding.statementIndex,
      note: `Replace ${rawAction} with explicit ${service} actions required by your workload.`
    };
  }

  if (finding.ruleId === "wildcard-resource") {
    return {
      statementIndex: finding.statementIndex,
      replaceResources: ["arn:aws:service:region:account-id:resource-id"],
      note: "Placeholder ARN pattern generated. Replace with real resources."
    };
  }

  if (finding.ruleId === "missing-conditions-risky-pattern") {
    return {
      statementIndex: finding.statementIndex,
      addCondition: {
        StringEquals: {
          "aws:RequestedRegion": "us-east-1"
        }
      },
      note: "Example condition added as a baseline. Tailor to your environment."
    };
  }

  return undefined;
}

export function buildSuggestions(findings: Finding[]): Suggestion[] {
  return findings.map((finding) => ({
    id: `suggest-${finding.id}`,
    findingIds: [finding.id],
    confidence: confidenceForRule(finding.ruleId),
    summary: `${finding.title}: ${finding.description}`,
    recommendation: recommendationForFinding(finding),
    candidatePatch: patchFromFinding(finding)
  }));
}

export function generateCandidatePolicy(
  policy: NormalizedPolicyDocument,
  suggestions: Suggestion[]
): NormalizedPolicyDocument | undefined {
  if (suggestions.length === 0) return undefined;

  const mutableStatements = policy.statements.map((statement) => ({
    ...statement,
    actions: [...statement.actions],
    resources: [...statement.resources],
    conditions: { ...statement.conditions }
  }));

  let changed = false;
  for (const suggestion of suggestions) {
    if (suggestion.confidence === "manual-only") continue;
    const patch = suggestion.candidatePatch;
    if (!patch) continue;
    const target = mutableStatements[patch.statementIndex];
    if (!target) continue;

    if (patch.replaceActions && patch.replaceActions.length > 0) {
      target.actions = patch.replaceActions.map((action) => action.toLowerCase());
      changed = true;
    }
    if (patch.replaceResources && patch.replaceResources.length > 0) {
      target.resources = patch.replaceResources;
      changed = true;
    }
    if (patch.addCondition) {
      target.conditions = { ...target.conditions, ...patch.addCondition };
      changed = true;
    }
  }

  if (!changed) return undefined;

  return {
    ...policy,
    statements: mutableStatements
  };
}
