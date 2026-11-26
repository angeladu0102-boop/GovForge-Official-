# GovForge — Backlog

Ideas and issues not in the current ticket. Each becomes a ticket only when Angela (PM/TPM) prioritizes it. Source and date on every item.

## From T3 acceptance testing (Nov 23, 2026), Angela's feedback
| # | Item | Type | Notes | Suggested priority |
|---|---|---|---|---|
| B1 | ✅ **Fixed Nov 23 (`fix/b1-blank-form`).** **"Add tool" form should always start blank.** It currently shows the previous tool's details. | Bug (T1) | Breaks the "add a new tool" flow and risks saving the wrong details. Root cause confirmed: `cacheComponents` makes Next.js 16 hide pages (React Activity) instead of removing them, so typed values survive. Fix: the form clears itself when the page is hidden. | Done |
| B2 | **Decided Nov 23 ([Decision 007](decisions/007-archive-not-delete.md)): archive, not delete. Build after deploy.** **Delete tools from the register.** | Scope change | Archive sets `archived_at` + `archived_by`; archived tools are hidden from the register; assessments are kept; the name stays taken and re-adding warns with a Restore link; no hard delete in V1. | Decided, build after deploy |
| B3 | **Show the number of tools** under "Your register" (e.g. "12 tools"). | UX | Small. Could also show counts by risk level later. | Low effort, quick win |
| B4 | **Data-type options show an empty checkbox before selection**, so it's clear where to click. | UX (T1 form) | The box is there but nearly invisible until selected; make the unchecked box clearly visible. Reuses the existing `chip` style. | Quick win |
| B6 | **Check the edit form for the same stale-state issue.** | Possible bug (T1) | Found while fixing B1. If you leave an edit form with unsaved changes and come back, the old typing may still show. Not seen in testing yet; confirm first. | Low: verify first |
| B5 | **Whole register row is clickable**, with a highlight on hover (the rest of the table dims). | UX | Keep a real link inside the row so keyboard and screen-reader users can still reach each tool. Dimming should respect "reduce motion". | Medium |
| B7 | ✅ **Fixed Nov 23 (`fix/b7-assess-spinner`).** **No visible spinner while an assessment runs.** | Bug (T2) | Found in the Stage 5 timeout test: the spinner lived inside the Assess button, which was hidden while running, leaving only a faint grey line for up to 55 s. Fix: the button stays visible (disabled, spinner + "Assessing…"), and the status line is easier to see. | Done |

## Known limits from the T3 self-review (Nov 23, 2026)
| # | Item | Notes |
|---|---|---|
| K1 | Register reads at most 1,000 tools / 1,000 assessments (Supabase's default per query). | Not an issue at V1 scale. Fix with a database view or paging if an org gets close. |
| K2 | If the assessments query fails, the whole register fails instead of showing tools as "risk unknown". | The AI being down is already handled; this is only for database errors. About 10 lines to harden. |
| K3 | "Newest assessment" compares timestamps as text. | Correct for Supabase's format; comparing real dates would be more robust. |
| K4 | `tools.data_types_changed_at` is unused since tech spec 3.6. | Cleanup migration later. |

## From Stage 6 deploy (Nov 26, 2026)
| # | Item | Type | Notes | Suggested priority |
|---|---|---|---|---|
| B9 | **Signed-in user with no organization: empty register area, and saving returns 401 "Not signed in" (should be 403).** | Bug (UX) | Found in the prod smoke test. The header already shows "Your account isn't linked to an organization yet."; the real gaps are the empty register area (show the same message there) and the API status (return 403, since the user *is* signed in but not allowed). Also: the `[auth]` warning writes the user's email to server logs; log the user ID only (privacy). | **Next** (small, seen in prod) |
| B10 | **Custom domain** (e.g. govforge.com, about $10–15 a year). | Idea | Only once GovForge is shared beyond interviews. Free address in use: govforge-app.vercel.app. | Later |
| B8 | **Make the Supabase variables server-only** (drop `NEXT_PUBLIC_`). | Tech debt / security hygiene | The code only reads them on the server. Touches dev, prod, preview settings and the scripts; do with a checklist. | Later |
