// POST /api/tools/{id}/assess: run the AI risk assessment (tech spec §3.1, §3.9).
//   201 assessment (status complete or insufficient_info)
//   401 not signed in · 404 tool not found (or another org's)
//   502 AI unavailable / invalid twice · 504 took too long · 500 couldn't save
// Saving a tool never depends on this route: the tool is already saved before Assess is clicked.
import { NextResponse, type NextRequest } from "next/server";
import { toSnapshot } from "@/lib/assessment";
import { runAssessmentPipeline } from "@/lib/assessment-ai";
import { insertAssessment, type NewAssessment } from "@/lib/assessments-db";
import { getCurrentMember } from "@/lib/auth";
import { getTool } from "@/lib/tools-db";

// Lets the host run this route for up to 60 s; our own budget stops at 55 s.
export const maxDuration = 60;

const UNAVAILABLE = "Assessment unavailable, your tool is saved, try again.";
const TOO_SLOW = "The assessment took too long. Your tool is saved; try again.";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/tools/[id]/assess">) {
  const startedAt = Date.now();

  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await ctx.params;
  const tool = await getTool(id); // row-level security: own organization only
  if (!tool) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  const snapshot = toSnapshot(tool); // exactly what the AI sees ("inputs used")
  const result = await runAssessmentPipeline(snapshot, startedAt); // thin check → floor → Claude → max()

  if (result.kind === "timeout") return NextResponse.json({ error: TOO_SLOW }, { status: 504 });
  if (result.kind === "unavailable") return NextResponse.json({ error: UNAVAILABLE }, { status: 502 });

  const base = {
    toolId: tool.id,
    orgId: member.orgId,
    createdBy: member.userId,
    inputsSnapshot: snapshot,
    model: result.model,
    promptVersion: result.promptVersion,
    durationMs: Date.now() - startedAt,
  };
  const record: NewAssessment =
    result.kind === "insufficient_info"
      ? { ...base, status: "insufficient_info", missingInfo: result.missingInfo }
      : {
          ...base,
          status: "complete",
          aiLevel: result.aiLevel,
          floorLevel: result.floor?.level ?? null, // recorded either way, for traceability
          floorReason: result.floor?.reason ?? null,
          riskLevel: result.riskLevel,
          reasons: result.reasons,
          controls: result.controls,
        };

  try {
    const assessment = await insertAssessment(record);
    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tools/:id/assess]", error);
    return NextResponse.json({ error: "Couldn't save the assessment. Your tool is saved; try again." }, { status: 500 });
  }
}
