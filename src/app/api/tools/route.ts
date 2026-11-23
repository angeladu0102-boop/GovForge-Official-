// /api/tools
//   GET  → 200 the register: tools in your organization with their current assessment,
//          sorted High → Medium → Low → not assessed (T3)
//   POST → 201 created | 400 invalid input | 409 duplicate name | 401 not signed in
import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TOOL_COLUMNS, rowToTool, toFieldErrors, toolInputSchema } from "@/lib/tools";
import { findToolByName, listRegister } from "@/lib/tools-db";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const tools = await listRegister();
  return NextResponse.json({ tools }, { status: 200 });
}

export async function POST(request: Request) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // 1. Read the JSON body. Bad JSON is the caller's mistake → 400.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  // 2. Validate. Never trust the browser's checks alone.
  const parsed = toolInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Some fields need attention", fieldErrors: toFieldErrors(parsed.error) },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // 3. Duplicate check → 409 Conflict, with a link target.
  const existing = await findToolByName(input.name);
  if (existing) {
    return NextResponse.json(
      { error: `"${existing.name}" is already in the register`, existingId: existing.id },
      { status: 409 },
    );
  }

  // 4. Save. Owner and organization come from the session, never from the request.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tools")
    .insert({
      org_id: member.orgId,
      owner_id: member.userId,
      name: input.name,
      vendor: input.vendor || null,
      purpose: input.purpose,
      team: input.team || null,
      data_types: input.dataTypes,
    })
    .select(TOOL_COLUMNS)
    .single();

  if (error) {
    // 23505 = unique violation: someone added the same name a split second earlier.
    if (error.code === "23505") {
      const dup = await findToolByName(input.name);
      return NextResponse.json(
        { error: `"${input.name}" is already in the register`, existingId: dup?.id },
        { status: 409 },
      );
    }
    console.error("[POST /api/tools]", error.code, error.message);
    return NextResponse.json({ error: "Couldn't save the tool. Try again." }, { status: 500 });
  }

  return NextResponse.json({ tool: rowToTool(data) }, { status: 201 });
}
