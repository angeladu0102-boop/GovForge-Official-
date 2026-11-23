# GovForge — Lifecycle Tracker

At-a-glance status of GovForge through the product lifecycle. Narrative detail lives in [BUILD_LOG.md](BUILD_LOG.md); decisions in [decisions/](decisions/).

**PM/TPM:** Angela Du · **Engineering:** Claude (AI coding agent), directed by me · **Started:** Nov 20, 2026

| # | Stage | Status | What was produced | TPM concepts shown | Evidence |
|---|---|---|---|---|---|
| 0 | Setup | ✅ Done | Repo, CLAUDE.md, PRD v0.1, .gitignore, build log | Single source of truth; docs as code; secrets management | [Repo](https://github.com/angeladu0102-boop/GovForge-Official-), [PRD](PRD.md), [Decision 001](decisions/001-tracker-and-portfolio-format.md) |
| 1 | Discovery recap | ✅ Done | Discovery status in build log | Hypothesis-driven development; riskiest assumption; evidence vs. assumption | [Build log](BUILD_LOG.md) |
| 2 | Requirements | ✅ Done | 4 tickets (T0 enabler + 3 stories), definition of done, 2 requirement gaps caught | Acceptance criteria; definition of done; enabler tickets; dependencies; gap analysis | [Tickets](tickets.md) |
| 3 | Design | ✅ Done | 4 decisions (stack, DB, AI, sign-in); architecture; data model; API spec; **tech spec for AI assessment (Nov 23) with 8 decisions incl. Decision 006** | Trade-offs; build vs. buy; decision records; non-functional requirements (privacy, cost); deliberate scope control | [Architecture](architecture.md), [Tech spec](tech-spec-ai-assessment.md), [Decisions 002–006](decisions/) |
| 4 | Build | 🟡 Almost done (T0 ✅, T1 ✅, T2 ✅ (merged without PR, see incident), T3 ✅ merged; B1 fix PR open) | Tickets 1–3 shipped via branches and PRs; **T2 (Nov 23): AI assessment built by directing Claude Code from the tech spec; acceptance 8/8; override-confirmation UX fix found in testing.** **T3 (Nov 23): register with risk level, sorted High first; all manual checks passed; 5 feedback items triaged into the backlog** **B1 bug (Nov 23): root cause confirmed (Next.js keeps hidden pages alive); "Add tool" form now resets** | Incremental delivery; PR review; scope creep; dependencies; plan review before build; spec-to-code traceability ([D#]); usable vs. merely functional; self-review against acceptance criteria; backlog triage | [T2 plan](plans/t2-plan.md), [T3 plan](plans/t3-plan.md), [Tech spec §10](tech-spec-ai-assessment.md#10-resolved-in-plan-review-nov-23), [Backlog](backlog.md), [Build log](BUILD_LOG.md) |
| 5 | Test | 🟡 Started early with T2 | Automated tests; AI eval (5 tools); outage simulation. **So far: 52 unit tests (Vitest); AI eval E1–E6 ship gate PASS (0 under-ratings); AI-down check by hand.** Still to do: 60 s timeout simulation, eval case that triggers the floor, docs/test-results.md | Release criteria; evals; risk mitigation; ship gate defined before results | [Eval table](BUILD_LOG.md) |
| 6 | Deploy | ⬜ Not started | Live app on hosting with hosted DB | Release management; go/no-go; rollback; environments | |
| 7 | Operate | ⬜ Not started | 2 tracked events; 1 SQL metric; README + /case-study; LinkedIn draft | Instrumentation; leading vs. lagging metrics; retro; v2 roadmap | |

## Portfolio evidence checklist
- [x] PRD with hypotheses marked as assumptions
- [x] Decision records (6)
- [x] Tech spec (AI assessment)
- [x] Tickets with acceptance criteria
- [x] Architecture diagram, data model, API spec
- [ ] Merged pull requests per ticket
- [ ] Test suite + AI eval results table
- [ ] Live deployed link
- [ ] Metric query + explanation
- [ ] README case study + /case-study page
- [ ] LinkedIn post draft
