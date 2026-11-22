// /api/tools/{id}
//   GET   → 200 one tool | 404 not found (or another organization's)
//   PATCH → 200 updated | 400 invalid | 404 | 409 duplicate name
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TOOL_COLUMNS, rowToTool, toFieldErrors, toolInputSchema } from "@/lib/tools";
import { findToolByName, getTool } from "@/lib/tools-db";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/tools/[id]">) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await ctx.params;
  const tool = await getTool(id);
  if (!tool) return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  return NextResponse.json({ tool }, { status: 200 });
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/tools/[id]">) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await ctx.params;
  const current = await getTool(id);
  if (!current) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const parsed = toolInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Some fields need attention", fieldErrors: toFieldErrors(parsed.error) },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const existing = await findToolByName(input.name, id);
  if (existing) {
    return NextResponse.json(
      { error: `"${existing.name}" is already in the register`, existingId: existing.id },
      { status: 409 },
    );
  }

  // If data types changed, record when: T2 uses this to mark old assessments "Out of date".
  const sameDataTypes =
    [...current.dataTypes].sort().join("|") === [...input.dataTypes].sort().join("|");
  const now = new Date().toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tools")
    .update({
      name: input.name,
      vendor: input.vendor || null,
      purpose: input.purpose,
      team: input.team || null,
      data_types: input.dataTypes,
      updated_at: now,
      ...(sameDataTypes ? {} : { data_types_changed_at: now }),
    })
    .eq("id", id)
    .select(TOOL_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: `"${input.name}" is already in the register` }, { status: 409 });
    }
    console.error("[PATCH /api/tools/:id]", error.code, error.message);
    return NextResponse.json({ error: "Couldn't save changes. Try again." }, { status: 500 });
  }

  return NextResponse.json({ tool: rowToTool(data) }, { status: 200 });
}
