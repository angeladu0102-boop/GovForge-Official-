// Two-organization isolation check (Stage 5). Run: npm run check:orgs
// Signs in as user A (org A) and user B (org B) with the public anon key, which is exactly
// the access a browser has, then tries to read and change the other org's data.
// Row-level security must block every attempt. Hits the REAL Supabase project; no AI calls, no cost.
// Needs in .env.local: TEST_A_EMAIL, TEST_A_PASSWORD, TEST_B_EMAIL, TEST_B_PASSWORD (never printed).
// Side effect: creates one tool "Two-org check tool" in org B the first time (V1 has no delete).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Missing file: the checks below fail with a clear message.
}

const CHECK_TOOL = "Two-org check tool";

type Side = { db: SupabaseClient; userId: string; orgId: string };

async function signIn(label: string, email?: string, password?: string): Promise<Side> {
  if (!email || !password) throw new Error(`Set TEST_${label}_EMAIL and TEST_${label}_PASSWORD in .env.local`);
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`User ${label} could not sign in: ${error?.message}`);
  const { data: me } = await db.from("members").select("org_id").eq("user_id", data.user.id).maybeSingle();
  if (!me) throw new Error(`User ${label} has no members row (not in an organization)`);
  return { db, userId: data.user.id, orgId: me.org_id };
}

let A: Side;
let B: Side;
let aToolId: string;
let aAssessmentId: string;
let bToolId: string;

beforeAll(async () => {
  A = await signIn("A", process.env.TEST_A_EMAIL, process.env.TEST_A_PASSWORD);
  B = await signIn("B", process.env.TEST_B_EMAIL, process.env.TEST_B_PASSWORD);
  if (A.orgId === B.orgId) throw new Error("A and B are in the SAME organization; move B to org B first");

  // A's evidence: one of A's tools that has an assessment.
  const { data: aAssessment } = await A.db.from("assessments").select("id, tool_id").limit(1).maybeSingle();
  if (!aAssessment) throw new Error("Org A needs at least one assessed tool");
  aAssessmentId = aAssessment.id;
  aToolId = aAssessment.tool_id;

  // B's own tool (created once, reused after).
  const { data: existing } = await B.db.from("tools").select("id").eq("name", CHECK_TOOL).maybeSingle();
  if (existing) {
    bToolId = existing.id;
  } else {
    const { data: created, error } = await B.db
      .from("tools")
      .insert({
        org_id: B.orgId,
        owner_id: B.userId,
        name: CHECK_TOOL,
        purpose: "Test tool for the two-organization isolation check.",
        data_types: ["Internal business information"],
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(`B could not create its own tool: ${error?.message}`);
    bToolId = created.id;
  }
}, 30_000);

describe("User B (org B) cannot reach org A's data", () => {
  it("1. B's tool list contains none of org A's tools", async () => {
    const { data } = await B.db.from("tools").select("id, org_id");
    expect(data!.length).toBeGreaterThan(0); // B does see its own tool
    expect(data!.every((t) => t.org_id === B.orgId)).toBe(true);
  });

  it("2. B cannot read A's tool by id", async () => {
    const { data } = await B.db.from("tools").select("id").eq("id", aToolId);
    expect(data).toEqual([]);
  });

  it("3. B cannot update A's tool (0 rows changed)", async () => {
    const { data } = await B.db.from("tools").update({ team: "hacked by B" }).eq("id", aToolId).select("id");
    expect(data ?? []).toEqual([]);
    const { data: still } = await A.db.from("tools").select("team").eq("id", aToolId).single();
    expect(still!.team).not.toBe("hacked by B");
  });

  it("4. B cannot add a tool into org A", async () => {
    const { error } = await B.db.from("tools").insert({
      org_id: A.orgId,
      owner_id: B.userId,
      name: `Sneaky tool ${Date.now()}`,
      purpose: "Should be refused by row-level security.",
      data_types: ["Internal business information"],
    });
    expect(error).not.toBeNull();
  });

  it("5. B cannot move its own tool into org A", async () => {
    const { error } = await B.db.from("tools").update({ org_id: A.orgId }).eq("id", bToolId);
    expect(error).not.toBeNull();
    const { data } = await B.db.from("tools").select("org_id").eq("id", bToolId).single();
    expect(data!.org_id).toBe(B.orgId);
  });

  it("6. B cannot read A's assessments", async () => {
    const { data: all } = await B.db.from("assessments").select("org_id");
    expect((all ?? []).every((a) => a.org_id === B.orgId)).toBe(true);
    const { data: one } = await B.db.from("assessments").select("id").eq("id", aAssessmentId);
    expect(one).toEqual([]);
  });

  it("7. B cannot add an assessment to A's tool", async () => {
    for (const orgId of [A.orgId, B.orgId]) {
      const { error } = await B.db.from("assessments").insert({
        tool_id: aToolId,
        org_id: orgId,
        status: "insufficient_info",
        missing_info: ["test"],
        inputs_snapshot: {},
        created_by: B.userId,
      });
      expect(error).not.toBeNull();
    }
  });

  it("8. B cannot override A's assessment (0 rows changed)", async () => {
    const { data } = await B.db
      .from("assessments")
      .update({ override_level: "Low", override_reason: "Overridden by org B", overridden_by: B.userId, overridden_at: new Date().toISOString() })
      .eq("id", aAssessmentId)
      .select("id");
    expect(data ?? []).toEqual([]);
    const { data: still } = await A.db.from("assessments").select("override_reason").eq("id", aAssessmentId).single();
    expect(still!.override_reason).not.toBe("Overridden by org B");
  });

  it("9. B cannot read org A or its members", async () => {
    const { data: orgs } = await B.db.from("organizations").select("id");
    expect(orgs!.map((o) => o.id)).toEqual([B.orgId]);
    const { data: members } = await B.db.from("members").select("org_id");
    expect(members!.every((m) => m.org_id === B.orgId)).toBe(true);
  });
});

describe("And the reverse: user A (org A) cannot reach org B's data", () => {
  it("10. A cannot read B's tool", async () => {
    const { data } = await A.db.from("tools").select("id").eq("id", bToolId);
    expect(data).toEqual([]);
  });

  it("11. A cannot update B's tool", async () => {
    const { data } = await A.db.from("tools").update({ team: "hacked by A" }).eq("id", bToolId).select("id");
    expect(data ?? []).toEqual([]);
  });

  it("12. A's tool list contains none of org B's tools", async () => {
    const { data } = await A.db.from("tools").select("org_id");
    expect(data!.every((t) => t.org_id === A.orgId)).toBe(true);
  });
});
