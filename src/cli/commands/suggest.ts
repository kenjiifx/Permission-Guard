import { runScan } from "../../core/engine.js";
import {
  applyResultFilters,
  buildPayload,
  emitReport,
  loadPolicyInput,
  writeCandidatePolicy,
  type CommonFlags
} from "./shared.js";

export async function runSuggestCommand(input: string | undefined, flags: CommonFlags): Promise<number> {
  const policy = await loadPolicyInput(input, flags.role);
  const result = applyResultFilters(runScan(policy), flags);
  const outputPath = await writeCandidatePolicy(flags.candidateOutput, result.candidatePolicy);
  await emitReport(buildPayload(result), flags.json ? "json" : "terminal", flags);
  if (!flags.quiet && outputPath) {
    process.stdout.write(`Candidate policy written to: ${outputPath}\n`);
  }
  return 0;
}
