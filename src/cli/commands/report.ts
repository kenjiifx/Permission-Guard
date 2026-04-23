import { runScan } from "../../core/engine.js";
import { applyResultFilters, buildPayload, emitReport, loadPolicyInput, type CommonFlags } from "./shared.js";
import type { ReportFormat } from "../../report/index.js";

export async function runReportCommand(
  input: string | undefined,
  flags: CommonFlags & { format: ReportFormat }
): Promise<number> {
  const policy = await loadPolicyInput(input, flags.role);
  const result = applyResultFilters(runScan(policy), flags);
  await emitReport(buildPayload(result), flags.format, flags);
  return 0;
}
