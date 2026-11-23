// AI eval for risk assessments (tech spec §7, [D7]). Run: npm run eval
// Calls the REAL Claude API through the same pipeline as the Assess button
// (thin-input check → floor → Claude → validation → max). Cost ≈ $0.003 per run.
// Run before merge and after any prompt or model change. Kept out of `npm test` on purpose.
import { expect, test } from "vitest";
import { MODEL, PROMPT_VERSION, toSnapshot } from "@/lib/assessment";
import { runAssessmentPipeline, type PipelineResult } from "@/lib/assessment-ai";
import { RISK_LEVELS, rank, type RiskLevel } from "@/lib/risk-rules";

try {
  process.loadEnvFile(".env.local"); // ANTHROPIC_API_KEY; never printed
} catch {
  // Fall through: the pipeline reports a clear "unavailable" if the key is missing.
}

type Expected = { min: RiskLevel; max: RiskLevel; label: string } | "insufficient_info";

type Case = {
  id: string;
  tool: { name: string; vendor: string; purpose: string; dataTypes: string[] };
  expected: Expected;
};

// The 6 fixed test tools from the tech spec §7. Change only with a spec update.
const CASES: Case[] = [
  {
    id: "E1",
    tool: {
      name: "ChatGPT (free)",
      vendor: "OpenAI",
      purpose: "Marketing staff use the free version to draft social media posts from our public product pages and published press releases.",
      dataTypes: ["Public information only"],
    },
    expected: { min: "Low", max: "Medium", label: "Low (Medium OK)" },
  },
  {
    id: "E2",
    tool: {
      name: "Otter.ai",
      vendor: "Otter.ai",
      purpose: "Consultants use it to record and transcribe client meetings, then share the transcripts and summaries with the project team.",
      dataTypes: ["Client confidential information"],
    },
    expected: { min: "Medium", max: "High", label: "≥ Medium (High OK)" },
  },
  {
    id: "E3",
    tool: {
      name: "Public AI chatbot",
      vendor: "",
      purpose: "Customer support agents paste customer emails, including names, addresses and order details, into a free public chatbot to draft replies.",
      dataTypes: ["Customer personal data"],
    },
    expected: { min: "High", max: "High", label: "High" },
  },
  {
    id: "E4",
    tool: {
      name: "GitHub Copilot",
      vendor: "GitHub",
      purpose: "Our engineers use it inside their code editor to suggest and complete code for our internal business applications.",
      dataTypes: ["Source code"],
    },
    expected: { min: "Medium", max: "High", label: "Medium (High OK)" },
  },
  {
    id: "E5",
    tool: {
      name: "AI scheduling assistant",
      vendor: "",
      purpose: "At our physio clinic, the assistant books patient appointments and reads clinicians' treatment notes to suggest follow-up times.",
      dataTypes: ["Health data", "Customer personal data"],
    },
    expected: { min: "High", max: "High", label: "High" },
  },
  {
    id: "E6",
    tool: { name: "ChatGPT", vendor: "OpenAI", purpose: "writing", dataTypes: ["Internal business information"] },
    expected: "insufficient_info",
  },
];

type Row = {
  id: string;
  expected: string;
  ai: string;
  floor: string;
  final: string;
  seconds: string;
  underRated: boolean;
  pass: boolean;
  result: PipelineResult;
};

function grade(c: Case, r: PipelineResult, seconds: number): Row {
  const base = { id: c.id, seconds: seconds.toFixed(1), result: r };
  const exp = c.expected;
  if (r.kind === "timeout" || r.kind === "unavailable") {
    return { ...base, expected: exp === "insufficient_info" ? "Insufficient info" : exp.label, ai: r.kind, floor: "—", final: "—", underRated: false, pass: false };
  }
  if (r.kind === "insufficient_info") {
    return {
      ...base,
      expected: exp === "insufficient_info" ? "Insufficient info" : exp.label,
      ai: r.source === "code" ? "(no call: code check)" : "insufficient_info",
      floor: "—",
      final: "Insufficient info",
      underRated: false,
      pass: exp === "insufficient_info",
    };
  }
  if (exp === "insufficient_info") {
    return { ...base, expected: "Insufficient info", ai: r.aiLevel, floor: r.floor?.level ?? "none", final: r.riskLevel, underRated: false, pass: false };
  }
  const under = rank(r.riskLevel) < rank(exp.min);
  const within = rank(r.riskLevel) >= rank(exp.min) && rank(r.riskLevel) <= rank(exp.max);
  return { ...base, expected: exp.label, ai: r.aiLevel, floor: r.floor?.level ?? "none", final: r.riskLevel, underRated: under, pass: within };
}

test("AI risk assessment eval (ship gate)", { timeout: 6 * 70_000 }, async () => {
  const rows: Row[] = [];
  for (const c of CASES) {
    // One at a time, like real users, so timings are realistic.
    const started = Date.now();
    const result = await runAssessmentPipeline(toSnapshot(c.tool), started);
    rows.push(grade(c, result, (Date.now() - started) / 1000));
  }

  const lines = [
    `Model ${MODEL} · prompt ${PROMPT_VERSION} · ${new Date().toLocaleDateString("en-CA")}`,
    "",
    "| # | Expected | AI level | Floor | Final | Time (s) | Result |",
    "|---|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.id} | ${r.expected} | ${r.ai} | ${r.floor} | ${r.final} | ${r.seconds} | ${r.pass ? "✅ Pass" : r.underRated ? "❌ UNDER-RATED" : "❌ Fail"} |`),
    "",
  ];
  for (const r of rows) {
    if (r.result.kind === "complete") {
      lines.push(`${r.id} reasons:`, ...r.result.reasons.map((x) => `  - ${x}`));
      lines.push(`${r.id} controls:`, ...r.result.controls.map((x) => `  - ${x}`), "");
    } else if (r.result.kind === "insufficient_info") {
      lines.push(`${r.id} missing info:`, ...r.result.missingInfo.map((x) => `  - ${x}`), "");
    }
  }

  const underRatings = rows.filter((r) => r.underRated).length;
  const e6 = rows.find((r) => r.id === "E6");
  const gate = underRatings === 0 && rows.every((r) => r.pass) && e6?.final === "Insufficient info";
  lines.push(
    `Ship gate: under-ratings ${underRatings} (need 0) · within range ${rows.filter((r) => r.pass).length}/${rows.length} · E6 insufficient info: ${e6?.final === "Insufficient info" ? "yes" : "no"} → ${gate ? "PASS ✅" : "FAIL ❌"}`,
  );
  console.log("\n" + lines.join("\n"));

  expect(RISK_LEVELS).toContain("High"); // sanity: rules module loaded
  expect(gate, "Ship gate failed: see the table above").toBe(true);
});
