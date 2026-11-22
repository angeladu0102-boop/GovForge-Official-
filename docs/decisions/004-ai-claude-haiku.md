# Decision 004: AI provider and model — Claude API (Haiku 5.5) with structured JSON output

**Date:** Nov 20, 2026 · **Stage:** 3 Design · **Status:** Decided · Amended by [006](006-risk-floor-rules.md) (risk level is no longer set by the AI alone)

## Decision
Use the Claude API with Claude Haiku 5.5 for risk assessments, called only from the backend, with structured JSON output validated before saving.

## Options considered
| Option | Trade-off |
|---|---|
| **Claude API, Haiku 5.5** | No free tier (small prepaid credit); ~$0.0005 per assessment; API data not used for training |
| Gemini API free tier (Flash) | $0, but free-tier inputs may be used to improve Google's products; tighter rate limits |
| Gemini API paid tier | Inputs not used for training; comparable cost; prices rising Jan 1, 2027 |

## Why
GovForge promises privacy, and the PRD flags users pasting sensitive data into descriptions. A free tier that uses inputs for product improvement contradicts that. Haiku is cheap enough that cost is negligible, and Claude API skills transfer directly to KOTAI.

## What would change my mind
If the Stage 5 eval shows Haiku under-rating risky tools (e.g. rating "public chatbot with client data" as Low), switch to a stronger Claude model (one-line config change) and re-run the eval.
