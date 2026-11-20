// Data access layer for "who is signed in?". Every page and API route
// asks this one function instead of reading cookies itself.
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type Member = {
  userId: string;
  email: string;
  displayName: string;
  orgId: string;
};

/** Returns the signed-in member, or null if not signed in (or not in an organization). */
export async function getCurrentMember(): Promise<Member | null> {
  // Tell Next.js this depends on the live request, so it never tries to
  // pre-build it ahead of time (sign-in checks use the current time).
  await connection();

  const supabase = await createClient();

  // getClaims() verifies the session token's signature, so it can't be faked.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  // Row-level security only lets a user read their own organization's members.
  const { data: member, error } = await supabase
    .from("members")
    .select("user_id, display_name, org_id")
    .eq("user_id", claims.sub)
    .maybeSingle();
  if (error) {
    // Visible in the Terminal running npm run dev.
    console.error("[auth] members lookup failed:", error.code, error.message);
  }
  if (!member) {
    console.warn("[auth] no members row for user", claims.sub, claims.email);
    return null;
  }

  return {
    userId: member.user_id,
    email: typeof claims.email === "string" ? claims.email : "",
    displayName: member.display_name,
    orgId: member.org_id,
  };
}
