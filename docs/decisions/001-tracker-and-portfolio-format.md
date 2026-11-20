# Decision 001: Where the tracker lives and what format the portfolio takes

**Date:** Nov 20, 2026 · **Stage:** 0 Setup · **Status:** Decided

## Decision
- **Tracker:** the repo is the source of truth (`docs/TRACKER.md`, `docs/BUILD_LOG.md`, `docs/decisions/`, GitHub issues and pull requests). The "GovForge TPM Lifecycle Study Guide" doc gets a short summary with links at the end of each working day.
- **Portfolio:** a README case study plus a `/case-study` page inside the deployed app, linking to the PRD, decision records, tests and evals.

## Options considered
| Option | Trade-off |
|---|---|
| Tracker in repo only | Version-controlled proof; less readable for non-technical audiences |
| Tracker in Study Guide doc only | Readable; disconnected from code, drifts |
| **Repo as source + daily doc summary** | Proof plus a learning notebook; costs ~5 min/day |
| Portfolio: README only | Credible for engineers; recruiters must open GitHub |
| **Portfolio: README + in-app /case-study page** | One link shows the working product and the process; ~30 extra min in Stage 7 |
| Portfolio: separate site | Flexible; disconnected from the product, extra upkeep |

## Why
Commits, decision records and passing tests are evidence, not claims. One live link (product + case study) is what recruiters and KPMG reviewers actually click, and the page itself is shipped code.

## What would change my mind
If reviewers consistently ask for a PDF or slide case study, add an exported version. If the daily doc summary keeps getting skipped, drop it and link the repo from the doc instead.
