export type Severity = "low" | "medium" | "high" | "critical";

export type SuggestionConfidence = "safe" | "review-needed" | "manual-only";

export interface NormalizedPolicyDocument {
  version?: string;
  id?: string;
  source: string;
  statements: NormalizedStatement[];
}

export interface NormalizedStatement {
  sid?: string;
  effect: "Allow" | "Deny";
  actions: string[];
  notActions: string[];
  resources: string[];
  notResources: string[];
  principals: string[];
  conditions: Record<string, unknown>;
  raw: Record<string, unknown>;
  index: number;
}

export interface Finding {
  id: string;
  ruleId: string;
  title: string;
  severity: Severity;
  statementIndex: number;
  statementSid?: string;
  description: string;
  evidence: string[];
  recommendation: string;
}

export interface RuleContext {
  policy: NormalizedPolicyDocument;
  statement: NormalizedStatement;
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  evaluate(context: RuleContext): Finding[];
}

export interface Suggestion {
  id: string;
  findingIds: string[];
  confidence: SuggestionConfidence;
  summary: string;
  recommendation: string;
  candidatePatch?: SuggestionPatch;
}

export interface SuggestionPatch {
  statementIndex: number;
  replaceActions?: string[];
  replaceResources?: string[];
  addCondition?: Record<string, unknown>;
  note: string;
}

export interface ScoreBreakdown {
  base: number;
  findingContributions: Array<{ findingId: string; severity: Severity; points: number }>;
  adminPatternBonus: number;
  compoundedBonus: number;
}

export interface RiskScore {
  score: number;
  level: "low" | "moderate" | "high" | "critical";
  breakdown: ScoreBreakdown;
}

export interface ScanResult {
  source: string;
  policy: NormalizedPolicyDocument;
  findings: Finding[];
  risk: RiskScore;
  suggestions: Suggestion[];
  candidatePolicy?: NormalizedPolicyDocument;
}

export interface BatchScanResult {
  target: string;
  scannedFiles: number;
  successfulScans: number;
  failedScans: Array<{ source: string; error: string }>;
  results: ScanResult[];
  aggregatedRisk: RiskScore;
  findings: Finding[];
}

export interface ReportPayload {
  generatedAt: string;
  toolVersion: string;
  result: ScanResult;
}

export interface RolePolicyFetchResult {
  roleName: string;
  roleArn?: string;
  policies: Array<{ name: string; document: unknown; source: string }>;
}
