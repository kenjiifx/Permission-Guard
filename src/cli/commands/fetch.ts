import { fetchRolePolicies } from "../../aws/iam.js";
import { writeJsonFile } from "../../utils/io.js";

export async function runFetchCommand(roleName: string, output?: string): Promise<number> {
  const result = await fetchRolePolicies(roleName);
  const payload = {
    fetchedAt: new Date().toISOString(),
    roleName: result.roleName,
    roleArn: result.roleArn,
    policyCount: result.policies.length,
    policies: result.policies
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  if (output) {
    await writeJsonFile(output, payload);
  }
  return 0;
}
