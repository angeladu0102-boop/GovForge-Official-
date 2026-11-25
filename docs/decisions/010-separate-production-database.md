# Decision 010: Separate Supabase project for production

**Date:** Nov 26, 2026 · **Stage:** 6 Deploy · **Status:** Decided

## Decision
Production uses its own Supabase project, **govforge-prod**. The existing project becomes **dev**: it stays in `.env.local` and holds the test accounts and test data. Only the prod project's URL and anon key go into Vercel. The prod database is built from the same files in `supabase/migrations/`.

## Options considered
| Option | Trade-off | When it wins |
|---|---|---|
| **New project for production** | About 20 minutes of setup and a second set of keys; tests can never touch real data, test accounts don't exist in prod, interviewees see a clean register | Real people will see or enter data |
| Same project as local | Zero setup; but every test run writes into the live register, and test accounts (passwords leaked once) can sign in to prod | Throwaway demo |
| Same project, cleaned up | Fast; but test runs dirty it again, and there's still no separation | One-time demo before switching |

## Why
Environment separation: testing must never be able to damage what users see. The live app is what interviewees see when we test H3, so it should be clean and trustworthy. It also limits the damage of a leaked test credential, which already happened once (Decision 008).

## Consequences
- **Two sets of keys:** dev in `.env.local`, prod in Vercel only.
- **Every schema change runs in both:** apply the migration in dev, test, then apply the same file in prod before merging code that needs it.
- **Free projects pause after about a week idle:** open the live app the day before each interview (release checklist).
- **No public sign-up in prod:** accounts are created by an admin.

## What would change my mind
- Pressure on the free plan's 2-project limit.
- A need for many short-lived environments, which would mean Supabase branching or a paid plan.
