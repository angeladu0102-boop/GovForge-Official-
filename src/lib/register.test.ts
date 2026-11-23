// Unit tests for the register view (T3): sort order, labels, overrides, out of date, newest wins.
import { describe, expect, it } from "vitest";
import { toSnapshot } from "@/lib/assessment";
import { buildRegister, pickLatest, type AssessmentSummary } from "@/lib/register";
import type { RiskLevel } from "@/lib/risk-rules";
import type { Tool } from "@/lib/tools";

function tool(id: string, name: string, purpose = "Used by the team for drafting"): Tool {
  return {
    id, name, vendor: null, purpose, team: null, dataTypes: ["Internal business information"],
    ownerName: "Ang", createdAt: "2026-11-20T00:00:00Z", updatedAt: "2026-11-20T00:00:00Z",
  };
}

function assessed(t: Tool, level: RiskLevel | null, opts: Partial<AssessmentSummary> = {}): AssessmentSummary {
  return {
    id: `a-${t.id}`, toolId: t.id,
    status: level ? "complete" : "insufficient_info",
    riskLevel: level, overrideLevel: null,
    inputsSnapshot: toSnapshot(t), createdAt: "2026-11-23T01:00:00Z",
    ...opts,
  };
}

const names = (rows: { name: string }[]) => rows.map((r) => r.name);

describe("buildRegister: sort High → Medium → Low → no level, then name A–Z", () => {
  it("orders mixed rows by group, then name", () => {
    const tools = [tool("1", "zeta low"), tool("2", "none"), tool("3", "Beta high"), tool("4", "alpha high"), tool("5", "medium")];
    const latest = pickLatest([
      assessed(tools[0], "Low"), assessed(tools[2], "High"), assessed(tools[3], "High"), assessed(tools[4], "Medium"),
    ]);
    expect(names(buildRegister(tools, latest))).toEqual(["alpha high", "Beta high", "medium", "zeta low", "none"]);
  });

  it("no assessment → Not assessed, with no date", () => {
    const [row] = buildRegister([tool("1", "x")], new Map());
    expect(row.risk).toEqual({ kind: "not_assessed" });
  });

  it("an override changes the level and the sort position", () => {
    const tools = [tool("1", "a overridden"), tool("2", "b medium")];
    const latest = pickLatest([assessed(tools[0], "High", { overrideLevel: "Low" }), assessed(tools[1], "Medium")]);
    const rows = buildRegister(tools, latest);
    expect(names(rows)).toEqual(["b medium", "a overridden"]);
    expect(rows[1].risk).toMatchObject({ kind: "assessed", level: "Low", ruleLevel: "High", overridden: true });
  });

  it("decision B: an out-of-date High stays in the High group, tagged out of date", () => {
    const old = tool("1", "z outdated high");
    const edited = { ...old, purpose: "Now also used with client contracts" };
    const other = tool("2", "a medium");
    const rows = buildRegister([edited, other], pickLatest([assessed(old, "High"), assessed(other, "Medium")]));
    expect(names(rows)).toEqual(["z outdated high", "a medium"]);
    expect(rows[0].risk).toMatchObject({ kind: "assessed", level: "High", outOfDate: true });
  });

  it("decision B: Not enough information sorts with Not assessed, at the bottom", () => {
    const tools = [tool("1", "a thin"), tool("2", "b none"), tool("3", "c low")];
    const rows = buildRegister(tools, pickLatest([assessed(tools[0], null), assessed(tools[2], "Low")]));
    expect(names(rows)).toEqual(["c low", "a thin", "b none"]);
    expect(rows[1].risk).toMatchObject({ kind: "insufficient_info", outOfDate: false });
  });

  it("current inputs → not out of date", () => {
    const t = tool("1", "x");
    expect(buildRegister([t], pickLatest([assessed(t, "Low")]))[0].risk).toMatchObject({ outOfDate: false });
  });
});

describe("pickLatest: only the newest assessment per tool counts", () => {
  it("keeps the newest regardless of input order", () => {
    const t = tool("1", "x");
    const older = assessed(t, "High", { id: "old", createdAt: "2026-11-22T00:00:00Z" });
    const newer = assessed(t, "Low", { id: "new", createdAt: "2026-11-23T00:00:00Z" });
    expect(pickLatest([newer, older]).get("1")?.id).toBe("new");
    expect(pickLatest([older, newer]).get("1")?.id).toBe("new");
  });
});
