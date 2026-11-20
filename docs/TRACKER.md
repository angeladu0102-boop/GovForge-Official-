# GovForge — Lifecycle Tracker

At-a-glance status of GovForge through the product lifecycle. Narrative detail lives in [BUILD_LOG.md](BUILD_LOG.md); decisions in [decisions/](decisions/).

**PM/TPM:** Angela Du · **Engineering:** Claude (AI coding agent), directed by me · **Started:** Nov 20, 2026

| # | Stage | Status | What was produced | TPM concepts shown | Evidence |
|---|---|---|---|---|---|
| 0 | Setup | ✅ Done | Repo, CLAUDE.md, PRD v0.1, .gitignore, build log | Single source of truth; docs as code; secrets management | [Repo](https://github.com/angeladu0102-boop/GovForge-Official-), [PRD](PRD.md), [Decision 001](decisions/001-tracker-and-portfolio-format.md) |
| 1 | Discovery recap | 🟡 In progress | Discovery status in build log | Hypothesis-driven development; riskiest assumption; evidence vs. assumption | [Build log](BUILD_LOG.md) |
| 2 | Requirements | ⬜ Not started | 3 tickets with acceptance criteria | Acceptance criteria; definition of done; MoSCoW; scope control | |
| 3 | Design | ⬜ Not started | Stack, DB, AI, auth decisions; architecture; data model; API | Trade-offs; build vs. buy; decision records; non-functional requirements | |
| 4 | Build | ⬜ Not started | Tickets 1–3 shipped via branches and PRs | Incremental delivery; PR review; scope creep; dependencies | |
| 5 | Test | ⬜ Not started | Automated tests; AI eval (5 tools); outage simulation | Release criteria; evals; risk mitigation | |
| 6 | Deploy | ⬜ Not started | Live app on hosting with hosted DB | Release management; go/no-go; rollback; environments | |
| 7 | Operate | ⬜ Not started | 2 tracked events; 1 SQL metric; README + /case-study; LinkedIn draft | Instrumentation; leading vs. lagging metrics; retro; v2 roadmap | |

## Portfolio evidence checklist
- [x] PRD with hypotheses marked as assumptions
- [x] Decision records (1 so far)
- [ ] Tickets with acceptance criteria
- [ ] Architecture diagram, data model, API spec
- [ ] Merged pull requests per ticket
- [ ] Test suite + AI eval results table
- [ ] Live deployed link
- [ ] Metric query + explanation
- [ ] README case study + /case-study page
- [ ] LinkedIn post draft
