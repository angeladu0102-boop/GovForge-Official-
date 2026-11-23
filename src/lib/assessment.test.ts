// Unit tests for assessment rules: output validation, thin input ([D4]), out of date ([D2]), override input.
import { describe, expect, it } from "vitest";
import { aiOutputSchema, isOutOfDate, overrideInputSchema, thinInputCheck, toSnapshot } from "@/lib/assessment";

const three = ["one reason", "two reason", "three reason"];

describe("aiOutputSchema rejects anything but a valid result", () => {
  const valid = { status: "complete", risk_level: "Medium", reasons: three, controls: three };

  it("accepts a valid complete result", () => {
    expect(aiOutputSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a valid insufficient_info result", () => {
    expect(aiOutputSchema.safeParse({ status: "insufficient_info", missing_info: ["Who uses it"] }).success).toBe(true);
  });

  const bad: [string, unknown][] = [
    ['level "Moderate"', { ...valid, risk_level: "Moderate" }],
    ['level "high" (wrong case)', { ...valid, risk_level: "high" }],
    ["missing level", { ...valid, risk_level: undefined }],
    ["2 reasons", { ...valid, reasons: three.slice(0, 2) }],
    ["6 controls", { ...valid, controls: [...three, ...three] }],
    ["a reason over 200 characters", { ...valid, reasons: [...three.slice(0, 2), "x".repeat(201)] }],
    ["an empty reason", { ...valid, reasons: [...three.slice(0, 2), "  "] }],
    ["an extra field", { ...valid, note: "extra text" }],
    ["insufficient_info with a guessed level", { status: "insufficient_info", missing_info: ["x"], risk_level: "Low" }],
    ["insufficient_info with nothing to add", { status: "insufficient_info", missing_info: [] }],
    ["unknown status", { ...valid, status: "done" }],
    ["plain text", "Medium risk"],
  ];
  for (const [label, input] of bad) {
    it(`rejects ${label}`, () => {
      expect(aiOutputSchema.safeParse(input).success).toBe(false);
    });
  }
});

describe("thinInputCheck ([D4]: under 12 words → insufficient, no AI call)", () => {
  it("flags a one-word purpose", () => {
    expect(thinInputCheck("writing")).not.toBeNull();
  });
  it("flags 11 words", () => {
    expect(thinInputCheck("one two three four five six seven eight nine ten eleven")).not.toBeNull();
  });
  it("passes 12 words", () => {
    expect(thinInputCheck("one two three four five six seven eight nine ten eleven twelve")).toBeNull();
  });
  it("ignores extra spaces", () => {
    expect(thinInputCheck("   a    b   ")).not.toBeNull();
  });
});

describe("isOutOfDate ([D2]: any input sent to the AI changed)", () => {
  const tool = {
    name: "Otter.ai",
    vendor: "Otter",
    purpose: "Transcribes client meetings",
    dataTypes: ["Client confidential information", "Internal business information"],
  };
  const snapshot = toSnapshot(tool);

  it("same inputs → current", () => {
    expect(isOutOfDate(tool, snapshot)).toBe(false);
  });
  it("data types in a different order → still current", () => {
    expect(isOutOfDate({ ...tool, dataTypes: [...tool.dataTypes].reverse() }, snapshot)).toBe(false);
  });
  it("spaces at either end → still current", () => {
    expect(isOutOfDate({ ...tool, name: " Otter.ai " }, snapshot)).toBe(false);
  });
  it("no vendor vs. empty vendor → still current", () => {
    const noVendor = { ...tool, vendor: null };
    expect(isOutOfDate({ ...tool, vendor: "" }, toSnapshot(noVendor))).toBe(false);
  });
  it.each([
    ["name", { name: "Otter" }],
    ["vendor", { vendor: "Otter.ai Inc" }],
    ["purpose", { purpose: "Transcribes client and patient meetings" }],
    ["data types", { dataTypes: [...tool.dataTypes, "Health data"] }],
  ])("changed %s → out of date", (_field, change) => {
    expect(isOutOfDate({ ...tool, ...change }, snapshot)).toBe(true);
  });
  it("team is not sent to the AI, so it isn't part of the snapshot", () => {
    expect(Object.keys(snapshot).sort()).toEqual(["dataTypes", "name", "purpose", "vendor"]);
  });
});

describe("overrideInputSchema (spec 3.7)", () => {
  it("accepts a level and a 10-character reason", () => {
    expect(overrideInputSchema.safeParse({ level: "High", reason: "1234567890" }).success).toBe(true);
  });
  it("rejects a reason under 10 characters (after trimming)", () => {
    expect(overrideInputSchema.safeParse({ level: "High", reason: "   too short   " }).success).toBe(false);
  });
  it("rejects an invalid level", () => {
    expect(overrideInputSchema.safeParse({ level: "Critical", reason: "a perfectly good reason" }).success).toBe(false);
  });
});
