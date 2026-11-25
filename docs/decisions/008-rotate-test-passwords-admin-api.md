# Decision 008: Rotate test-account passwords with a local admin-API script

**Date:** Nov 26, 2026 · **Stage:** 5→6 (pre-deploy hygiene) · **Status:** Done

## Decision
Rotate the passwords of test accounts A and B with `scripts/rotate-test-passwords.mjs`. It uses the Supabase admin API (`auth.admin.updateUserById`) with the service role key, held in `.env.local` only for the run. It generates a random 32-character password for each account, writes it only to `.env.local`, and never prints it.

## Why
Both passwords had been shared in chat (Stage 5), so we treat them as compromised before the app goes public in Stage 6.

## Options considered
| Option | Trade-off | When it wins |
|---|---|---|
| Sign in with the old password, then `updateUser` (anon key) | No master key needed; but a human must choose the passwords | No service key access |
| **Admin API script (service role key)** | Passwords are machine-generated and never seen by a person or the chat; but it briefly needs a key that bypasses all row-level security | Rotating test or service accounts |
| SQL `UPDATE auth.users` in the dashboard | No code; but the plain-text password sits in the SQL editor, and the update bypasses the auth system | Lost access to every other route |

## Safeguards
- The script checks that `.env.local` is ignored by Git, and confirms both accounts (and that they differ) before changing anything.
- Each new password is saved to `.env.local` before Supabase is changed, and the file is written atomically with permission 600, so a crash can't lock us out. Running the script again resumes.
- It signs out all sessions, then confirms the new password works and the old one is rejected.
- After the run, the service role key is removed from `.env.local`. It never goes to Vercel.

## What went wrong
The first run changed A's password and then failed to sign out A's sessions: the password change had already ended the session the script was using. The new password was already saved, so nothing was lost. Fix: sign out first, then update; a resumed run skips the update.

## What would change my mind
Real users → use a self-service reset-password flow instead. A leaked service role key → rotate it in Supabase immediately.
