# Decision 009: Hosting: Vercel

**Date:** Nov 26, 2026 · **Stage:** 6 Deploy · **Status:** Decided

## Decision
Host GovForge on **Vercel** (Hobby plan), connected to the GitHub repo:
- Every merge to `main` deploys to production.
- Every PR gets its own preview link.

## Options considered
| Option | Trade-off | When it wins |
|---|---|---|
| **Vercel** | Made by the company behind Next.js, so the best support for this stack; free plan; preview link per PR; one-click rollback. But the free plan is personal and non-commercial only, and server code has a time limit | Next.js app, solo builder, portfolio project |
| Netlify | Similar free tier and Git deploys; but Next.js runs through an adapter, so newer features we use (`cacheComponents`) can lag | A team already on Netlify |
| Render / Railway | Always-on server, no function time limit; but free tiers sleep or are small, and there are no automatic per-PR previews | Long-running jobs or a separate backend |

## Why
Vercel is the lowest-risk path for this stack. Decision 002 already assumed it, the architecture diagram shows it, and preview links let Ang test each PR before it reaches users. One-click rollback gives us a ready undo for a bad release.

## Risk to handle at deploy
The Assess call can take up to 55 s (`SERVER_BUDGET_MS`). The Assess route already sets `export const maxDuration = 60` (added in T2), so Vercel allows it 60 s. That's enough for our own "took too long" message (504) to arrive before Vercel cuts the request off. Check after deploy: the function's limit in Vercel shows 60 s.

## What would change my mind
- Commercial use (paying customers) means upgrading to Vercel Pro or moving hosts.
- Assessments that need more than the plan's time limit mean moving the AI call to a background job or an always-on host.
