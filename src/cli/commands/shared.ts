import { parsePolicyFromUnknown } from "../../core/parser.js";
import { fetchRolePolicies } from "../../aws/iam.js";
import type { NormalizedPolicyDocument, ReportPayload, ScanResult } from "../../types/index.js";
import { formatReport, type ReportFormat } from "../../report/index.js";
import { readJsonFile, readJsonFromStdin, writeJsonFile, writeTextFile } from "../../utils/io.js";
import { toIamJson } from "../../core/diff.js";

export const TOOL_VERSION = "0.1.0";

export interface CommonFlags {
  output?: string;
  strict?: boolean;
  quiet?: boolean;
  json?: boolean;
  color?: boolean;
  role?: string;
}

export async function loadPolicyInput(input: string | undefined, roleName?: string): Promise<NormalizedPolicyDocument> {
  if (roleName) {
    const roleData = await fetchRolePolicies(roleName);
    const combined = {
      Version: "2012-10-17",
      Statement: roleData.policies.flatMap((policy) => {
        const document = policy.document as Record<string, unknown>;
        const statements = document.Statement;
        if (Array.isArray(statements)) return statements;
        if (statements && typeof statements === "object") return [statements];
        return [];
      })
    };
    return parsePolicyFromUnknown(combined, `aws:role/${roleName}`);
  }

  if (input === "-" || (!input && !process.stdin.isTTY)) {
    const data = await readJsonFromStdin();
    return parsePolicyFromUnknown(data, "stdin");
  }
  if (!input) throw new Error("Provide <input> policy path, --role, or STDIN JSON.");

  const data = await readJsonFile(input);
  return parsePolicyFromUnknown(data, input);
}

export function buildPayload(result: ScanResult): ReportPayload {
  return {
    generatedAt: new Date().toISOString(),
    toolVersion: TOOL_VERSION,
    result
  };
}

export function strictExitCode(result: ScanResult, strict: boolean | undefined): number {
  if (!strict) return 0;
  const hasCritical = result.findings.some((finding) => finding.severity === "critical");
  if (hasCritical) return 3;
  const hasBlocking = result.findings.some((finding) => finding.severity === "high" || finding.severity === "medium");
  return hasBlocking ? 2 : 0;
}

export async function emitReport(
  payload: ReportPayload,
  format: ReportFormat,
  flags: CommonFlags
): Promise<void> {
  const output = formatReport(payload, format, { color: flags.color ?? true });
  if (!flags.quiet) {
    process.stdout.write(`${output}\n`);
  }
  if (flags.output) {
    if (format === "json") await writeJsonFile(flags.output, JSON.parse(output));
    else await writeTextFile(flags.output, output);
  }
}

export async function writeCandidatePolicy(
  path: string | undefined,
  candidate: NormalizedPolicyDocument | undefined
): Promise<string | undefined> {
  if (!candidate) return undefined;
  const out = path ?? "permissionguard.candidate-policy.json";
  await writeJsonFile(out, toIamJson(candidate));
  return out;
}
