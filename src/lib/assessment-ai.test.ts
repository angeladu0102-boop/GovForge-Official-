// Pipeline tests with a STUBBED Claude (no network, no cost). Stage 5.
// - Floor case ("E7 stubbed"): the AI answers below the floor, code must raise it ([D1], Decision 006).
// - Timeout and outage handling ([D3]).
// The real error classes are kept, so the `instanceof` checks in assessment-ai.ts behave as in production.
import { beforeEach, describe, expect, it, vi } from "vitest";

// A hand-written fake for messages.create that counts calls. (A vi.fn() whose async
// implementation throws made Vitest 4 fail the test even though our code caught the error.)
let calls = 0;
let answer: () => Promise<unknown> = async () => ({});
const create = async () => {
  calls++;
  return answer();
};
const aiReturns = (value: unknown) => (answer = async () => value);
const aiThrows = (error: Error) =>
  (answer = async () => {
    throw error;
  });

vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const real = (await importOriginal()) as { default: typeof import("@anthropic-ai/sdk").default };
  class FakeAnthropic extends real.default {
    constructor() {
      super({ apiKey: "test-key" }); // never used: messages.create is replaced below
      (this as unknown as { messages: { create: typeof create } }).messages = { create };
    }
  }
  return { ...real, default: FakeAnthropic };
});

import Anthropic from "@anthropic-ai/sdk";
import { runAssessmentPipeline } from "@/lib/assessment-ai";

/** A long-enough purpose to pass the thin-input check, so the AI is actually called. */
const PURPOSE = "Clinic staff use this assistant every day to summarize patient visit notes and draft follow-up letters for clinicians.";

function snapshot(dataTypes: string[]) {
  return { name: "Test tool", vendor: "Test vendor", purpose: PURPOSE, dataTypes };
}

/** What Claude returns when it calls the submit_assessment tool. */
function aiSays(risk_level: "Low" | "Medium" | "High") {
  return {
    stop_reason: "tool_use",
    content: [
      {
        type: "tool_use",
        id: "toolu_test",
        name: "submit_assessment",
        input: {
          status: "complete",
          risk_level,
          reasons: ["Reason one.", "Reason two.", "Reason three."],
          controls: ["Control one.", "Control two.", "Control three."],
        },
      },
    ],
  };
}

beforeEach(() => {
  calls = 0;
});

describe("floor raises a low AI rating (E7, stubbed AI)", () => {
  it("F1: AI says Low, Health data → final High", async () => {
    aiReturns(aiSays("Low"));
    const r = await runAssessmentPipeline(snapshot(["Health data"]));
    expect(r.kind).toBe("complete");
    if (r.kind !== "complete") return;
    expect(r.aiLevel).toBe("Low"); // the AI's own answer is kept, for traceability
    expect(r.floor).toEqual({ level: "High", reason: "Handles Health data" });
    expect(r.riskLevel).toBe("High");
  });

  it("F2: AI says Low, Source code → final Medium", async () => {
    aiReturns(aiSays("Low"));
    const r = await runAssessmentPipeline(snapshot(["Source code"]));
    expect(r.kind === "complete" && r.riskLevel).toBe("Medium");
  });

  it("F3: AI says High, Source code → stays High (the floor never lowers)", async () => {
    aiReturns(aiSays("High"));
    const r = await runAssessmentPipeline(snapshot(["Source code"]));
    expect(r.kind === "complete" && r.riskLevel).toBe("High");
  });
});

describe("AI slow or down ([D3])", () => {
  it("times out twice → 'timeout', after exactly one retry", async () => {
    aiThrows(new Anthropic.APIConnectionTimeoutError());
    const r = await runAssessmentPipeline(snapshot(["Health data"]));
    expect(r.kind).toBe("timeout");
    expect(calls).toBe(2);
  });

  it("no retry when too little of the 55 s budget is left", async () => {
    aiThrows(new Anthropic.APIConnectionTimeoutError());
    const startedAt = Date.now() - 40_000; // only 15 s left: not enough for a fair 25 s retry
    const r = await runAssessmentPipeline(snapshot(["Health data"]), startedAt);
    expect(r.kind).toBe("timeout");
    expect(calls).toBe(1);
  });

  it("API overloaded (529) → 'unavailable', no retry", async () => {
    aiThrows(new Anthropic.APIError(529, { type: "overloaded_error" }, "Overloaded", new Headers()));
    const r = await runAssessmentPipeline(snapshot(["Health data"]));
    expect(r.kind).toBe("unavailable");
    expect(calls).toBe(1);
  });
});
