# T3 plan: View the register

**Branch:** `feat/t3-register` (first commit `c59dee8`: your doc changes, not pushed). **Ticket:** [T3](../tickets.md#t3--view-the-register-story-3). **Scope:** T3 only. No filters or CSV export (those are Shoulds).

## Context
T1 built the register table, and T2 added risk assessments on each tool's page. The register doesn't show risk yet, so an IT lead can't "spot what needs attention" (Story 3). T3 adds each tool's risk level and "last assessed" date to the register, sorts risky tools to the top, and labels rows as Not assessed, Out of date or overridden.

**Concept: joining data in code.** Tools and assessments live in separate tables. The register needs one line per tool, showing that tool's *newest* assessment. We'll fetch both lists in one round trip, match them up in code, and sort in a pure function (same input, same output), so the rules can be unit-tested like T2's floor rules.

## Decisions (made Nov 23, in plan review)
- **A. Data fetch:** one query for the org's assessments (summary columns only), keeping the newest per tool in code. No migration. Revisit if assessments grow to many thousands of rows.
- **B. Sort rule:** an Out-of-date row keeps its last level for sorting (an outdated High stays on top, tagged "Out of date"). "Not enough information" rows have no level, so they sort with Not assessed at the bottom.
- **Default (no decision needed):** within a group, rows are sorted by tool name A–Z, so a tool is easy to find.

## Files (in build order)
| # | File | New/Change | What it does |
|---|---|---|---|
| 1 | `src/lib/register.ts` | New (pure, no DB) | `AssessmentSummary` and `RegisterRow` types; `buildRegister(tools, latestByTool)` returns sorted rows. Reuses `isOutOfDate` (`src/lib/assessment.ts`) and `rank` (`src/lib/risk-rules.ts`). |
| 2 | `src/lib/register.test.ts` | New | Unit tests for the sort and labels (below). |
| 3 | `src/lib/assessments-db.ts` | Change | Add `listLatestAssessments()`: one query, newest first, keeping the first row per tool. Selects only `id, tool_id, status, risk_level, override_level, inputs_snapshot, created_at`, not reasons or controls. RLS limits it to your org. |
| 4 | `src/lib/tools-db.ts` | Change | Add `listRegister()`: runs `listTools()` and `listLatestAssessments()` in parallel, then calls `buildRegister`. |
| 5 | `src/components/risk-badge.tsx` | New | Moves `LevelBadge` out of `assessment-panel.tsx` so the panel and the register share one badge (with a compact size for table rows). The panel's look doesn't change. |
| 6 | `src/app/page.tsx` | Change | Uses `listRegister()`. Adds **Risk** and **Last assessed** columns (keeps Added and Last updated from T1). Empty state unchanged. |
| 7 | `src/app/api/tools/route.ts` | Change | `GET` returns the same sorted rows, matching architecture.md ("each tool's current assessment, sorted"). Each tool gets extra fields; nothing else uses this response today. |

No database migration. No changes to T2's API routes.

## How each criterion maps to code
| Ticket item | Where | How |
|---|---|---|
| One row per tool: name, team, owner, risk level, date last assessed | `buildRegister` + `page.tsx` | One `RegisterRow` per tool. Risk = badge; Last assessed = the newest assessment's date, or "—" |
| Sorted High → Medium → Low → Not assessed | `buildRegister` | Sort groups: High, Medium, Low, then no level (Not assessed / Not enough information); name A–Z within each group. Uses the **effective** level (override if any) and **B** for Out of date |
| "Not assessed" / "Out of date" | `buildRegister` + `page.tsx` | No assessment → "Not assessed". `isOutOfDate(tool, snapshot)` true → badge plus an "Out of date" tag. A "Not enough information" assessment shows "Not enough info" |
| Override shown | `buildRegister` + `page.tsx` | Badge shows the override level, with a small "Reviewer override" note under it (e.g. "Reviewer override · AI/rules: High") |
| Empty state as in T1 | `page.tsx` | Existing "No AI tools yet" + "Add your first tool", unchanged |
| Loads even if the AI is down | whole page | The register only reads the database; it never calls Claude |
| Never shows another org's data | DB | RLS on `tools` (migration 002) and `assessments` (003); both queries run as the signed-in user |

## Unit tests (`register.test.ts`)
- Mixed rows sort High → Medium → Low → Not assessed, with name A–Z within each group.
- An override changes both the sort position and the badge (AI High, override Low → sorts with Low).
- An Out-of-date High stays in the High group, tagged Out of date (decision B).
- "Not enough information" sorts with Not assessed and shows "Not enough info".
- No assessment → "Not assessed", last assessed empty.
- Only the newest assessment per tool counts (in `listLatestAssessments`; the selection logic is tested as a pure helper).

## Verification
1. Automated: `npm test` (T2's 45 tests plus the new ones), `npx tsc --noEmit`, `npm run lint`, `npm run build`.
2. Your acceptance checks with `npm run dev`:
   - **Columns:** register shows Risk and Last assessed.
   - **Sort:** with tools at High, Medium, Low and none, the order is High → Medium → Low → Not assessed.
   - **Not assessed:** a never-assessed tool says "Not assessed" and its last-assessed date is "—".
   - **Out of date:** edit an assessed tool's purpose → the row says "Out of date" and keeps its place.
   - **Override:** override a level → the row shows the reviewer level and moves to that group.
   - **Not enough information:** a tool with purpose "writing" assessed → "Not enough info", at the bottom.
   - **AI down:** set an invalid API key and restart → the register still loads normally. Restore the key afterwards.
   - **Empty state:** a fresh org shows "No AI tools yet". Optional: this means clearing data, so a code review of RLS is enough here.
   - **Other org's data:** covered by RLS (T0–T2). A two-organization test is planned for Stage 5, since it needs a second user and org.
3. **Git safety:** run `git branch --show-current` before every commit. All work reaches `main` only through a PR that you merge.

## After approval
Plan mode only allows writing this planning file, so my first step after approval is to save this plan word for word to `docs/plans/t3-plan.md`, then build steps 1–7.
