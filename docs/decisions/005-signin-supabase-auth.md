# Decision 005: Sign-in — Supabase email + password, admin-created accounts

**Date:** Nov 20, 2026 · **Stage:** 3 Design · **Status:** Decided

## Decision
Use Supabase Auth with email and password. I create accounts in the Supabase dashboard; there is no public sign-up. Every record carries an `org_id` even though V1 has one organization.

## Options considered
| Option | Trade-off |
|---|---|
| **Supabase email + password, admin-created** | Free, in-stack, ~15 min; real user IDs for "me as owner" and database isolation; no self sign-up |
| Supabase magic link | No passwords, but built-in email has a very low hourly limit; demo risk |
| Sign in with Google | Polished, but ~20 min Google Cloud setup; users need Google accounts |
| One shared password | Fastest, but no individual user, so "me as owner" fails |

## Why
Simplest option that meets every T0 acceptance criterion. Sign-up, password reset and roles are explicitly out of scope, so not building them is deliberate scope control. Storing `org_id` now lets the database enforce "never shows another organization's data" and avoids a rebuild if multiple organizations come later.

## What would change my mind
If interviewees want to try GovForge on their own after the demo, add self sign-up with a proper email provider.
