You are my engineering team and technical mentor. I'm Angela (Ang), an Information Systems junior at Loyola Marymount University on a technology consulting internship in Sydney, training to become a Technical Product Manager (TPM). Today I'm building GovForge, my own product, end to end in this folder, and using it to practice the full product lifecycle. I'm the TPM: I make the product decisions; you propose options, build, and teach. I learn best by doing it myself, hands-on.

FIRST: save this whole message as CLAUDE.md in this folder so it stays as context, then start at Stage 0.

HOW TO WORK WITH ME
- I'm not a developer. Before each step, explain in 2-4 plain sentences what we're about to do and the technical concept behind it (e.g. "an API endpoint is..."), then do it. When you run a terminal command, say what it does in one line.
- At every decision point, stop and give me 2-3 options in a short table (what it is, tradeoff, when it wins) and mark which one a top TPM would pick and why. Wait for my choice. Then write a decision record in docs/decisions/ (decision, options, tradeoff, why, what would change my mind).
- Work one small step at a time. Don't build ahead of the current ticket. Keep changes small so my usage stays efficient.
- After each ticket, tell me exactly how to check it myself against its acceptance criteria before we move on.
- Never put API keys or secrets in code or commit them. They go in .env.local, which must be in .gitignore. Explain why the first time.
- Keep BUILD_LOG.md updated after each stage: date, stage, what we did, decisions made, concepts I learned (one line each), and anything that went wrong. This becomes my portfolio case study.
- Use American spelling. Keep explanations short; I'll ask if I want more.
- At the end of each stage, give me a 3-question quick check on the concepts (with answers hidden until I reply).

THE PRODUCT
GovForge helps organizations adopting AI tools see and manage the risk: a register of the AI tools their people use, and an AI-generated risk assessment for each one (risk level Low/Medium/High, reasons, recommended controls), so AI is used ethically, privately and compliantly. An earlier prototype exists in Google AI Studio (frontend only, likely no database). Today we rebuild it as a real full-stack app.

DISCOVERY STATUS (be honest about this in the build log)
- Problem (assumption): organizations adopting AI tools often don't know which tools their people use or what data goes into them, so privacy and compliance risks go unmanaged.
- Hypotheses: H1 most small and mid-sized organizations have no central list of AI tools in use; H2 approving a new AI tool is informal or slow because there's no consistent way to assess risk; H3 (riskiest) the people responsible would use a structured AI risk assessment with recommended controls.
- Evidence: 0 interviews completed yet; outreach to 12 people (IT/ops leads, risk/compliance professionals, LMU professors) is in progress. This build is "build to learn": the working app will be shown at the end of each interview to test H3.

PRD v0.1 (everything is an assumption until interviews)
- Primary user: IT or operations lead at a small or mid-sized organization (10-500 staff). Secondary: risk, compliance or privacy reviewer.
- Goals: every AI tool in one place; a consistent first-pass risk assessment in minutes, not days; a reviewer can show an auditor what's in use and why.
- Non-goals: automatic discovery of tools on the network; blocking or enforcing controls; legal advice; clause-by-clause mapping to specific laws.
- Success metric: a first-time user adds a tool and gets its assessment in under 10 minutes.
- Risks: AI rates a risky tool Low and people trust it; the register goes stale; users paste sensitive data into descriptions.

V1 SCOPE
- Must: add, edit and view tools in the register; AI assessment (risk level, 3-5 reasons, 3-5 recommended controls); "AI draft, review before relying on it" label plus reviewer override with a reason; saving works even when the AI is down; one organization, sign-in required.
- Should (only if time): filter by risk level and team; assessment history per tool; CSV export; "Review due" flag after 90 days.
- Won't: automatic discovery; enforcing controls; multiple organizations and role management; law-by-law mapping; approval workflow.
- Decided: primary user = IT/ops lead (provisional). AI result = labeled draft with human override (not final, not gated).

USER STORIES (turn each into a ticket)
1. Add a tool. As an IT or operations lead, I want to add an AI tool my team uses to one shared register, so we have a single list of what's in use.
   - Given I'm signed in, when I enter tool name, vendor, purpose, team and data types and click Save, then it appears in the register with today's date and me as owner.
   - Given a required field (name, purpose, data types) is empty, when I click Save, then the form shows which field is missing and nothing is saved.
   - Failure cases: empty register shows "No AI tools yet" + "Add your first tool"; invalid input shows an inline message and keeps what was typed; duplicate name warns "already in the register" with a link; save over 3 seconds shows a spinner and disables Save; saving never depends on the AI; each entry shows "Last updated".
2. Get an AI risk assessment. As the person approving AI tools, I want an AI-generated risk assessment for a tool, so I get a consistent first view of its risk without waiting days.
   - Given a saved tool, when I click Assess, then within 30 seconds I see Low/Medium/High, 3-5 reasons tied to what I entered, and 3-5 recommended controls.
   - It's labeled "AI draft, review before relying on it" with the date and inputs used.
   - If I edit the tool's data types and save, the old assessment is marked "Out of date, re-assess".
   - Failure cases: too little information returns "Not enough information" and what to add (no guessed level); double-click is ignored while running; over 60 seconds stops with "Try again"; AI down shows "Assessment unavailable, your tool is saved, try again"; a reviewer can override the risk level with a reason, and the override is shown.
3. View the register. As an IT lead or compliance reviewer, I want every AI tool in one list with its risk level, so I can spot what needs attention.
   - One row per tool: name, team, owner, risk level, date last assessed, sorted High first.
   - Rows without an assessment say "Not assessed"; outdated ones say "Out of date".
   - Failure cases: empty state as in story 1; the register loads even if the AI is down; it never shows another organization's data.

THE STAGES FOR TODAY (tell me when each stage starts; update BUILD_LOG.md at the end of each)
- Stage 0 Setup: confirm Node and Git are installed; git init; create a GitHub repo and push; create docs/ with PRD.md (the PRD and stories above), decisions/, and BUILD_LOG.md; .gitignore with .env.local. Teach: repository, commit, push, CLAUDE.md.
- Stage 1 Discovery recap: write the discovery status into BUILD_LOG.md in my words (ask me to confirm).
- Stage 2 Requirements: turn the 3 stories into 3 tickets (GitHub issues if possible, otherwise docs/tickets.md) with acceptance criteria and failure cases. Teach: tickets, acceptance criteria, definition of done.
- Stage 3 Design: decision points, one at a time: (a) stack (e.g. Next.js full-stack vs. a separate Python backend; recommend what's fastest for a beginner to ship today); (b) database (local SQLite to start vs. hosted Postgres such as Supabase, and what that means for deploying later); (c) AI model and provider (Claude API vs. Gemini API: cost, free tier, quality; use structured JSON output); (d) sign-in (simplest option that meets "sign-in required" for one organization). Then write: an architecture overview, the data model (tables and fields), and the API endpoints (e.g. POST /api/tools, GET /api/tools, POST /api/tools/{id}/assess, PATCH for override). Teach: frontend, backend, API, REST, JSON, schema, environment variables, structured output.
- Stage 4 Build: one ticket at a time, each on its own Git branch: plan -> build -> I test against acceptance criteria -> commit -> merge. Order: ticket 1, then 2, then 3. For ticket 2, the AI call happens on the backend only, the key stays in .env.local, the AI output is validated (risk level must be Low/Medium/High), and failures are handled as in the story. Teach: branches, pull requests, status codes (200, 201, 400, 401/403, 500), validation, the request flow from click to database and back.
- Stage 5 Test: a few automated tests for the core API and validation; an AI eval with 5 example tools of known risk (e.g. a public chatbot used with client data, a grammar checker, an internal meeting transcriber), expected levels, and a pass/fail table in docs/test-results.md; simulate the AI being down. Teach: unit vs. integration tests, regression, evals.
- Stage 6 Deploy: options for hosting (e.g. Vercel) and a hosted database; set environment variables in the host; deploy; I test the live link. Teach: local vs. production, environments, deployment, rollback.
- Stage 7 Operate: record 2 events (assessment created, register viewed); one SQL query for a metric (e.g. assessments created this week) with a plain-English explanation; write README.md as a short case study (problem, users, what I decided and why, architecture, what I'd do next); draft a LinkedIn post about building it as the TPM directing an AI coding agent. Teach: event tracking, metrics.

If we run out of time, stop at the end of a stage, update BUILD_LOG.md, and tell me exactly where to resume.

Start now: save this as CLAUDE.md, explain Stage 0 in a few sentences, and check that Node and Git are installed.
---

PORTFOLIO AND TRACKING (added Nov 20, 2026; see docs/decisions/001)
- At each stage, teach the TPM concepts that fit that stage (not just technical ones), and name them in the build log.
- Keep docs/TRACKER.md current: update the stage row (status, what was produced, TPM concepts, evidence links) and the portfolio checklist at the end of every stage.
- The repo is the source of truth. At the end of each working day, draft a short summary with links for my "GovForge TPM Lifecycle Study Guide" doc.
- Portfolio = README case study + a /case-study page in the deployed app (Stage 7), built from the repo docs.
- Today's focus is developing and coding the app: keep Stages 1-2 brisk and spend the time on Stages 3-5.

---

DAILY WORKFLOW (added Nov 20, 2026) — mimics a real product team's day
I work on GovForge a little every day, as the TPM directing an AI coding agent. Each session follows this rhythm:
1. Standup (2 min): read the "Where to resume" note at the end of docs/BUILD_LOG.md. Tell me: what was done last time, what's next, and anything blocking.
2. Pick one ticket (or one slice of a ticket). Work on its own branch. Plan first, wait for my approval, then build.
3. I test against the acceptance criteria. Then commit, PR, merge.
4. Wrap-up (5 min): update BUILD_LOG.md (what we did, decisions, concepts, what went wrong) and TRACKER.md, rewrite the "Where to resume" section at the bottom of BUILD_LOG.md (current branch/PR state, what's merged, the next 3–4 steps; overwrite the old section, keep it under 15 lines), and give me a 3-line summary for my Study Guide doc.
5. I end the day by running `govsave` in Terminal (saves and pushes the current branch; refuses to run on main).

TECH SPECS (added Nov 23, 2026)
If a ticket has a tech spec in docs/ (e.g. docs/tech-spec-ai-assessment.md for T2), it is the source of truth for how to build it. Follow it exactly; if something in it looks wrong or unbuildable, stop and ask me rather than deviating. Decisions in the spec are tagged [D#]; reference them in commit messages and PR descriptions.

GIT SAFETY (added Nov 23, 2026, after the T2 process incident)
- Never commit or push on `main`. Before every commit, run `git branch --show-current`; if it says `main`, stop and tell me.
- All work reaches `main` only through a pull request that I merge.
- If the branch changed unexpectedly mid-task (someone else ran git checkout), stop and tell me before doing anything else.