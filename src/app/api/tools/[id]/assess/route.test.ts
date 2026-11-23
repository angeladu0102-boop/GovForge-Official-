// Route test: when the AI takes too long, the user gets the "took too long" message (504)
// and nothing is written. The tool was saved earlier and is only read here. Stage 5, [D3].
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getCurrentMember: vi.fn(async () => ({ userId: "user-a", email: "a@test", displayName: "A", orgId: "org-a" })),
}));
vi.mock("@/lib/tools-db", () => ({
  getTool: vi.fn(async (id: string) => ({
    id,
    name: "Test tool",
    vendor: "Test vendor",
    purpose: "A purpose that is long enough to pass the thin input check for this test.",
    dataTypes: ["Health data"],
  })),
}));
vi.mock("@/lib/assessments-db", () => ({ insertAssessment: vi.fn() }));
vi.mock("@/lib/assessment-ai", () => ({ runAssessmentPipeline: vi.fn(async () => ({ kind: "timeout" })) }));

import { POST } from "./route";
import { insertAssessment } from "@/lib/assessments-db";
import { runAssessmentPipeline } from "@/lib/assessment-ai";

function call(id = "tool-1") {
  const req = new Request(`http://localhost/api/tools/${id}/assess`, { method: "POST" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return POST(req as any, { params: Promise.resolve({ id }) } as any);
}

describe("POST /api/tools/{id}/assess when the AI is slow or down", () => {
  it("timeout → 504 'took too long, your tool is saved', nothing written", async () => {
    const res = await call();
    expect(res.status).toBe(504);
    expect(await res.json()).toEqual({ error: "The assessment took too long. Your tool is saved; try again." });
    expect(insertAssessment).not.toHaveBeenCalled();
  });

  it("AI down → 502 'unavailable, your tool is saved', nothing written", async () => {
    vi.mocked(runAssessmentPipeline).mockResolvedValueOnce({ kind: "unavailable" });
    const res = await call();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Assessment unavailable, your tool is saved, try again." });
    expect(insertAssessment).not.toHaveBeenCalled();
  });
});
