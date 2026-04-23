import { parsePolicyFromUnknown } from "./parser.js";
import { runScan } from "./engine.js";
import { scoreFindings } from "./scorer.js";
import { readJsonFile } from "../utils/io.js";
import type { BatchScanResult, Finding, ScanResult } from "../types/index.js";

export async function runBatchScan(target: string, filePaths: string[]): Promise<BatchScanResult> {
  const results: ScanResult[] = [];
  const failedScans: Array<{ source: string; error: string }> = [];

  await Promise.all(
    filePaths.map(async (path) => {
      try {
        const raw = await readJsonFile(path);
        const policy = parsePolicyFromUnknown(raw, path);
        results.push(runScan(policy));
      } catch (error) {
        failedScans.push({
          source: path,
          error: error instanceof Error ? error.message : "Unknown batch scan error"
        });
      }
    })
  );

  const findings: Finding[] = results.flatMap((result) => result.findings);
  return {
    target,
    scannedFiles: filePaths.length,
    successfulScans: results.length,
    failedScans,
    results,
    findings,
    aggregatedRisk: scoreFindings(findings)
  };
}
