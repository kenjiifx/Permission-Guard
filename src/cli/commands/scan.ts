import { runScan } from "../../core/engine.js";
import {
  applyResultFilters,
  buildPayload,
  emitReport,
  exitCodeForFindings,
  loadPolicyInput,
  type CommonFlags
} from "./shared.js";

export async function runScanCommand(input: string | undefined, flags: CommonFlags): Promise<number> {
  const policy = await loadPolicyInput(input, flags.role);
  const result = applyResultFilters(runScan(policy), flags);
  const format = flags.json ? "json" : "terminal";
  await emitReport(buildPayload(result), format, flags);
  return exitCodeForFindings(result, flags);
}
