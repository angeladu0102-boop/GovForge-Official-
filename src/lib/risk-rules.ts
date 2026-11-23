// GovForge minimum-risk rules (tech spec 3.3, Decision 006).
// [D1] Code sets a floor from the data types; the AI can raise the level, never lower it.
// [D5] Two tiers: Health/Financial → High; other sensitive data → Medium; public/internal → none.
// Kept in one small file on purpose, so it's easy to review and test.
import type { DATA_TYPES } from "@/lib/tools";

export const RISK_LEVELS = ["Low", "Medium", "High"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

type DataType = (typeof DATA_TYPES)[number];

const FLOOR_RULES: { level: RiskLevel; dataTypes: DataType[] }[] = [
  { level: "High", dataTypes: ["Health data", "Financial data"] },
  {
    level: "Medium",
    dataTypes: [
      "Client confidential information",
      "Customer personal data",
      "Employee personal data",
      "Source code",
    ],
  },
];

export type Floor = { level: RiskLevel; reason: string } | null;

/** The minimum level for these data types, with a human-readable reason; null if no floor applies. */
export function computeFloor(dataTypes: readonly string[]): Floor {
  for (const rule of FLOOR_RULES) {
    const hits = rule.dataTypes.filter((t) => dataTypes.includes(t));
    if (hits.length > 0) return { level: rule.level, reason: `Handles ${joinAnd(hits)}` };
  }
  return null;
}

/** Low < Medium < High. */
export function rank(level: RiskLevel): number {
  return RISK_LEVELS.indexOf(level);
}

/** final = max(floor, AI). */
export function finalLevel(floor: Floor, aiLevel: RiskLevel): RiskLevel {
  if (floor && rank(floor.level) > rank(aiLevel)) return floor.level;
  return aiLevel;
}

function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
