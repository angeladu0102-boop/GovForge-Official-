// Database reads/writes for assessments, shared by API routes and pages.
// Row-level security (migration 003) limits every query to the signed-in user's organization.
import { createClient } from "@/lib/supabase/server";
import { ASSESSMENT_COLUMNS, rowToAssessment, type Assessment, type AssessmentRow, type InputsSnapshot } from "@/lib/assessment";
import type { RiskLevel } from "@/lib/risk-rules";

/** A tool's current assessment = its newest row (or null if never assessed). */
export async function getCurrentAssessment(toolId: string): Promise<Assessment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select(ASSESSMENT_COLUMNS)
    .eq("tool_id", toolId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== "22P02") throw new Error(`getCurrentAssessment: ${error.message}`);
  return data ? rowToAssessment(data as unknown as AssessmentRow) : null;
}

export async function getAssessment(id: string): Promise<Assessment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select(ASSESSMENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error && error.code !== "22P02") throw new Error(`getAssessment: ${error.message}`); // 22P02 = not a valid id
  return data ? rowToAssessment(data as unknown as AssessmentRow) : null;
}

export type NewAssessment = {
  toolId: string;
  orgId: string;
  createdBy: string;
  inputsSnapshot: InputsSnapshot;
  durationMs: number;
  model: string | null;
  promptVersion: string | null;
} & (
  | {
      status: "complete";
      aiLevel: RiskLevel;
      floorLevel: RiskLevel | null;
      floorReason: string | null;
      riskLevel: RiskLevel;
      reasons: string[];
      controls: string[];
    }
  | { status: "insufficient_info"; missingInfo: string[] }
);

export async function insertAssessment(a: NewAssessment): Promise<Assessment> {
  const supabase = await createClient();
  const base = {
    tool_id: a.toolId,
    org_id: a.orgId,
    created_by: a.createdBy,
    inputs_snapshot: a.inputsSnapshot,
    duration_ms: a.durationMs,
    model: a.model,
    prompt_version: a.promptVersion,
    status: a.status,
  };
  // One flat row; the fields that don't apply are null (the DB check constraint enforces which).
  const complete = a.status === "complete" ? a : null;
  const row = {
    ...base,
    ai_level: complete?.aiLevel ?? null,
    floor_level: complete?.floorLevel ?? null,
    floor_reason: complete?.floorReason ?? null,
    risk_level: complete?.riskLevel ?? null,
    reasons: complete?.reasons ?? null,
    controls: complete?.controls ?? null,
    missing_info: a.status === "insufficient_info" ? a.missingInfo : null,
  };

  const { data, error } = await supabase.from("assessments").insert(row).select(ASSESSMENT_COLUMNS).single();
  if (error) throw new Error(`insertAssessment: ${error.code} ${error.message}`);
  return rowToAssessment(data as unknown as AssessmentRow);
}

/**
 * Save a reviewer override. Returns null if the database refused the update
 * (row-level security: not the newest assessment, or another organization's).
 */
export async function setOverride(id: string, level: RiskLevel, reason: string, userId: string): Promise<Assessment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .update({
      override_level: level,
      override_reason: reason,
      overridden_by: userId,
      overridden_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(ASSESSMENT_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(`setOverride: ${error.code} ${error.message}`);
  return data ? rowToAssessment(data as unknown as AssessmentRow) : null;
}
