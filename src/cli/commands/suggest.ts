import { runScan } from "../../core/engine.js";
import {
  buildPayload,
  emitReport,
  loadPolicyInput,
  writeCandidatePolicy,
  type CommonFlags
} from "./shared.js";

export async function runSuggestCommand(input: string | undefined, flags: CommonFlags): Promise<number> {
  const policy = await loadPolicyInput(input, flags.role);
  const result = runScan(policy);
  const outputPath = await writeCandidatePolicy(flags.output, result.candidatePolicy);
  await emitReport(buildPayload(result), flags.json ? "json" : "terminal", flags);
  if (!flags.quiet && outputPath) {
    process.stdout.write(`Candidate policy written to: ${outputPath}\n`);
  }
  return 0;
}
