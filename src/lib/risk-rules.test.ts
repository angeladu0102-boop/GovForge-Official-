// Unit tests for the minimum-risk rules ([D1], [D5], Decision 006).
import { describe, expect, it } from "vitest";
import { computeFloor, finalLevel } from "@/lib/risk-rules";
import { DATA_TYPES } from "@/lib/tools";

describe("computeFloor: every data type", () => {
  const expected: Record<(typeof DATA_TYPES)[number], "High" | "Medium" | null> = {
    "Public information only": null,
    "Internal business information": null,
    "Client confidential information": "Medium",
    "Customer personal data": "Medium",
    "Employee personal data": "Medium",
    "Financial data": "High",
    "Health data": "High",
    "Source code": "Medium",
  };

  for (const type of DATA_TYPES) {
    it(`${type} → ${expected[type] ?? "no floor"}`, () => {
      expect(computeFloor([type])?.level ?? null).toBe(expected[type]);
    });
  }

  it("the highest tier wins when types are mixed", () => {
    expect(computeFloor(["Source code", "Health data"])).toEqual({ level: "High", reason: "Handles Health data" });
  });

  it("names every matching type in the reason", () => {
    expect(computeFloor(["Health data", "Financial data"])?.reason).toBe("Handles Health data and Financial data");
  });

  it("public + internal only → no floor", () => {
    expect(computeFloor(["Public information only", "Internal business information"])).toBeNull();
  });
});

describe("finalLevel = max(floor, AI)", () => {
  const high = { level: "High" as const, reason: "Handles Health data" };
  const medium = { level: "Medium" as const, reason: "Handles Source code" };

  it("floor raises a lower AI level", () => {
    expect(finalLevel(high, "Low")).toBe("High");
    expect(finalLevel(medium, "Low")).toBe("Medium");
  });

  it("AI can raise above the floor", () => {
    expect(finalLevel(medium, "High")).toBe("High");
  });

  it("equal levels stay the same", () => {
    expect(finalLevel(high, "High")).toBe("High");
  });

  it("no floor → AI decides", () => {
    expect(finalLevel(null, "Low")).toBe("Low");
  });
});
