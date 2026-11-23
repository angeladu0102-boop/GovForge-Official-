// PATCH /api/assessments/{id}/override  { level, reason }  (tech spec §3.7, plan-review C)
//   200 updated assessment
//   400 invalid level / reason under 10 characters / not the newest complete assessment
//   401 not signed in · 404 not found (or another org's)
import { NextResponse, type NextRequest } from "next/server";
import { overrideInputSchema } from "@/lib/assessment";
import { getAssessment, getCurrentAssessment, setOverride } from "@/lib/assessments-db";
import { getCurrentMember } from "@/lib/auth";

const NOT_OVERRIDABLE = "Only the newest complete assessment can be overridden. Reload the page to see the latest.";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/assessments/[id]/override">) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await ctx.params;
  const assessment = await getAssessment(id);
  if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const parsed = overrideInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return NextResponse.json({ error: "Some fields need attention", fieldErrors }, { status: 400 });
  }

  // Plan-review C: newest assessment only, and only if complete. (The database enforces this too.)
  const current = await getCurrentAssessment(assessment.toolId);
  if (assessment.status !== "complete" || current?.id !== assessment.id) {
    return NextResponse.json({ error: NOT_OVERRIDABLE }, { status: 400 });
  }

  try {
    const updated = await setOverride(id, parsed.data.level, parsed.data.reason, member.userId);
    // null = the database refused (e.g. a newer assessment landed a moment ago).
    if (!updated) return NextResponse.json({ error: NOT_OVERRIDABLE }, { status: 400 });
    return NextResponse.json({ assessment: updated }, { status: 200 });
  } catch (error) {
    console.error("[PATCH /api/assessments/:id/override]", error);
    return NextResponse.json({ error: "Couldn't save the override. Try again." }, { status: 500 });
  }
}
