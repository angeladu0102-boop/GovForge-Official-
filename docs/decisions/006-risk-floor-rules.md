# Decision 006: Code-enforced risk floor — the AI can raise the level, never lower it

**Date:** Nov 23, 2026 · **Stage:** 3 Design (tech spec) · **Status:** Decided · **Amends:** [Decision 004](004-ai-claude-haiku.md)

## Decision
The risk level is `max(floor, AI level)`. Code sets a minimum from the tool's data types: Health or Financial data → at least **High**; Client confidential, Customer/Employee personal data or Source code → at least **Medium**; Public/Internal only → no floor.

## Options considered
| Option | Trade-off |
|---|---|
| AI decides alone (Decision 004 as written) | Simplest; untraceable; can under-rate risky tools |
| **Rules floor + AI can raise** | Predictable minimum + AI judgement for nuance; a little more code |
| Rules decide, AI only explains | Fully reproducible; rigid; misses unusual cases |

## Why
The PRD's top risk is "AI rates a risky tool Low and people trust it." A deterministic floor removes the worst case by construction, and the floor reason is shown to users, so the rating is explainable — what an auditor expects. Two tiers (not one, not strict) keep High meaningful and avoid alert fatigue.

## What would change my mind
If interviews show reviewers want fully reproducible scores, move to "rules decide, AI explains." If the eval shows the floor makes almost everything High, loosen the Medium tier.
