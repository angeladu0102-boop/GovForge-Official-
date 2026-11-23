# GovForge — Test results (Stage 5)

**Date:** Nov 23, 2026 · **Branch:** `test/stage-5` · **Purpose:** the gate before deploying V1 (Stage 6).
Each section has a pass/fail result. The deploy gate at the end passes only if every section passes.

| Section | Result |
|---|---|
| 1. Unit tests | ✅ PASS (60/60) |
| 2. Acceptance T1–T3 | ✅ PASS |
| 3. AI eval (E1–E6 real, E7 stubbed floor) | ✅ PASS |
| 4. Two-organization isolation | ⏳ PENDING |
| 5. AI timeout (over 60 s) | ⏳ PENDING (automated part ✅) |

---

## 1. Unit tests: ✅ PASS (60/60)
`npm test`: 5 files, 60 tests, under 1 second, no network, no cost. Also `npm run lint` clean, `npx tsc --noEmit` clean, `npm run build` succeeds.

| File | Tests | What it covers |
|---|---|---|
| `src/lib/risk-rules.test.ts` | floor for every data type, `max(floor, AI)` | [D1], [D5] |
| `src/lib/assessment.test.ts` | 12 kinds of bad AI output rejected, thin input, out of date, override input | [D2], [D4], validation |
| `src/lib/register.test.ts` | register sort order, newest assessment wins | T3 |
| `src/lib/assessment-ai.test.ts` **(new)** | 6: floor raises a low AI answer (3), timeout + retry (2), outage (1) | [D1], [D3] |
| `src/app/api/tools/[id]/assess/route.test.ts` **(new)** | 2: timeout → 504, AI down → 502, nothing saved either way | [D3], T2 failure cases |

## 2. Acceptance T1–T3: ✅ PASS
Run by hand by Angela against each ticket's acceptance criteria in [tickets.md](tickets.md). Details in [BUILD_LOG.md](BUILD_LOG.md).

| Ticket | Date | Result | Notes |
|---|---|---|---|
| T0 Sign-in | Nov 20 | ✅ 6/6 | Signed out → sign-in page; API → `401` |
| T1 Add / edit / view tools | Nov 23 | ✅ 7/7 | Check 5 (duplicate name) failed first ("Chat GPT" vs "ChatGPT"); fixed, then passed |
| T2 AI risk assessment | Nov 23 | ✅ 8/8 | Incl. floor, double-click, out of date, not enough info, override, AI down |
| T3 View the register | Nov 23 | ✅ all checks | Columns, labels, High-first sort, out of date, loads with AI down, `401` signed out |
| B1 Blank "Add tool" form | Nov 23 | ✅ | Bug fix after T3 testing |

## 3. AI eval: ✅ PASS
`npm run eval`: real Claude calls through the same pipeline as the Assess button. Model `claude-haiku-5-5`, prompt `v1`, Nov 23, 2026. Cost ≈ $0.003 per run.

| # | Tool | Expected | AI level | Floor | Final | Time (s) | Result |
|---|---|---|---|---|---|---|---|
| E1 | Free ChatGPT, public info only | Low (Medium OK) | Low | none | Low | 2.4 | ✅ Pass |
| E2 | Otter.ai, client meetings | ≥ Medium (High OK) | High | Medium | High | 2.6 | ✅ Pass |
| E3 | Public chatbot, customer emails | High | High | Medium | High | 2.5 | ✅ Pass |
| E4 | GitHub Copilot, source code | Medium (High OK) | Medium | Medium | Medium | 2.8 | ✅ Pass |
| E5 | Physio scheduling assistant, health data | High | High | High | High | 2.1 | ✅ Pass |
| E6 | "ChatGPT / writing" (too vague) | Insufficient info | (no call: code check) | — | Insufficient info | 0.0 | ✅ Pass |
| **E7** | **Stubbed AI says Low, Health data** | **High (floor must raise it)** | **Low (stub)** | **High** | **High** | <0.1 | ✅ Pass |

Ship gate: under-ratings 0 (need 0) · within range 7/7 · E6 insufficient info → **PASS**.

**E7 approach: stubbed AI, not a real input.** In E1–E6 the real AI was always at or above the floor, so the floor never had to step in. That is expected: the prompt itself tells Claude that health and financial data are High risk. Hunting for a real input that makes the AI rate too low would cost money and give a flaky test that "fails" whenever the AI improves. So E7 replaces Claude with a fixed answer ("Low") and checks that the code raises it to the floor ("High", reason "Handles Health data"). It lives in `src/lib/assessment-ai.test.ts` (F1), with two siblings: F2 Low + Source code → Medium; F3 High + Source code → stays High (the floor never lowers).

## 4. Two-organization isolation: ⏳ PENDING
**Goal:** a user in org A can never read or change org B's tools or assessments, and the reverse (T3: "never shows another organization's data").

### 4a. Database (row-level security), automated: `npm run check:orgs`
Signs in as user A and user B with the public key (the same access a browser has) and tries to break isolation. Script: `scripts/two-org-check.ts`.

| # | Attempt | Expected | Result |
|---|---|---|---|
| 1 | B lists tools | Only org B's tools | ⏳ |
| 2 | B reads A's tool by id | Nothing returned | ⏳ |
| 3 | B edits A's tool | 0 rows changed | ⏳ |
| 4 | B adds a tool into org A | Refused | ⏳ |
| 5 | B moves its own tool into org A | Refused | ⏳ |
| 6 | B reads A's assessments | Nothing returned | ⏳ |
| 7 | B adds an assessment to A's tool | Refused | ⏳ |
| 8 | B overrides A's assessment | 0 rows changed | ⏳ |
| 9 | B reads org A or its members | Only org B | ⏳ |
| 10–12 | Reverse: A reads, edits or lists B's tool | Nothing / 0 rows | ⏳ |

### 4b. API, manual (signed in as user B)
| # | Check | Expected | Result |
|---|---|---|---|
| 1 | Register page | None of org A's tools | ⏳ |
| 2 | Open `/tools/<A's tool id>` | Not found | ⏳ |
| 3 | `GET /api/tools/<A's tool id>` | `404` | ⏳ |
| 4 | `PATCH /api/tools/<A's tool id>` | `404` | ⏳ |
| 5 | `POST /api/tools/<A's tool id>/assess` | `404` (no AI call, no cost) | ⏳ |
| 6 | `PATCH /api/assessments/<A's assessment id>/override` | `404` | ⏳ |

## 5. AI timeout (over 60 s): ⏳ PENDING (automated part ✅)
**Goal:** when the AI is too slow, the user sees "took too long" and their tool is still saved.

| # | Check | How | Result |
|---|---|---|---|
| 1 | AI times out twice → `timeout`, after exactly one retry | Unit test, stubbed AI | ✅ |
| 2 | Under 25 s of budget left → no retry | Unit test | ✅ |
| 3 | Route returns `504` "The assessment took too long. Your tool is saved; try again." and writes nothing | Route test | ✅ |
| 4 | In the app: spinner, then "took too long"; after reload the tool is still there and no new assessment appears | Manual: app pointed at a server that never answers (`ANTHROPIC_BASE_URL`), no code change | ⏳ |

Note: the server stops itself at 55 s (two 25 s attempts, so about 50 s in practice), before the browser's own 60 s cutoff. So users see the server's "took too long" answer. The browser cutoff is a backstop with the same message.

---

**Deploy gate: ⏳ PENDING** (sections 4 and 5 need Angela's checks)
