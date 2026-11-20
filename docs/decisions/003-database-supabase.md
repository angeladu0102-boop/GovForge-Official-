# Decision 003: Database — Supabase (hosted Postgres) from day one

**Date:** Nov 20, 2026 · **Stage:** 3 Design · **Status:** Decided

## Decision
Use Supabase (hosted Postgres) for both local development and production.

## Options considered
| Option | Trade-off |
|---|---|
| SQLite (local file) | Zero setup, but doesn't persist on Vercel's serverless functions; forces a migration at deploy |
| **Supabase (hosted Postgres)** | ~5 min signup; same DB locally and live; built-in auth and row-level security; free projects pause after ~1 week idle |
| SQLite now → Postgres at deploy (via Prisma) | Fast start, but rework and risk at the deploy moment |

## Why
Avoids planned rework at the riskiest moment (going live). Supabase Auth can cover T0 sign-in, and row-level security enforces T3's "never shows another organization's data" at the database level, not just in app code.

## Known risk
Free projects pause when idle. Mitigation: open the live app a few minutes before every interview demo.

## What would change my mind
If Supabase's free tier limits block the interview demos, or I need to work fully offline, revisit.
