import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { readJsonFile } from "../utils/io.js";
import type { CommonFlags } from "./commands/shared.js";

const configSchema = z
  .object({
    strict: z.boolean().optional(),
    failOn: z.enum(["low", "medium", "high", "critical"]).optional(),
    minSeverity: z.enum(["low", "medium", "high", "critical"]).optional(),
    quiet: z.boolean().optional(),
    json: z.boolean().optional(),
    color: z.boolean().optional(),
    output: z.string().optional(),
    candidateOutput: z.string().optional(),
    reportFormat: z.enum(["terminal", "json", "markdown", "sarif"]).optional(),
    batchFormat: z.enum(["terminal", "json", "markdown"]).optional()
  })
  .strict();

export interface PermissionGuardConfig extends CommonFlags {
  reportFormat?: "terminal" | "json" | "markdown" | "sarif";
  batchFormat?: "terminal" | "json" | "markdown";
}

export async function loadPermissionGuardConfig(): Promise<PermissionGuardConfig> {
  const configPath = resolve(process.cwd(), ".permissionguard.json");
  try {
    await access(configPath);
  } catch {
    return {};
  }
  const raw = await readJsonFile(configPath);
  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid .permissionguard.json: ${parsed.error.issues[0]?.message ?? "unknown issue"}`);
  }
  return parsed.data;
}

export function mergeFlagsWithConfig<T extends object>(flags: T, config: PermissionGuardConfig): T & PermissionGuardConfig {
  return {
    ...config,
    ...flags
  };
}
