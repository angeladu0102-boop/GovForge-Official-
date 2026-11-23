# Decision 007: Removing tools: archive (soft delete), never hard delete

**Date:** Nov 23, 2026 · **Stage:** 5 Test (backlog triage) · **Status:** Decided; build after deploy · **Backlog:** B2

## Decision
"Remove a tool" means **archive**, not delete. Archiving sets `archived_at` and `archived_by` on the tool. Then:
- Archived tools are hidden from the register.
- Their assessments are kept, unchanged.
- An archived tool's name stays taken. Adding a tool with that name again warns "already in the register (archived)" with a **Restore** link.
- There is no hard delete in V1.

## Options considered
| Option | Trade-off | When it wins |
|---|---|---|
| Hard delete | Simplest, and the list is truly clean; but it also deletes the assessment history (`on delete cascade`), so evidence of past use is gone | Consumer apps with no audit duty |
| **Archive (soft delete)** | Keeps a full record of what was used, when it stopped and who removed it; every register query needs an "not archived" filter, and names stay reserved | Audit and compliance tools |
| No removal at all | Zero work; but the register fills with tools nobody uses, so it goes stale (a PRD risk) | Very early prototypes |

## Why
GovForge is an audit tool: the assessments are evidence. An auditor may ask "was this tool ever used, and when did it stop?", and a hard delete would erase the answer. Archive keeps the register clean for daily use without losing history. Keeping the name taken avoids two records for the same tool and makes "restore" the obvious path. Recording who archived it keeps the action accountable.

## What would change my mind
A legal or privacy request to erase data (for example, a description where someone pasted personal data) would need a hard delete. If that comes up, add an admin-only purge with its own log entry, not a delete button for everyone.
