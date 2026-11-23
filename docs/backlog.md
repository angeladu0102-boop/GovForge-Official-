# GovForge — Backlog

Ideas and issues not in the current ticket. Each becomes a ticket only when Angela (PM/TPM) prioritizes it. Source and date on every item.

## From T3 acceptance testing (Nov 23, 2026), Angela's feedback
| # | Item | Type | Notes | Suggested priority |
|---|---|---|---|---|
| B1 | **"Add tool" form should always start blank.** It currently shows the previous tool's details. | Bug (T1) | Breaks the "add a new tool" flow and risks saving the wrong details. Likely cause, to confirm when fixed: Next.js 16 keeps the state of recently visited pages, so the old form comes back still filled in. | High: next fix |
| B2 | **Delete tools from the register.** | Scope change | T1 listed deleting as out of scope. Needs a decision first: hard delete vs. archive (hide but keep the record). An auditor may need to see that a tool was used and when it stopped, and deleting a tool would also delete its assessment history. | Decide before building |
| B3 | **Show the number of tools** under "Your register" (e.g. "12 tools"). | UX | Small. Could also show counts by risk level later. | Low effort, quick win |
| B4 | **Data-type options show an empty checkbox before selection**, so it's clear where to click. | UX (T1 form) | The box is there but nearly invisible until selected; make the unchecked box clearly visible. Reuses the existing `chip` style. | Quick win |
| B5 | **Whole register row is clickable**, with a highlight on hover (the rest of the table dims). | UX | Keep a real link inside the row so keyboard and screen-reader users can still reach each tool. Dimming should respect "reduce motion". | Medium |

## Known limits from the T3 self-review (Nov 23, 2026)
| # | Item | Notes |
|---|---|---|
| K1 | Register reads at most 1,000 tools / 1,000 assessments (Supabase's default per query). | Not an issue at V1 scale. Fix with a database view or paging if an org gets close. |
| K2 | If the assessments query fails, the whole register fails instead of showing tools as "risk unknown". | The AI being down is already handled; this is only for database errors. About 10 lines to harden. |
| K3 | "Newest assessment" compares timestamps as text. | Correct for Supabase's format; comparing real dates would be more robust. |
| K4 | `tools.data_types_changed_at` is unused since tech spec 3.6. | Cleanup migration later. |
