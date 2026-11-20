# Decision 002: Tech stack — Next.js full-stack

**Date:** Nov 20, 2026 · **Stage:** 3 Design · **Status:** Decided

## Decision
Build GovForge as a single Next.js app in TypeScript: frontend pages and backend API routes in one codebase.

## Options considered
| Option | Trade-off |
|---|---|
| **Next.js full-stack** | One language, one codebase, one-click deploy on Vercel; less natural for heavy data science |
| React + Python (FastAPI) | Python suits AI/data, but two projects, two deploys and cross-origin setup (~2x setup time) |
| Streamlit | Fastest UI, but limited UI control, weak sign-in, not a true full-stack app |

## Why
Shortest path to a deployed full-stack app for a beginner in one day. Matches existing Vercel hosting. Shows a clear frontend → API → database architecture.

## What would change my mind
If the AI assessment grows into heavy data processing (e.g. scanning vendor documents), add a separate Python service for that piece only.
