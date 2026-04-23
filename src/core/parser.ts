import { z } from "zod";
import type { NormalizedPolicyDocument, NormalizedStatement } from "../types/index.js";

const maybeArray = z.union([z.string(), z.array(z.string())]).optional();

const statementSchema = z
  .object({
    Sid: z.string().optional(),
    Effect: z.enum(["Allow", "Deny"]),
    Action: maybeArray,
    NotAction: maybeArray,
    Resource: maybeArray,
    NotResource: maybeArray,
    Principal: z.unknown().optional(),
    Condition: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough();

const policySchema = z.object({
  Version: z.string().optional(),
  Id: z.string().optional(),
  Statement: z.union([statementSchema, z.array(statementSchema)])
});

function normalizeStringArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.map((entry) => entry.trim()).filter(Boolean);
  return [value.trim()].filter(Boolean);
}

function normalizePrincipal(value: unknown): string[] {
  if (value === undefined) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string");
  if (typeof value !== "object" || value === null) return [];

  return Object.entries(value).flatMap(([, principalValue]) => {
    if (typeof principalValue === "string") return [principalValue];
    if (Array.isArray(principalValue)) {
      return principalValue.filter((entry): entry is string => typeof entry === "string");
    }
    return [];
  });
}

export function parsePolicyFromUnknown(input: unknown, source: string): NormalizedPolicyDocument {
  const parsed = policySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid IAM policy JSON: ${parsed.error.issues[0]?.message ?? "Unknown issue"}`);
  }

  const statements = Array.isArray(parsed.data.Statement)
    ? parsed.data.Statement
    : [parsed.data.Statement];

  const normalizedStatements: NormalizedStatement[] = statements.map((statement, index) => ({
    sid: statement.Sid,
    effect: statement.Effect,
    actions: normalizeStringArray(statement.Action).map((item) => item.toLowerCase()),
    notActions: normalizeStringArray(statement.NotAction).map((item) => item.toLowerCase()),
    resources: normalizeStringArray(statement.Resource),
    notResources: normalizeStringArray(statement.NotResource),
    principals: normalizePrincipal(statement.Principal),
    conditions: statement.Condition ?? {},
    raw: statement,
    index
  }));

  return {
    version: parsed.data.Version,
    id: parsed.data.Id,
    source,
    statements: normalizedStatements
  };
}
