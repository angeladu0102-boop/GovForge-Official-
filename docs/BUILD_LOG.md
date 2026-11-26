# GovForge — Build Log

A running record of building GovForge end to end, with me (Ang) as the TPM directing an AI coding agent.

---

## Nov 20, 2026 — Stage 0: Setup
**What we did**
- Confirmed Node.js (v24.21.0) and Git (2.50.1) are installed on my Mac.
- Created the project folder, CLAUDE.md, docs/ (PRD.md, decisions/, BUILD_LOG.md) and .gitignore.
- Initialized a Git repository, made the first commit, and pushed to GitHub.

**Decisions**
- Tracker and portfolio format: repo is the source of truth; portfolio = README case study + in-app /case-study page ([Decision 001](decisions/001-tracker-and-portfolio-format.md)).

**TPM concepts**
- Single source of truth: one authoritative place for status and decisions, so nothing drifts.
- Docs as code: product docs live in the repo and are versioned with the code.

**Concepts learned**
- Repository: a project folder whose full history Git tracks.
- Commit: a saved snapshot of the project with a message explaining the change.
- Push: uploading local commits to a remote copy (GitHub) for backup and sharing.
- CLAUDE.md: a context file the AI agent reads at the start of every session.
- .gitignore: a list of files Git must never track, such as secrets in .env.local.
- Personal access token: a scoped, revocable password for one app (here, Git on my laptop), limited to one repo with write access.
- 401 vs. 403: 401 = "I don't know who you are" (bad login); 403 = "I know who you are, but you're not allowed."

**What went wrong**
- Push failed 3 times before succeeding: (1) the remote URL still had the YOUR-USERNAME placeholder and I entered my account password, which GitHub no longer accepts for Git; (2) after fixing the username, I got a 403 because the URL pointed to `govforge` but my actual repo is `GovForge-Official-`; (3) fixed the URL with `git remote set-url` and pushed with a fine-grained token.
- Lesson: read error messages literally. Each one named the exact problem (wrong URL, wrong credential type, no write access).

**Repo:** https://github.com/angeladu0102-boop/GovForge-Official-

---

## Nov 20, 2026 — Stage 1: Discovery recap
**Where discovery actually stands (honest version)**
I believe organizations adopting AI tools often don't know which tools their people use or what data goes into them, so privacy and compliance risks go unmanaged. That's an assumption, not a finding: I've completed **0 interviews**. Outreach to 12 people (IT/ops leads, risk/compliance professionals, LMU professors) is in progress.

My three hypotheses:
- **H1:** Most small and mid-sized organizations have no central list of the AI tools in use.
- **H2:** Approving a new AI tool is informal or slow because there's no consistent way to assess risk.
- **H3 (riskiest):** The people responsible would actually use a structured AI risk assessment with recommended controls.

H3 is the riskiest because if it's wrong, the core feature has no buyer, even if H1 and H2 are true. So this is a **build-to-learn** project: I'm building a working version to show at the end of each interview, because reacting to a real tool gives sharper evidence than asking "would you use this?"

**What would change the plan:** if most interviewees already track AI tools in a spreadsheet or GRC (governance, risk and compliance) tool and are happy with it, H1 fails and the value shifts to the assessment alone. If they say they wouldn't trust an AI-generated risk level, H3 fails and the product becomes a register plus a guided checklist.

**TPM concepts**
- Hypothesis-driven development: treat beliefs as testable bets, each with a way to prove it wrong.
- Riskiest assumption: test first the belief that would sink the product if false.
- Build to learn vs. build to scale: this version exists to generate evidence, not to be production-ready for thousands of users.

---

## Nov 20, 2026 — Stage 2: Requirements
**What we did**
- Turned the 3 user stories into tickets with acceptance criteria and failure cases ([tickets.md](tickets.md)), plus one shared definition of done.
- Caught 2 requirement gaps while writing tickets: (1) the PRD requires sign-in but no story covered it → added **T0 Sign-in** as an enabler ticket; (2) the PRD lists "edit" as a Must but only "add" had a story → added an edit criterion to T1.
- Added one criterion beyond the stories: an AI result that isn't Low/Medium/High is treated as a failure, never shown.

**Decisions**
- Build order T0 → T1 → T2 → T3, based on dependencies.

**TPM concepts**
- Ticket: one unit of work small enough to build, test and ship on its own.
- Acceptance criteria: testable pass/fail conditions, written as Given/When/Then.
- Definition of done: the checklist every ticket must meet, beyond "the code runs."
- Enabler ticket: work no user asks for but every story depends on (here, sign-in).
- Gap analysis: checking stories against the PRD to find requirements nobody owns.

**What went wrong**
- Nothing; the gaps were caught on paper, which is the cheapest place to catch them.

---

## Nov 20, 2026 — Stage 3: Design
**What we did**
- Made 4 design decisions, each with a decision record: Next.js full-stack (002), Supabase Postgres from day one (003), Claude API with Haiku 5.5 and structured JSON output (004), Supabase email + password with admin-created accounts (005).
- Wrote [architecture.md](architecture.md): overview diagram, data model (4 tables), 6 REST endpoints with status codes, and environment variables.

**Decisions**
- Chose Supabase over SQLite to avoid a forced migration at deploy, and because it covers sign-in and organization isolation.
- Rejected Gemini's free tier because free-tier inputs may be used to improve Google's products — inconsistent with a privacy product whose users may paste sensitive details.
- Stored `org_id` on every record despite one organization, so the database enforces isolation and multi-org won't need a rebuild.
- Kept every assessment (not just the latest), which makes "assessment history" nearly free later.

**Concepts learned**
- Frontend vs. backend: what runs in the browser vs. on the server.
- API / REST: a set of requests (method + path) the frontend sends to the backend.
- JSON: the structured text format data travels in.
- Schema: the rules for tables, fields and types.
- Environment variables: settings (like secret keys) kept outside the code.
- Structured output: forcing the AI to reply in an exact JSON shape so code can validate it.
- Authentication vs. authorization: who you are vs. what you can see.

**TPM concepts**
- Non-functional requirements: privacy and cost shaped the AI choice as much as quality did.
- Build vs. buy: "bought" (used) Supabase Auth instead of building sign-in.
- Deliberate scope control: no sign-up, password reset or roles, on purpose.
- Designing for the next step cheaply: org_id and assessment history cost almost nothing now.

**What went wrong**
- Nothing.

---

## Nov 20, 2026 — Stage 4: Build · Scaffold + T0 Sign-in
**What we did**
- Scaffolded Next.js 16 (TypeScript, Tailwind) with Supabase, Claude SDK and zod; merged via PR #1.
- Built T0: Supabase email/password sign-in, a `proxy.ts` gatekeeper (pages → /login, API → 401), `organizations` + `members` tables with row-level security, and `/api/me`. Merged via PR #2.
- All 6 T0 acceptance criteria passed by hand, including `curl -i /api/me` → `401 Unauthorized`.

**Bugs found in acceptance testing (and fixed)**
1. *Prerender error:* Next.js tried to pre-build the "who's signed in" header, which checks the current time. Fix: `await connection()` marks it as request-time only.
2. *Redirect loop:* a signed-in user with no organization bounced between the register (→ /login) and the gatekeeper (→ /). Each rule was correct alone; together they looped. Fix: show "Your account isn't linked to an organization yet" instead of redirecting.
3. *Missing table grants:* the member row existed, but signed-in users had no permission to query the table at all, so the app saw "no membership." Fix: `grant select … to authenticated`, now saved in the migration.
- Also: recreating a user deleted their `members` row (by design, cascade), and renaming a column header in the Table Editor (instead of a cell) broke a query — both diagnosed by reading the exact Postgres error code (42703 = column does not exist).

**Decisions**
- Kept real sign-in (option A); a one-click "Try the demo" account is planned for Stage 6 interview demos instead of removing passwords, which would have broken ownership and data isolation.

**Concepts learned**
- Branch / pull request / merge / pull: the cycle every ticket follows.
- Dependencies and package-lock.json: outside code the app relies on, pinned to exact versions.
- Dev server and localhost; long-running vs. finishing commands.
- Migration: a versioned script that changes the database structure.
- Grants vs. row-level security: "may you touch this table?" vs. "which rows may you see?"
- Server action and data access layer.
- Transactions: a multi-statement query fails all-or-nothing.

**TPM concepts**
- Acceptance testing catches integration bugs that each piece alone wouldn't show.
- Generic errors for users, detailed logs for the team (security vs. debuggability trade-off).
- Scope pressure ("just remove the password") handled with options, not a silent shortcut.

**What went wrong**
- 3 code bugs (above) and 2 setup slips; each took one diagnostic step once the real error was visible. Lesson: make errors visible to the builder early.

---

## Nov 20, 2026 — End of day: where to resume
**State:** T0 merged. T1 (add/edit/view tools) is **built but not yet tested**, saved on branch `feat/t1-register` as a work-in-progress commit. The `tools` table SQL (`supabase/migrations/002_tools.sql`) has **not** been run in Supabase yet.

**Resume here (next session, ~20 min, in the Claude chat as mentor):**
1. `git checkout feat/t1-register`
2. Run `supabase/migrations/002_tools.sql` in the Supabase SQL Editor.
3. `npm run dev`, then test T1's 7 acceptance checks (empty state, required fields, keep input, add, duplicate, edit, 401).
4. Commit, PR, merge.

**Then switch to Claude Code for T2 onward:** install (`curl -fsSL https://claude.ai/install.sh | bash`), `cd ~/Desktop/GovForge`, `claude`, and start with: "Read CLAUDE.md, docs/TRACKER.md, docs/tickets.md, docs/architecture.md and the end of docs/BUILD_LOG.md. T0 and T1 are merged. Start T2 on branch feat/t2-assessment. Plan first and wait for my approval."

**Honest attribution so far:** discovery, requirements, design, T0 and T1 built step by step with Claude (chat) as mentor; T2 onward to be built by directing Claude Code.

---

## Nov 23, 2026 — T1 tested and merged; tech spec written
**Tech spec (Stage 3, revisited):** wrote [tech-spec-ai-assessment.md](tech-spec-ai-assessment.md) for T2 before building it. 8 decisions [D1–D8]; D1 became [Decision 006](decisions/006-risk-floor-rules.md) (code-enforced risk floor, amends 004). Spec also widened T2's "out of date" rule from data types to any input sent to the AI.

**T1 test results:** 7 acceptance checks run by hand. 6 passed first time. **Check 5 (duplicate name) failed:** "Chat GPT" was accepted alongside "ChatGPT" because the rule only ignored capitals.
- **Root cause:** requirement gap. The ticket said "duplicate name" without defining "same."
- **Fix:** names compare after ignoring capitals, spaces and punctuation; enforced in the app (friendly 409 + link) and in the database (generated `name_key` column + unique index, migration `002b_tools_name_key.sql`).
- **Re-test:** 5a (add "Chat GPT") and 5b (rename to "chatgpt") both warn with an "Open it" link. ✅
- **Concept:** testing against acceptance criteria catches what code review doesn't; defence in depth (app check + database constraint).

**Where to resume:** T1 merged. Next: T2 in Claude Code on `feat/t2-assessment`, following the tech spec.

---

## Nov 23, 2026 — Stage 4: Build · T2 AI risk assessment
**How it was built:** first ticket built by directing **Claude Code** (an AI coding agent in the terminal) instead of the chat mentor. Flow: agent read the docs → wrote a [build plan](plans/t2-plan.md) mapping every spec decision [D1–D8] to code and flagging 8 unclear/risky spots → I approved with 3 decisions → agent built in 11 steps with checkpoints → I ran acceptance tests → commit + PR.

**What we did**
- Migration `003_assessments.sql`: assessments table with row-level security, check constraints (a complete assessment always has a level; "not enough information" never does), and a **column-level grant** so only the 4 override columns can ever be updated: the AI's result can't be edited after saving.
- `POST /api/tools/{id}/assess`: thin-input check [D4] → floor from data types [D1, D5] → Claude Haiku 5.5 with a forced `submit_assessment` tool call → zod validation → retry once [D3] → `final = max(floor, AI)`.
- `PATCH /api/assessments/{id}/override`, Out-of-date check [D2], new assessment starts with no override [D6].
- Assessment panel on the tool page: Not assessed · Running · Complete · Not enough information · Out of date · Error with Try again.
- Unit tests (Vitest) and the AI eval (`npm run eval`) [D7]. The eval runs the same pipeline function as the Assess button, so it tests exactly what users get.

**Decisions (plan review; recorded in [tech spec §10](tech-spec-ai-assessment.md#10-resolved-in-plan-review-nov-23))**
- A. Test runner: **Vitest** (used v4: v5 needed newer Node type definitions than the project has; 0 existing packages changed).
- B. Both AI attempts time out → **504** "took too long" (not 502), so slowness and outages stay separate in metrics.
- C. Override: **newest complete assessment only; a second override replaces the first.** Enforced in the app and in the database.
- Kept the spec's forced tool call even though it skips Haiku's thinking step; the eval showed no under-rating, so no change needed.

**Test results**
- Unit tests: **45/45 pass** (floor for every data type, `max()`, 12 kinds of bad AI output rejected, thin input, out of date, override input).
- Acceptance checks (by hand): **8/8 pass** — not assessed, happy path, floor, double-click, out of date, not enough info, override, AI down (invalid key → "Assessment unavailable, your tool is saved, try again").
- Not testable by hand: the 60 s browser timeout (simulate in Stage 5).

**AI eval** — model `claude-haiku-5-5`, prompt `v1`, Nov 23, 2026 (run twice, both passed; ≈ $0.003 per run)

| # | Test tool | Expected | AI level | Floor | Final | Time (s) | Result |
|---|---|---|---|---|---|---|---|
| E1 | ChatGPT (free), public info | Low (Medium OK) | Low | none | Low | 2.2 | ✅ |
| E2 | Otter.ai, client meetings | ≥ Medium (High OK) | High | Medium | High | 2.4 | ✅ |
| E3 | Public chatbot, customer emails | High | High | Medium | High | 2.4 | ✅ |
| E4 | GitHub Copilot, source code | Medium (High OK) | Medium | Medium | Medium | 2.7 | ✅ |
| E5 | Physio clinic scheduler, health data | High | High | High | High | 2.3 | ✅ |
| E6 | ChatGPT, purpose "writing" | Insufficient info | (code check, no AI call) | — | Insufficient info | 0.0 | ✅ |

**Ship gate: PASS** — 0 under-ratings, 6/6 within range, E6 insufficient info. ~2.5 s per assessment vs. the 30 s target.
- Gap: the floor never had to raise a level (Claude was always at or above it), so that path is covered by unit tests only. Add an eval case designed to trigger it in Stage 5.
- E3 reached High on the AI's judgment (its floor is only Medium): the prompt's "personal data + free/public tool → High" rule did that work.

**Found in acceptance testing: override confirmation too subtle (UX fix)**
- **Problem:** after saving an override, nothing clearly confirmed it; the level-chip error was easy to miss.
- **Fix:** a "Override saved — Medium, by <name>, <time>" message at the top of the panel (moss success style, hides after 5 s, announced to screen readers); the override box briefly highlights; Save stays disabled until a level is chosen and the reason has 10+ characters, with a hint saying what's missing; the level error is a prominent red box with red chip borders.
- **Lesson:** acceptance criteria said "the override is shown", which was technically met; testing as a user showed it wasn't *noticeable*. Functional ≠ usable.

**Concepts learned**
- Structured output: forcing the AI to answer through a tool whose inputs follow a JSON schema, then validating it anyway.
- Defense in layers: code rules before (thin input) and after (floor) the AI; app checks plus database constraints.
- Column-level grant: permission to update only specific columns of a table.
- Timeouts and retry budgets: per-attempt limit, total budget, and turning off the SDK's hidden retries.
- Unit test vs. eval: unit tests check code logic (free, offline); evals check AI judgment against known answers (real calls, cost money).
- Regression: tests that catch a future change breaking something that used to work.

**TPM concepts**
- Tech spec as source of truth for an AI coding agent; decisions tagged [D#] and traced into code and the commit message.
- Plan review before build: the agent surfaced ambiguities (A–H) for me to decide instead of guessing.
- Ship gate / release criteria defined before the result is known.
- Usability vs. acceptance criteria: a criterion can pass while the experience still fails.

**What went wrong**
- Vitest 5 wouldn't install (dependency conflict) → used Vitest 4 after checking nothing else changed.
- First eval run passed but Vitest hid the results table → re-ran with console output on (extra ≈ $0.003).
- Type and lint errors caught by automated checks before my testing (fixed in minutes).
- GitHub CLI (`gh`) isn't installed, so the PR was opened in the browser.
- Override confirmation UX (above).

---

## Nov 23, 2026 — Where to resume
**State:** T2 built and tested (unit 45/45, acceptance 8/8, eval ship gate PASS). ⚠️ It reached `main` **without a PR** — see the process incident below.

**Resume here:**
1. Turn on branch protection for `main` (see incident).
2. Start T3 (view the register) on `feat/t3-register`: plan first, wait for approval.
3. Cleanup noted for later: `tools.data_types_changed_at` is unused since spec 3.6.

### Process incident: T2 skipped PR review (Nov 23, 11:05)
- **What happened:** `git checkout main` ran in my Commands tab while Claude Code still had T2's changes uncommitted. Git carried the uncommitted changes onto `main`, Claude Code committed there and pushed. T2 landed on `main` directly; `feat/t2-assessment` on GitHub is empty.
- **Impact:** none on the product (T2 had already passed all tests and the eval). The gap is process: no PR, so no review record for T2.
- **Root cause:** two "writers" in one folder at once (me switching branches, the agent committing), and nothing on GitHub stopping a direct push to `main`.
- **Decision:** don't rewrite history (risky, no benefit). Log it honestly and add a control.
- **Fix:** branch protection on `main` (require a pull request before merging), so it can't happen again, whoever or whatever is pushing.
- **Concepts:** process controls beat good intentions; blameless incident write-up (what, impact, root cause, fix).

---

## Nov 23, 2026 — Stage 4: Build · T3 View the register
**What we did**
- Plan first in plan mode ([T3 plan](plans/t3-plan.md)): files, order, and how each acceptance criterion and failure case maps to code. Scope kept to T3 (no filters, no CSV export).
- Register now shows **Risk** and **Last assessed** for every tool, sorted High → Medium → Low → no level, with name A–Z within a group. The reviewer's override counts when there is one.
- Labels: "Not assessed", "Not enough info", an "Out of date" tag, and "Reviewer override · AI/rules: X".
- Tools and each tool's newest assessment are fetched in parallel and matched up in code; no database change. `GET /api/tools` returns the same sorted register.
- One shared risk badge for the register and the T2 assessment panel.
- Followed the new GIT SAFETY rules: checked the branch before every commit, and confirmed the pushed branch had commits that `main` didn't before opening the PR.

**Decisions (plan review)**
- A. One query for assessments, newest per tool picked in code: no migration; revisit at large scale (backlog K1).
- B. An Out-of-date row keeps its last level for sorting, so a risky tool is never pushed down by an edit; "Not enough info" sorts with Not assessed.

**Test results**
- Unit tests: **52/52 pass** (7 new: sort order, A–Z within a group, override moves the row, out-of-date High stays on top, not-enough-info at the bottom, newest assessment wins).
- Manual checklist (6 test tools, Aster–Fern): **all checks passed** — columns, labels, sort, out of date (and not out of date when only the team changes), override moves the row and a re-assess clears it, register loads with the AI down, signed-out → sign-in page and `401`.
- Skipped with a reason: empty state (unchanged since T1); other organization's data (protected by RLS; two-org test planned for Stage 5).

**Self-review before testing** — every acceptance criterion had code behind it; 3 known limits logged rather than fixed (backlog K1–K3).

**Feedback from testing → [backlog](backlog.md)** (not built: outside T3's scope)
- B1 Bug: "Add tool" form shows the previous tool's details instead of starting blank (T1).
- B2 Delete tools from the register (scope change: hard delete vs. archive needs a decision because of audit history).
- B3 Show the number of tools · B4 visible empty checkboxes for data types · B5 whole row clickable with hover highlight.

**Concepts learned**
- Joining data in code: fetch two lists in parallel and match them up, instead of one query per row.
- Pure functions for business rules (sort, labels) so they're unit-testable.
- Query limits: databases and APIs cap rows per request; know the cap before it bites.

**TPM concepts**
- Self-review against acceptance criteria before handing over for testing.
- Backlog triage: separating bugs, scope changes and quick wins; a scope change (delete) gets a decision, not a silent add.
- Process control in action: the T2 incident's fix (branch checks, verify the PR has a diff) applied on the very next ticket.

**What went wrong**
- Nothing blocking. GitHub CLI still not installed, so the PR is opened in the browser.

---

## Nov 23, 2026 — B1 fix: "Add tool" form always starts blank
**What we did:** Fixed backlog bug B1 on `fix/b1-blank-form`. Root cause confirmed in the Next.js 16 docs: with `cacheComponents` on, Next.js hides recently visited pages (React `<Activity>`, up to 3) instead of removing them, so form input survives navigation. The form now clears itself when the "Add tool" page is hidden (edit form unchanged). Also folded the duplicate end-of-session rule in CLAUDE.md into Daily Workflow step 4.

**Decisions**
- "Always blank" includes Cancel: an unsaved draft is discarded. That's what Cancel means, and it keeps the reset simple.
- Edit form left alone; a possible edit-mode version logged as B6 (verify before fixing).

**Concepts learned**
- Framework defaults can cause bugs: a performance feature (keeping pages alive) changed form behavior.
- Root cause vs. symptom: confirm the cause in the docs before writing the fix.

**TPM concepts**
- Bug triage to fix: backlog item → plan → approval → branch → PR, same process as a ticket.
- Scope discipline: a related issue found mid-fix gets logged (B6), not silently built.

**What went wrong**
- Nothing.

---

## Nov 23, 2026 — Stage 5: Test (deploy gate)
**What we did:** Ran the gate before deploying, on `test/stage-5`. Result in [test-results.md](test-results.md): **Deploy gate: PASS**.
- Unit tests 60/60 (8 new): floor raises a low AI answer, timeout + retry, outage, and the Assess route returns 504/502 without saving anything.
- AI eval E1–E6 (real Claude) PASS, 0 under-ratings. New E7 floor case uses a **stubbed AI** ("Low" + Health data → High): in every real case the AI was already at or above the floor, so a real input that needs raising would be rare and flaky.
- Two-org isolation: second test account in "Test Org B". `npm run check:orgs` 12/12 (database/RLS, both directions); 6/6 API checks by hand as user B (all 404, A's data unchanged).
- Timeout: pointed the app at a server that never answers. Server answered "took too long" (504) after 52 s, but **no spinner was visible** → bug B7, fixed on its own branch (PR #7), retest 5/5.
- Decision 007: removing a tool = archive, not delete (B2 decided, build after deploy).

**Decisions**
- [Decision 007](decisions/007-archive-not-delete.md): archive (soft delete), because assessments are audit evidence.
- E7 via stub, not a real input (deterministic, free, doesn't break when the AI improves).
- B7: fix before deploy (option A), as its own bug branch and PR.

**Concepts learned**
- Stub/fake: replaces something slow, costly or random (the AI) with a fixed answer so a test always behaves the same.
- Unit vs. integration: unit tests check one piece with fakes; the two-org check hits the real database.
- Regression: rerunning old tests after a change to confirm nothing broke (60/60 after merging B7).
- Eval: graded test of AI output quality against expected ranges.

**TPM concepts**
- Deploy gate / go-no-go: a written pass/fail line that decides whether we ship.
- Risk-based testing: test the riskiest behaviors (data isolation, AI under-rating, AI slow) hardest.
- Criteria can pass while the experience fails: the timeout criterion was met on the server, but users saw nothing (B7).

**What went wrong**
- Vitest's `vi.fn()` falsely failed 3 timeout tests although our code handled the errors; replaced with a hand-written fake.
- Eval ran 3 times (~$0.01) because Vitest hid the results table when not in an interactive terminal.
- First test server never started (Next.js allows one dev server per folder); I reported it as ready without checking. Now I check the page actually loads.
- Test account passwords were shared in the chat; change them before sharing the deployed app.

---

## Nov 26, 2026 — Pre-deploy: test password rotation
**What we did:** Rotated the passwords of test accounts A and B, which had been shared in chat on Nov 23. A one-off script (`scripts/rotate-test-passwords.mjs`) uses the Supabase admin API, generates random passwords, writes them only to `.env.local`, and never prints them. Old passwords are rejected and new ones work; `check:orgs` 12/12; leak scan 0 matches. PR #9.

**Decisions:** [Decision 008](decisions/008-rotate-test-passwords-admin-api.md): admin-API script over SQL or reset emails.

**Concepts learned**
- Service role key: a master key that bypasses row-level security; held only for the run, then deleted (least privilege).
- Hash: the database stores a one-way scramble of a password, so changing `.env.local` alone changes nothing.

**TPM concepts:** credential rotation (prove the new works *and* the old fails); blast radius.

**What went wrong:** The first run changed A's password, then failed to sign out sessions (the change had already ended them). The new password was saved first, so nothing was lost; fixed the order and reran.

---

## Nov 26, 2026 — Stage 6: Deploy
**What we did:** GovForge is live at **https://govforge-app.vercel.app** (free Vercel address; the first address, gov-forge-official-uo7b.vercel.app, forwards to it).
- Hosting: Vercel, connected to GitHub. Every merge to `main` deploys.
- New Supabase project `govforge-prod` (East US): built from the same 4 migration files, with public sign-up off and one admin-created account. Smoke-check query 4/4 tables, 4/4 RLS, 8 policies, 0 test rows.
- Three environments, each with its own keys: local and preview use dev; production uses prod. Release checklist, environments table and incident log in [operations.md](operations.md).
- Smoke test on prod (Ang): signed in, added and assessed 3 realistic tools (ChatGPT, Otter.ai, Microsoft 365 Copilot), all assessed successfully. Signed-out API calls return 401.

**Decisions**
- [Decision 009](decisions/009-hosting-vercel.md): Vercel (best Next.js support, previews, one-click rollback).
- [Decision 010](decisions/010-separate-production-database.md): separate Supabase project for production.
- [Decision 011](decisions/011-previews-use-dev.md): preview links use dev keys (staging).
- Fix forward rather than roll back (no users yet). Backlog: B9 (no-organization message) next; B8 (server-only variable names) later.

**Concepts learned**
- Environments: separate copies (local, preview, production), each with its own data and keys.
- Migration: a numbered file that changes the database's structure; never edit one that already ran, add a new one.
- Seed and provisioning: the first rows a fresh database needs, and setting up a new user's access.
- Environment variables: settings outside the code; names are a contract with the code; `NEXT_PUBLIC_` values are copied into the browser at build time, so a change needs a redeploy.
- Config vs. Sensitive in Vercel: public-by-design values vs. write-only secrets.
- Status codes seen live: 200, 307 (redirect to sign-in), 401 (not signed in), 404 (wrong path), 500 (server crashed).

**TPM concepts**
- Release management: smoke test, go/no-go, rollback vs. fix forward.
- Staging: previews on the dev database, so testing never touches prod.
- Observability: the user-facing message was generic on purpose; the server log showed the real cause.
- Blameless incident log: record what broke and why the system allowed it.

**What went wrong** (all in [operations.md → Incidents](operations.md#incidents))
- Prod sign-in failed: the Supabase URL in Vercel had an extra path (server log: `404 Invalid path`).
- Whole site 500: following a Vercel warning, `NEXT_PUBLIC_` was removed from the variable name, so the code found nothing. Renamed back.
- Blank register: the recreated prod account (switched from a fake email to a real one) had no `members` row. Provisioned with SQL; found bug B9.
- The dev Claude key was pasted into the chat while fixing a Vercel warning. Rotated within minutes: new key verified, old key confirmed rejected (401).
- A duplicate Vercel project (the repo imported twice, with no variables) served 500s while GitHub showed green checks. Deleted. Lesson: a green check means it built, not that it works.

---

## Nov 26, 2026 — Where to resume
**State:** Stages 0–6 done and merged (PRs #1–#10). Live: **https://govforge-app.vercel.app**. This handoff is on `docs/handoff-nov26` (merge its PR).

**Portfolio gaps, in order** (see TRACKER checklist):
1. **README case study.** Needed first for job applications; Discovery marked "in progress", honestly.
2. **B9:** clear message for a user with no organization. Fix *before* interviews (Claude Code).
3. **Interviews:** 0 of 12. Run 3+ with the live app; synthesize; update the PRD's H1–H3.
4. **Stage 7:** 2 events, 1 SQL metric, /case-study page, LinkedIn post (after the interview insights).

**Where to work:** code changes (B9, Stage 7, /case-study page) in Claude Code in this folder. Writing (README draft, interview script, synthesis, LinkedIn) can happen in the Claude app; bring the results back into this repo as files.
