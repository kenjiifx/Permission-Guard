import type { NormalizedPolicyDocument } from "../types/index.js";

export function toIamJson(policy: NormalizedPolicyDocument): Record<string, unknown> {
  return {
    ...(policy.version ? { Version: policy.version } : {}),
    ...(policy.id ? { Id: policy.id } : {}),
    Statement: policy.statements.map((statement) => ({
      ...(statement.sid ? { Sid: statement.sid } : {}),
      Effect: statement.effect,
      ...(statement.actions.length === 1
        ? { Action: statement.actions[0] }
        : statement.actions.length > 1
          ? { Action: statement.actions }
          : {}),
      ...(statement.notActions.length === 1
        ? { NotAction: statement.notActions[0] }
        : statement.notActions.length > 1
          ? { NotAction: statement.notActions }
          : {}),
      ...(statement.resources.length === 1
        ? { Resource: statement.resources[0] }
        : statement.resources.length > 1
          ? { Resource: statement.resources }
          : {}),
      ...(statement.notResources.length === 1
        ? { NotResource: statement.notResources[0] }
        : statement.notResources.length > 1
          ? { NotResource: statement.notResources }
          : {}),
      ...(Object.keys(statement.conditions).length > 0 ? { Condition: statement.conditions } : {})
    }))
  };
}
