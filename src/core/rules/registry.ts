import type { Rule } from "../../types/index.js";

const CRITICAL_SERVICES = new Set(["iam", "organizations", "kms"]);
const WRITE_VERBS = [
  "put",
  "create",
  "update",
  "delete",
  "attach",
  "detach",
  "set",
  "modify",
  "revoke",
  "assume",
  "pass"
];

const SENSITIVE_ACTIONS = new Set([
  "iam:passrole",
  "iam:attachrolepolicy",
  "iam:putrolepolicy",
  "iam:createuser",
  "iam:createaccesskey",
  "iam:updateassumerolepolicy",
  "sts:assumerole",
  "kms:creategrant"
]);

const RESOURCE_SCOPING_CANDIDATES = ["s3:", "ec2:", "kms:", "iam:", "lambda:", "dynamodb:"];

function includesBroadServiceWildcard(action: string): boolean {
  const parts = action.split(":");
  return parts.length === 2 && parts[1] === "*";
}

function serviceFromAction(action: string): string {
  return action.split(":")[0] ?? "";
}

function isMutatingAction(action: string): boolean {
  const actionName = action.split(":")[1] ?? "";
  return WRITE_VERBS.some((verb) => actionName.startsWith(verb));
}

function hasConditions(ruleCondition: Record<string, unknown>): boolean {
  return Object.keys(ruleCondition).length > 0;
}

export const v1Rules: Rule[] = [
  {
    id: "allow-with-notaction",
    title: "Allow with NotAction may grant unexpectedly broad access",
    description: "NotAction in Allow statements can expand privileges beyond intended scope.",
    evaluate: ({ statement }) => {
      if (statement.effect !== "Allow" || statement.notActions.length === 0) return [];
      const severity = statement.resources.includes("*") ? "critical" : "high";
      return [
        {
          id: `${statement.index}-allow-notaction`,
          ruleId: "allow-with-notaction",
          title: "Allow statement uses NotAction",
          severity,
          statementIndex: statement.index,
          statementSid: statement.sid,
          description:
            "Allow + NotAction creates an exception list model that is error-prone and often broader than intended.",
          evidence: [`NotAction includes: ${statement.notActions.join(", ") || "(empty)"}`],
          recommendation:
            "Prefer explicit Action allowlists. If NotAction is required, scope resources tightly and add conditions."
        }
      ];
    }
  },
  {
    id: "allow-with-notresource",
    title: "Allow with NotResource can bypass intended scoping",
    description: "NotResource in Allow statements may unintentionally include sensitive resources.",
    evaluate: ({ statement }) => {
      if (statement.effect !== "Allow" || statement.notResources.length === 0) return [];
      return [
        {
          id: `${statement.index}-allow-notresource`,
          ruleId: "allow-with-notresource",
          title: "Allow statement uses NotResource",
          severity: "high",
          statementIndex: statement.index,
          statementSid: statement.sid,
          description:
            "Allow + NotResource grants access to all resources except exclusions, which is hard to reason about safely.",
          evidence: [`NotResource includes: ${statement.notResources.join(", ") || "(empty)"}`],
          recommendation:
            "Prefer explicit Resource allowlists with concrete ARNs and avoid exclusion-based resource logic."
        }
      ];
    }
  },
  {
    id: "wildcard-principal",
    title: "Wildcard principal grants access to any principal",
    description: "Principal '*' can expose resources broadly, especially with broad actions/resources.",
    evaluate: ({ statement }) => {
      if (statement.effect !== "Allow") return [];
      if (!statement.principals.includes("*")) return [];
      const severe = statement.actions.includes("*") || statement.resources.includes("*");
      return [
        {
          id: `${statement.index}-wildcard-principal`,
          ruleId: "wildcard-principal",
          title: "Wildcard principal",
          severity: severe ? "critical" : "high",
          statementIndex: statement.index,
          statementSid: statement.sid,
          description: "Principal '*' allows any principal to match this statement.",
          evidence: [`Principal includes '*'`, `Actions: ${statement.actions.join(", ") || "(none)"}`],
          recommendation:
            "Restrict Principal to known AWS account, role, or service principals and add context conditions."
        }
      ];
    }
  },
  {
    id: "wildcard-action",
    title: "Wildcard action allows every API operation",
    description: "Using Action '*' allows all actions and is usually an admin-level risk.",
    evaluate: ({ statement }) => {
      if (!statement.actions.includes("*")) return [];
      return [
        {
          id: `${statement.index}-wildcard-action`,
          ruleId: "wildcard-action",
          title: "Action wildcard",
          severity: "critical",
          statementIndex: statement.index,
          statementSid: statement.sid,
          description: "Action '*' allows every AWS API action in this statement.",
          evidence: ["Action includes '*'"],
          recommendation: "Replace '*' with minimal service actions required by this workflow."
        }
      ];
    }
  },
  {
    id: "wildcard-resource",
    title: "Wildcard resource allows global scope",
    description: "Resource '*' expands access beyond intended resources.",
    evaluate: ({ statement }) => {
      if (!statement.resources.includes("*")) return [];
      const hasCriticalAction =
        statement.actions.includes("*") ||
        statement.actions.some((action) => {
          const service = serviceFromAction(action);
          return CRITICAL_SERVICES.has(service);
        });
      return [
        {
          id: `${statement.index}-wildcard-resource`,
          ruleId: "wildcard-resource",
          title: "Resource wildcard",
          severity: hasCriticalAction ? "critical" : "high",
          statementIndex: statement.index,
          statementSid: statement.sid,
          description: "Resource '*' applies permissions across all matching resources.",
          evidence: ["Resource includes '*'"],
          recommendation: "Use explicit resource ARNs and split statements by resource type."
        }
      ];
    }
  },
  {
    id: "broad-service-wildcard",
    title: "Service wildcard grants all operations in a service",
    description: "Patterns like s3:* or iam:* often exceed least-privilege requirements.",
    evaluate: ({ statement }) => {
      const findings = statement.actions
        .filter(includesBroadServiceWildcard)
        .map((action) => {
          const service = serviceFromAction(action);
          return {
            id: `${statement.index}-broad-service-${action}`,
            ruleId: "broad-service-wildcard",
            title: `Broad service wildcard: ${action}`,
            severity: CRITICAL_SERVICES.has(service) ? ("critical" as const) : ("high" as const),
            statementIndex: statement.index,
            statementSid: statement.sid,
            description: `${action} grants all operations in ${service}.`,
            evidence: [`Action includes '${action}'`],
            recommendation: `Replace ${action} with the specific ${service} operations that are required.`
          };
        });
      return findings;
    }
  },
  {
    id: "sensitive-actions",
    title: "Sensitive IAM and privilege-escalation actions",
    description: "Certain actions can bypass controls or create elevated identities.",
    evaluate: ({ statement }) => {
      const matchedSensitive = statement.actions.filter(
        (action) => SENSITIVE_ACTIONS.has(action) || action === "organizations:*"
      );
      return matchedSensitive.map((action) => ({
        id: `${statement.index}-sensitive-${action}`,
        ruleId: "sensitive-actions",
        title: `Sensitive action: ${action}`,
        severity: "critical" as const,
        statementIndex: statement.index,
        statementSid: statement.sid,
        description: `${action} is commonly linked to privilege escalation or broad control changes.`,
        evidence: [`Action includes '${action}'`],
        recommendation:
          "Require explicit review, narrow resource scope, and enforce restrictive conditions for this action."
      }));
    }
  },
  {
    id: "admin-policy-pattern",
    title: "Admin-level policy behavior detected",
    description: "Allow + Action * + Resource * is effectively full admin access.",
    evaluate: ({ statement }) => {
      const isAdmin =
        statement.effect === "Allow" &&
        statement.actions.includes("*") &&
        statement.resources.includes("*");
      if (!isAdmin) return [];
      return [
        {
          id: `${statement.index}-admin-pattern`,
          ruleId: "admin-policy-pattern",
          title: "Admin policy pattern",
          severity: "critical",
          statementIndex: statement.index,
          statementSid: statement.sid,
          description: "This statement is effectively unrestricted admin access.",
          evidence: ["Effect is Allow", "Action includes '*'", "Resource includes '*'"],
          recommendation:
            "Break this statement into task-specific actions and explicit resources. Treat this as high-priority remediation."
        }
      ];
    }
  },
  {
    id: "excessive-write-permissions",
    title: "Broad mutating permissions",
    description: "Mutating actions at broad scope increase accidental or malicious impact.",
    evaluate: ({ statement }) => {
      const mutating = statement.actions.filter(isMutatingAction);
      if (mutating.length === 0) return [];
      const broadScope = statement.resources.includes("*") || statement.actions.some(includesBroadServiceWildcard);
      if (!broadScope) return [];
      return [
        {
          id: `${statement.index}-excessive-write`,
          ruleId: "excessive-write-permissions",
          title: "Excessive write permissions",
          severity: "high",
          statementIndex: statement.index,
          statementSid: statement.sid,
          description:
            "Mutating actions combined with wildcard or broad service scope increase blast radius.",
          evidence: [`Mutating actions: ${mutating.join(", ")}`, `Resources: ${statement.resources.join(", ")}`],
          recommendation:
            "Split write actions into separate statements scoped to known resource ARNs and apply least-privilege."
        }
      ];
    }
  },
  {
    id: "missing-resource-scoping",
    title: "Missing resource scoping opportunity",
    description: "Many actions can and should be narrowed from Resource '*' to explicit ARNs.",
    evaluate: ({ statement }) => {
      if (!statement.resources.includes("*")) return [];
      const scopedCandidates = statement.actions.filter((action) =>
        RESOURCE_SCOPING_CANDIDATES.some((prefix) => action.startsWith(prefix))
      );
      if (scopedCandidates.length === 0) return [];
      return [
        {
          id: `${statement.index}-missing-resource-scope`,
          ruleId: "missing-resource-scoping",
          title: "Resource scoping opportunity",
          severity: "medium",
          statementIndex: statement.index,
          statementSid: statement.sid,
          description: "Actions appear resource-scopeable, but statement uses Resource '*'.",
          evidence: [`Scopeable actions: ${scopedCandidates.join(", ")}`],
          recommendation: "Replace '*' with concrete ARNs for buckets, keys, roles, instances, or tables."
        }
      ];
    }
  },
  {
    id: "missing-conditions-risky-pattern",
    title: "Missing conditions on risky patterns",
    description: "Sensitive or broad statements without conditions are harder to constrain and audit.",
    evaluate: ({ statement }) => {
      const risky =
        statement.resources.includes("*") &&
        (statement.actions.includes("*") ||
          statement.actions.some((action) => SENSITIVE_ACTIONS.has(action) || includesBroadServiceWildcard(action)));
      if (!risky || hasConditions(statement.conditions)) return [];
      return [
        {
          id: `${statement.index}-missing-conditions`,
          ruleId: "missing-conditions-risky-pattern",
          title: "Missing condition constraints",
          severity: "high",
          statementIndex: statement.index,
          statementSid: statement.sid,
          description: "Broad or sensitive access is granted without additional condition constraints.",
          evidence: ["Condition block is empty or missing"],
          recommendation:
            "Add condition keys such as aws:PrincipalArn, aws:RequestedRegion, or service-specific constraints where feasible."
        }
      ];
    }
  }
];
