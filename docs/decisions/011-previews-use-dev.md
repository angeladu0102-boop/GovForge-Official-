# Decision 011: Preview deployments use the dev environment

**Date:** Nov 26, 2026 · **Stage:** 6 Deploy · **Status:** Decided

## Decision
Vercel preview deployments (one per PR) use the **dev** Supabase project and the **dev** Claude key. Production keeps its own prod values. The variables have the same names in both environments, with different values per environment in Vercel.

## Options considered
| Option | Trade-off | When it wins |
|---|---|---|
| **Dev keys for previews** | Every PR can be clicked through before merging, without touching prod data; the dev URL, publishable key and Claude key are also stored in Vercel | Changes are reviewed in a browser before merging |
| No keys | Nothing to set up; but previews crash, and a permanent red ❌ teaches you to ignore failures | Previews are never used |
| Prod keys for previews | Works at once; but tests write into the live register (breaks Decision 010) | Never, for us |

## Why
Previews become **staging**: a prod-like copy where breaking things is safe. Ang can check each PR in a browser against its acceptance criteria before merging, and prod data stays clean for interviews.

## Consequences
- Sign in to previews with the **dev** test accounts (A, B), not the prod account.
- Preview assessments use the dev Claude key, at a few cents per test, within its spend limit.
- If the dev Claude key is rotated (by Jan 6, 2027), update it in Vercel's **Preview** settings too.

## What would change my mind
Previews shared outside the team, or real data entered on previews. Either would mean a separate staging Supabase project.
