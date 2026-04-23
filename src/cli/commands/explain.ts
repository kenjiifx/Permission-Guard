import { v1Rules } from "../../core/rules/registry.js";

export async function runExplainCommand(ruleId?: string): Promise<number> {
  if (!ruleId) {
    const lines: string[] = [];
    lines.push("PermissionGuard Rules");
    lines.push("");
    for (const rule of v1Rules) {
      lines.push(`- ${rule.id}: ${rule.title}`);
    }
    lines.push("");
    lines.push("Use `permissionguard explain <rule-id>` for details.");
    process.stdout.write(`${lines.join("\n")}\n`);
    return 0;
  }

  const rule = v1Rules.find((candidate) => candidate.id === ruleId);
  if (!rule) {
    throw new Error(`Unknown rule '${ruleId}'. Run 'permissionguard explain' to list available rule IDs.`);
  }

  const lines: string[] = [];
  lines.push(`Rule: ${rule.id}`);
  lines.push(`Title: ${rule.title}`);
  lines.push(`Description: ${rule.description}`);
  process.stdout.write(`${lines.join("\n")}\n`);
  return 0;
}
