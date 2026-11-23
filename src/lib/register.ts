// The register view (T3): one row per tool with its current assessment, sorted so
// risky tools come first. Pure functions only (no database), so the rules are unit-tested.
// Plan: docs/plans/t3-plan.md (decisions A and B).
import { isOutOfDate, type InputsSnapshot } from "@/lib/assessment";
import { rank, type RiskLevel } from "@/lib/risk-rules";
import type { Tool } from "@/lib/tools";

/** Just the assessment fields the register needs (no reasons or controls). */
export type AssessmentSummary = {
  id: string;
  toolId: string;
  status: "complete" | "insufficient_info";
  riskLevel: RiskLevel | null; // AI/rules level: max(floor, AI)
  overrideLevel: RiskLevel | null;
  inputsSnapshot: InputsSnapshot;
  createdAt: string;
};

export type RegisterRisk =
  | { kind: "not_assessed" }
  | { kind: "insufficient_info"; assessedAt: string; outOfDate: boolean }
  | {
      kind: "assessed";
      level: RiskLevel; // what to act on: the override if there is one
      ruleLevel: RiskLevel; // the AI/rules level, shown next to an override
      overridden: boolean;
      outOfDate: boolean;
      assessedAt: string;
    };

export type RegisterRow = Tool & { risk: RegisterRisk };

/** A tool's current assessment = its newest one. Doesn't rely on the input order. */
export function pickLatest(summaries: readonly AssessmentSummary[]): Map<string, AssessmentSummary> {
  const latest = new Map<string, AssessmentSummary>();
  for (const s of summaries) {
    const seen = latest.get(s.toolId);
    if (!seen || s.createdAt > seen.createdAt) latest.set(s.toolId, s);
  }
  return latest;
}

export function riskFor(tool: Tool, a: AssessmentSummary | undefined): RegisterRisk {
  if (!a) return { kind: "not_assessed" };
  const outOfDate = isOutOfDate(tool, a.inputsSnapshot); // [D2]
  if (a.status === "insufficient_info" || !a.riskLevel) {
    return { kind: "insufficient_info", assessedAt: a.createdAt, outOfDate };
  }
  return {
    kind: "assessed",
    level: a.overrideLevel ?? a.riskLevel,
    ruleLevel: a.riskLevel,
    overridden: a.overrideLevel !== null,
    outOfDate, // decision B: an outdated row keeps its last level for sorting
    assessedAt: a.createdAt,
  };
}

/** Sort group: High 0, Medium 1, Low 2, no level (Not assessed / Not enough info) 3. */
function group(risk: RegisterRisk): number {
  return risk.kind === "assessed" ? 2 - rank(risk.level) : 3;
}

/** One row per tool, sorted High → Medium → Low → no level, then name A–Z. */
export function buildRegister(tools: readonly Tool[], latest: Map<string, AssessmentSummary>): RegisterRow[] {
  return tools
    .map((t) => ({ ...t, risk: riskFor(t, latest.get(t.id)) }))
    .sort((a, b) => group(a.risk) - group(b.risk) || a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}
