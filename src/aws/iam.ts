import {
  GetPolicyCommand,
  GetPolicyVersionCommand,
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand
} from "@aws-sdk/client-iam";
import type { RolePolicyFetchResult } from "../types/index.js";

function decodePolicyDocument(document: string | undefined): unknown {
  if (!document) return {};
  const decoded = decodeURIComponent(document);
  return JSON.parse(decoded);
}

async function listAllInlinePolicyNames(iam: IAMClient, roleName: string): Promise<string[]> {
  const names: string[] = [];
  let marker: string | undefined;
  do {
    const page = await iam.send(new ListRolePoliciesCommand({ RoleName: roleName, Marker: marker }));
    names.push(...(page.PolicyNames ?? []));
    marker = page.IsTruncated ? page.Marker : undefined;
  } while (marker);
  return names;
}

async function listAllAttachedPolicies(
  iam: IAMClient,
  roleName: string
): Promise<Array<{ PolicyArn?: string; PolicyName?: string }>> {
  const policies: Array<{ PolicyArn?: string; PolicyName?: string }> = [];
  let marker: string | undefined;
  do {
    const page = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName, Marker: marker }));
    policies.push(...(page.AttachedPolicies ?? []));
    marker = page.IsTruncated ? page.Marker : undefined;
  } while (marker);
  return policies;
}

export async function fetchRolePolicies(roleName: string): Promise<RolePolicyFetchResult> {
  try {
    const iam = new IAMClient({});
    const role = await iam.send(new GetRoleCommand({ RoleName: roleName }));

    const inlinePolicyNames = await listAllInlinePolicyNames(iam, roleName);
    const attachedPolicies = await listAllAttachedPolicies(iam, roleName);

    const inlineDocs = await Promise.all(
      inlinePolicyNames.map(async (policyName) => {
        const policy = await iam.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: policyName }));
        return {
          name: policyName,
          document: decodePolicyDocument(policy.PolicyDocument),
          source: "inline"
        };
      })
    );

    const attachedDocs = await Promise.all(
      attachedPolicies.map(async (policyRef) => {
        if (!policyRef.PolicyArn || !policyRef.PolicyName) return null;
        const policy = await iam.send(new GetPolicyCommand({ PolicyArn: policyRef.PolicyArn }));
        const versionId = policy.Policy?.DefaultVersionId;
        if (!versionId) return null;
        const version = await iam.send(
          new GetPolicyVersionCommand({ PolicyArn: policyRef.PolicyArn, VersionId: versionId })
        );
        return {
          name: policyRef.PolicyName,
          document: decodePolicyDocument(version.PolicyVersion?.Document),
          source: "managed-attached"
        };
      })
    );

    return {
      roleName,
      roleArn: role.Role?.Arn,
      policies: [...inlineDocs, ...attachedDocs.filter((item): item is NonNullable<typeof item> => Boolean(item))]
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AWS IAM error";
    throw new Error(`Failed to fetch policies for role '${roleName}': ${message}`, {
      cause: error
    });
  }
}
