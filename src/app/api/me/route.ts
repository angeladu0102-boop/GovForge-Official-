// GET /api/me — returns the signed-in member as JSON, or 401.
// Used to prove the API refuses requests from signed-out users.
import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json(member, { status: 200 });
}
