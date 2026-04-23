import type { ReportPayload } from "../types/index.js";
import { toJson, toMarkdown, toTerminal } from "./formatters.js";

export type ReportFormat = "terminal" | "json" | "markdown";

export function formatReport(
  payload: ReportPayload,
  format: ReportFormat,
  opts?: { color?: boolean }
): string {
  if (format === "json") return toJson(payload);
  if (format === "markdown") return toMarkdown(payload);
  return toTerminal(payload.result, opts);
}
