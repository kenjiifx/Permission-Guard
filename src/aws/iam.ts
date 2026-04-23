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

export async function fetchRolePolicies(roleName: string): Promise<RolePolicyFetchResult> {
  const iam = new IAMClient({});
  const role = await iam.send(new GetRoleCommand({ RoleName: roleName }));

  const inlinePolicyNames = await iam.send(new ListRolePoliciesCommand({ RoleName: roleName }));
  const attachedPolicies = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));

  const inlineDocs = await Promise.all(
    (inlinePolicyNames.PolicyNames ?? []).map(async (policyName) => {
      const policy = await iam.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: policyName }));
      return {
        name: policyName,
        document: decodePolicyDocument(policy.PolicyDocument),
        source: "inline"
      };
    })
  );

  const attachedDocs = await Promise.all(
    (attachedPolicies.AttachedPolicies ?? []).map(async (policyRef) => {
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
}
