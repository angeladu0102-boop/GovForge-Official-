// One risk badge for the whole app (assessment panel and register), so levels look the same everywhere.
import type { RiskLevel } from "@/lib/risk-rules";

const COLORS: Record<RiskLevel, string> = {
  High: "border-risk-high bg-risk-high/10 text-risk-high",
  Medium: "border-risk-medium bg-risk-medium/10 text-risk-medium",
  Low: "border-risk-low bg-risk-low/10 text-risk-low",
};

const SIZES = {
  md: "px-3 py-1 text-sm tracking-[0.14em]", // assessment panel
  sm: "px-2 py-0.5 text-[11px] tracking-[0.12em]", // register rows
};

export function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: keyof typeof SIZES }) {
  return (
    <span className={`inline-block whitespace-nowrap border font-mono uppercase ${SIZES[size]} ${COLORS[level]}`}>
      {level} risk
    </span>
  );
}
