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
