# GovForge — Lifecycle Tracker

At-a-glance status of GovForge through the product lifecycle. Narrative detail lives in [BUILD_LOG.md](BUILD_LOG.md); decisions in [decisions/](decisions/).

**PM/TPM:** Angela Du · **Engineering:** Claude (AI coding agent), directed by me · **Started:** Nov 20, 2026

| # | Stage | Status | What was produced | TPM concepts shown | Evidence |
|---|---|---|---|---|---|
| 0 | Setup | ✅ Done | Repo, CLAUDE.md, PRD v0.1, .gitignore, build log | Single source of truth; docs as code; secrets management | [Repo](https://github.com/angeladu0102-boop/GovForge-Official-), [PRD](PRD.md), [Decision 001](decisions/001-tracker-and-portfolio-format.md) |
| 1 | Discovery recap | ✅ Done | Discovery status in build log | Hypothesis-driven development; riskiest assumption; evidence vs. assumption | [Build log](BUILD_LOG.md) |
| 2 | Requirements | ✅ Done | 4 tickets (T0 enabler + 3 stories), definition of done, 2 requirement gaps caught | Acceptance criteria; definition of done; enabler tickets; dependencies; gap analysis | [Tickets](tickets.md) |
| 3 | Design | ✅ Done | 4 decisions (stack, DB, AI, sign-in); architecture; data model; API spec; **tech spec for AI assessment (Nov 23) with 8 decisions incl. Decision 006** | Trade-offs; build vs. buy; decision records; non-functional requirements (privacy, cost); deliberate scope control | [Architecture](architecture.md), [Tech spec](tech-spec-ai-assessment.md), [Decisions 002–006](decisions/) |
| 4 | Build | ✅ Done (T0–T3 merged; B1, B7 fixes merged) | Tickets 1–3 shipped via branches and PRs; **T2 (Nov 23): AI assessment built by directing Claude Code from the tech spec; acceptance 8/8; override-confirmation UX fix found in testing.** **T3 (Nov 23): register with risk level, sorted High first; all manual checks passed; 5 feedback items triaged into the backlog** **B1 bug (Nov 23): root cause confirmed (Next.js keeps hidden pages alive); "Add tool" form now resets** | Incremental delivery; PR review; scope creep; dependencies; plan review before build; spec-to-code traceability ([D#]); usable vs. merely functional; self-review against acceptance criteria; backlog triage | [T2 plan](plans/t2-plan.md), [T3 plan](plans/t3-plan.md), [Tech spec §10](tech-spec-ai-assessment.md#10-resolved-in-plan-review-nov-23), [Backlog](backlog.md), [Build log](BUILD_LOG.md) |
| 5 | Test | ✅ Done (Nov 23) — **Deploy gate: PASS** | 60 unit tests; acceptance T0–T3 summary; AI eval E1–E6 real + E7 stubbed floor case (PASS, 0 under-ratings); two-org isolation 12/12 database (automated) + 6/6 API (manual); AI timeout simulated with a never-answering server: found bug **B7** (no spinner), fixed via PR #7, retest 5/5; Decision 007 (archive, not delete) | Test strategy (unit vs. integration vs. eval vs. manual); risk-based testing; deploy gate / go-no-go; stubs for deterministic tests; testing found a UX bug the criteria missed; evidence an auditor can read | [Test results](test-results.md), [Decision 007](decisions/007-archive-not-delete.md), [Backlog](backlog.md) |
| 6 | Deploy | ✅ Done (Nov 26) | **Live: https://govforge-app.vercel.app**. Vercel + separate Supabase prod project (same migrations, sign-up off); 3 environments (local/preview on dev, production on prod); prod smoke test with 3 real assessments; release checklist, rollback plan, incident log; 4 launch incidents fixed and logged; leaked test passwords and dev key rotated | Release management; environments and staging; go/no-go; rollback vs. fix forward; observability; blameless incident review; least privilege; credential rotation | [Decisions 008–011](decisions/), [Operations](operations.md), [Build log](BUILD_LOG.md) |
| 7 | Operate | ⬜ Not started | 2 tracked events; 1 SQL metric; README + /case-study; LinkedIn draft | Instrumentation; leading vs. lagging metrics; retro; v2 roadmap | |

## Portfolio evidence checklist
- [x] PRD with hypotheses marked as assumptions
- [x] Decision records (11)
- [x] Tech spec (AI assessment)
- [x] Tickets with acceptance criteria
- [x] Architecture diagram, data model, API spec
- [x] Merged pull requests per ticket (#1–#9)
- [x] Test suite + AI eval results table ([test-results.md](test-results.md))
- [x] Live deployed link ([govforge-app.vercel.app](https://govforge-app.vercel.app))
- [ ] Metric query + explanation
- [ ] README case study + /case-study page
- [ ] LinkedIn post draft
