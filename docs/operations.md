# GovForge — Operations

## Secrets and key rotation

| Key | Environment | Created | Expires | Rotate by | Scope |
|---|---|---|---|---|---|
| `govforge-local-2` (Claude API) | Local (`.env.local`) **and** Vercel **Preview** (Sensitive), [Decision 011](decisions/011-previews-use-dev.md) | Nov 26, 2026 | Check in Claude Console | 90 days after creation; update **both** places | Model requests only |
| `govforge-prod` (Claude API) | Production (Vercel, Sensitive) | Nov 26, 2026 | 90 days if set | Check in Claude Console | Model requests only |

**Rotation steps:** create new key → update `.env.local` / Vercel (then **redeploy**) → test one assessment → revoke old key → log it below.

**Safeguards:** keys never committed (`.env.local` is in `.gitignore`); one key per environment; 90-day expiry; workspace spend limit.

### Rotation log
| Date | Key | Done by | Notes |
|---|---|---|---|
| Nov 26, 2026 | `govforge-local` → `govforge-local-2` (dev Claude key) | Claude Code (directed by Ang) | Old key pasted into the chat while fixing a Vercel warning. New key created, set in `.env.local` + Vercel Preview, verified with a free models-list call (200), old key revoked. |
| Nov 26, 2026 | Test accounts A and B (Supabase passwords) | Claude Code (directed by Ang) | Shared in chat in Stage 5. Rotated with `scripts/rotate-test-passwords.mjs` ([Decision 008](decisions/008-rotate-test-passwords-admin-api.md)); old rejected, new verified, `check:orgs` 12/12. Service role key removed from `.env.local` after. |

## Environments ([Decision 010](decisions/010-separate-production-database.md), [Decision 011](decisions/011-previews-use-dev.md))
| Environment | URL | Supabase project | Claude key | Sign in with |
|---|---|---|---|---|
| Local (dev) | `localhost:3000` | dev | `govforge-local-2` (`.env.local`) | Test accounts A / B |
| Preview (one per PR) | Vercel preview link on the PR | dev | `govforge-local-2` (Vercel Preview) | Test accounts A / B |
| Production | https://gov-forge-official-uo7b.vercel.app | `govforge-prod` (East US) | `govforge-prod` (Vercel Production) | Admin-created accounts only (sign-up off) |

Vercel variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key; **Config**, not Sensitive), `ANTHROPIC_API_KEY` (**Sensitive**). Names must match the code exactly. Never add the Supabase secret/service role key to Vercel.

## Release checklist (every merge to `main` is a release)
**Before merging**
- [ ] `npm test` passes and `npm run build` passes; the PR's preview link works (sign in with test account A).
- [ ] Database change? Run the new migration in **dev**, test, then in **prod**, *before* merging code that needs it. Migrations only add (never drop or rename what live code uses).
- [ ] New or changed environment variable? Set it in Vercel for **Production and Preview**, with the exact name. `NEXT_PUBLIC_` only for browser-safe values. Secrets are always marked **Sensitive**.
- [ ] Never paste a key or password into chat, a ticket or a screenshot. If one leaks: create new → update everywhere → test → revoke old → log it.

**After merging (smoke test, 3 minutes)**
- [ ] Vercel deployment shows **Ready**.
- [ ] Live site: sign in → register loads → open one tool → Assess works.
- [ ] Vercel **Logs**: no new red errors.

**If something is broken**
- Users affected → **roll back first**: Vercel → Deployments → last good one → **⋯ → Instant Rollback**. Then fix on a branch.
- Rolling back the code does **not** undo a migration. That's why migrations only add.
- Changed a variable? It only applies after a **Redeploy**.

**Before each interview:** open the live app the day before (free Supabase projects pause after about a week idle), and confirm sign-in works.

## New user (provisioning)
1. Supabase → govforge-prod → Authentication → Users → **Add user** (a real email, **Auto Confirm User**).
2. SQL Editor: insert a `members` row linking the user to the organization (see BUILD_LOG Nov 26). Without it, the user signs in to a blank register (backlog B9).

## Incidents
| Date | What happened | Impact | Cause | Fix | Prevention |
|---|---|---|---|---|---|
| Nov 26, 2026 | Prod sign-in failed: "Email or password is incorrect" | Launch only, no users | Supabase URL in Vercel had an extra path; server log showed `404 Invalid path` | Corrected URL, redeploy | Release checklist: exact URL shape; check Vercel Logs |
| Nov 26, 2026 | Whole site 500 after redeploy | Launch only, no users | `NEXT_PUBLIC_` removed from the variable name after a Vercel warning; code found no URL | Renamed back, redeploy | Names are a contract with the code; B8 makes them server-only |
| Nov 26, 2026 | Blank register, save refused | Launch only | New prod user had no `members` row | Ran the provisioning SQL | Provisioning steps above; B9 shows a clear message |
| Nov 26, 2026 | Dev Claude key pasted into the AI chat | None seen; key revoked within minutes | A Vercel warning was copied together with the key value | Rotated (see rotation log) | Checklist: never paste values; copy only warning text. Secrets marked Sensitive |
