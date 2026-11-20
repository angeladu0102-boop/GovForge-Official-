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
