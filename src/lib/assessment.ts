// Shared rules for AI risk assessments: used by the API (server) and the panel (browser).
// Full design: docs/tech-spec-ai-assessment.md. No secrets or AI calls in this file.
import { z } from "zod";
import { RISK_LEVELS, type RiskLevel } from "@/lib/risk-rules";

/** Model and prompt version are saved on every row, so a change is traceable (spec 3.4). */
export const MODEL = "claude-haiku-5-5";
export const PROMPT_VERSION = "v1";

// ---------------------------------------------------------------------------
// [D4] Thin-input check: code stops before calling the AI (no cost) when the
// purpose is too short to assess. The AI can also flag vague-but-long input.
// ---------------------------------------------------------------------------
export const MIN_PURPOSE_WORDS = 12;

export const THIN_INPUT_MISSING_INFO = [
  "What the tool is used for: the task or workflow, in a sentence or two",
  "Who uses it: which team or role",
  "What goes into it: the kind of information people type or upload",
];

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Returns what to add if the purpose is too thin to assess; null if it's enough. */
export function thinInputCheck(purpose: string): string[] | null {
  return wordCount(purpose) < MIN_PURPOSE_WORDS ? THIN_INPUT_MISSING_INFO : null;
}

// ---------------------------------------------------------------------------
// AI output schema (spec 3.4). The schema in code is the final authority, not
// the model: anything else ("Moderate", 2 reasons, extra fields) is invalid.
// ---------------------------------------------------------------------------
const item = z.string().trim().min(1).max(200);
const items3to5 = z.array(item).min(3).max(5);

export const aiOutputSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("complete"),
    risk_level: z.enum(RISK_LEVELS),
    reasons: items3to5,
    controls: items3to5,
    missing_info: z.array(z.string()).max(0).optional(), // tolerated only if empty
  }),
  z.strictObject({
    status: z.literal("insufficient_info"),
    missing_info: z.array(item).min(1).max(5),
    // No risk_level, reasons or controls allowed: never a guessed level.
  }),
]);

export type AiOutput = z.infer<typeof aiOutputSchema>;

// ---------------------------------------------------------------------------
// [D2] Inputs snapshot and "Out of date": any input sent to the AI changed.
// ---------------------------------------------------------------------------
export type InputsSnapshot = {
  name: string;
  vendor: string;
  purpose: string;
  dataTypes: string[];
};

/** The exact tool details sent to the AI, normalized so comparisons are fair. */
export function toSnapshot(tool: { name: string; vendor: string | null; purpose: string; dataTypes: readonly string[] }): InputsSnapshot {
  return {
    name: tool.name.trim(),
    vendor: (tool.vendor ?? "").trim(),
    purpose: tool.purpose.trim(),
    dataTypes: [...tool.dataTypes].sort(),
  };
}

/** True when the tool's current name, vendor, purpose or data types differ from what was assessed. */
export function isOutOfDate(
  tool: { name: string; vendor: string | null; purpose: string; dataTypes: readonly string[] },
  snapshot: InputsSnapshot,
): boolean {
  const now = toSnapshot(tool);
  const then = toSnapshot(snapshot);
  return (
    now.name !== then.name ||
    now.vendor !== then.vendor ||
    now.purpose !== then.purpose ||
    now.dataTypes.join("|") !== then.dataTypes.join("|")
  );
}

// ---------------------------------------------------------------------------
// Reviewer override input (spec 3.7). Reason ≥ 10 characters (also a DB check).
// ---------------------------------------------------------------------------
export const overrideInputSchema = z.object({
  level: z.enum(RISK_LEVELS, { error: "Choose Low, Medium or High" }),
  reason: z
    .string({ error: "Give a reason" })
    .trim()
    .min(10, "Give a reason of at least 10 characters")
    .max(1000, "Keep the reason under 1,000 characters"),
});

export type OverrideInput = z.infer<typeof overrideInputSchema>;

// ---------------------------------------------------------------------------
// The shape the API sends back for one assessment.
// ---------------------------------------------------------------------------
export type Assessment = {
  id: string;
  toolId: string;
  status: "complete" | "insufficient_info";
  aiLevel: RiskLevel | null;
  floorLevel: RiskLevel | null;
  floorReason: string | null;
  riskLevel: RiskLevel | null; // final = max(floor, AI)
  reasons: string[];
  controls: string[];
  missingInfo: string[];
  inputsSnapshot: InputsSnapshot;
  model: string | null;
  promptVersion: string | null;
  durationMs: number | null;
  createdByName: string;
  createdAt: string;
  override: null | {
    level: RiskLevel;
    reason: string;
    byName: string;
    at: string;
  };
};

/** The level people should act on: the reviewer's override if there is one. */
export function effectiveLevel(a: Assessment): RiskLevel | null {
  return a.override?.level ?? a.riskLevel;
}

type NameJoin = { display_name: string } | { display_name: string }[] | null;

export type AssessmentRow = {
  id: string;
  tool_id: string;
  status: "complete" | "insufficient_info";
  ai_level: RiskLevel | null;
  floor_level: RiskLevel | null;
  floor_reason: string | null;
  risk_level: RiskLevel | null;
  reasons: string[] | null;
  controls: string[] | null;
  missing_info: string[] | null;
  inputs_snapshot: InputsSnapshot;
  model: string | null;
  prompt_version: string | null;
  duration_ms: number | null;
  created_at: string;
  override_level: RiskLevel | null;
  override_reason: string | null;
  overridden_at: string | null;
  creator: NameJoin;
  overrider: NameJoin;
};

export const ASSESSMENT_COLUMNS =
  "id, tool_id, status, ai_level, floor_level, floor_reason, risk_level, reasons, controls, missing_info, " +
  "inputs_snapshot, model, prompt_version, duration_ms, created_at, override_level, override_reason, overridden_at, " +
  "creator:members!assessments_created_by_fkey(display_name), overrider:members!assessments_overridden_by_fkey(display_name)";

function nameOf(join: NameJoin): string {
  const one = Array.isArray(join) ? join[0] : join;
  return one?.display_name ?? "Unknown";
}

export function rowToAssessment(row: AssessmentRow): Assessment {
  return {
    id: row.id,
    toolId: row.tool_id,
    status: row.status,
    aiLevel: row.ai_level,
    floorLevel: row.floor_level,
    floorReason: row.floor_reason,
    riskLevel: row.risk_level,
    reasons: row.reasons ?? [],
    controls: row.controls ?? [],
    missingInfo: row.missing_info ?? [],
    inputsSnapshot: row.inputs_snapshot,
    model: row.model,
    promptVersion: row.prompt_version,
    durationMs: row.duration_ms,
    createdByName: nameOf(row.creator),
    createdAt: row.created_at,
    override:
      row.override_level && row.override_reason && row.overridden_at
        ? { level: row.override_level, reason: row.override_reason, byName: nameOf(row.overrider), at: row.overridden_at }
        : null,
  };
}
