import { runScan } from "../../core/engine.js";
import { buildPayload, emitReport, loadPolicyInput, strictExitCode, type CommonFlags } from "./shared.js";

export async function runScanCommand(input: string | undefined, flags: CommonFlags): Promise<number> {
  const policy = await loadPolicyInput(input, flags.role);
  const result = runScan(policy);
  const format = flags.json ? "json" : "terminal";
  await emitReport(buildPayload(result), format, flags);
  return strictExitCode(result, flags.strict);
}
