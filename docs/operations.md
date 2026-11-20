# GovForge — Operations

## Secrets and key rotation

| Key | Environment | Created | Expires | Rotate by | Scope |
|---|---|---|---|---|---|
| `govforge-local` (Claude API) | Local (`.env.local`) | Nov 20, 2026 | Jan 8, 2027 | **Jan 6, 2027** (calendar reminder set) | Model requests only (least privilege) |
| `govforge-prod` (Claude API) | Production (Vercel) | Stage 6 | — | — | Model requests only |

**Rotation steps:** create new key → update `.env.local` / Vercel → test one assessment → revoke old key → log it below.

**Safeguards:** keys never committed (`.env.local` is in `.gitignore`); one key per environment; 90-day expiry; workspace spend limit.

### Rotation log
| Date | Key | Done by | Notes |
|---|---|---|---|
| | | | |
