# GovForge — V1 Tickets

Source: [PRD.md](PRD.md) user stories. Build order: **T0 → T1 → T2 → T3**, one branch per ticket.

## Definition of done (applies to every ticket)
A ticket is done only when **all** of these are true:
1. Every acceptance criterion below passes when I (Ang) test it by hand.
2. Failure cases are handled as written, not just the happy path.
3. No secrets in code; keys only in `.env.local`.
4. Code is on its own branch, merged into `main` through a pull request.
5. BUILD_LOG.md and TRACKER.md are updated.

---

## T0 — Sign-in (enabler)
**Why it exists:** The PRD says "one organization, sign-in required," and stories 1–3 all assume "Given I'm signed in" and "me as owner," but no story covers signing in. An *enabler* ticket covers work users never ask for directly but every story depends on.
**Priority:** Must · **Size:** S · **Blocks:** T1, T2, T3

**Acceptance criteria**
- Given I'm not signed in, when I open any page, then I'm sent to the sign-in page.
- Given valid credentials, when I sign in, then I land on the register and my name is shown.
- Given invalid credentials, when I sign in, then I see "Email or password is incorrect" and stay on the sign-in page.
- Given I'm not signed in, when anything calls the API directly, then it returns **401** and no data.
- I can sign out.

**Out of scope:** sign-up flow, password reset, roles, multiple organizations.

---

## T1 — Add, edit and view a tool in the register (Story 1)
**User story:** As an IT or operations lead, I want to add an AI tool my team uses to one shared register, so we have a single list of what's in use.
**Priority:** Must · **Size:** M · **Depends on:** T0

**Acceptance criteria**
- Given I'm signed in, when I enter tool name, vendor, purpose, team and data types and click Save, then it appears in the register with today's date and me as owner.
- Given a required field (name, purpose, data types) is empty, when I click Save, then the form shows which field is missing and nothing is saved.
- Given a saved tool, when I edit any field and save, then the change appears and "Last updated" changes to now. *(Added: PRD lists "edit" as a Must, but no story covered it.)*

**Failure cases (also acceptance criteria)**
- Empty register shows "No AI tools yet" and an "Add your first tool" button.
- Invalid input shows an inline message and keeps what I typed.
- A duplicate name warns "already in the register" with a link to the existing tool.
- If saving takes over 3 seconds, a spinner shows and Save is disabled.
- Saving never calls the AI.
- Each entry shows "Last updated".

**Out of scope:** deleting tools, filters, CSV export.

---

## T2 — AI risk assessment with reviewer override (Story 2)
**User story:** As the person approving AI tools, I want an AI-generated risk assessment for a tool, so I get a consistent first view of its risk without waiting days.
**Priority:** Must · **Size:** L · **Depends on:** T1

**Acceptance criteria**
- Given a saved tool, when I click Assess, then within 30 seconds I see Low/Medium/High, 3–5 reasons tied to what I entered, and 3–5 recommended controls.
- The result is labeled "AI draft, review before relying on it" with the date and the inputs used.
- If I edit any detail sent to the AI (name, vendor, purpose or data types) and save, the old assessment is marked "Out of date, re-assess". *(Widened from "data types" in the tech spec, Nov 23.)*
- The risk level is never below the floor set by the data types (Decision 006); if the floor raised it, the result says why.
- A reviewer can override the risk level with a required reason; the override, reason, reviewer and date are shown alongside the AI's original level.

**Failure cases**
- Too little information returns "Not enough information" plus what to add, and no risk level.
- Double-clicking Assess while it's running does nothing extra.
- Over 60 seconds: stop and show "Try again".
- AI down: "Assessment unavailable, your tool is saved, try again."
- AI returns anything other than Low/Medium/High: treated as a failure, never shown or saved.

**Technical constraints:** Full design in [tech-spec-ai-assessment.md](tech-spec-ai-assessment.md). AI call happens on the backend only; API key in `.env.local`; AI output validated against a schema before saving.
**Out of scope:** assessment history (Should), approval workflow (Won't).

---

## T3 — View the register (Story 3)
**User story:** As an IT lead or compliance reviewer, I want every AI tool in one list with its risk level, so I can spot what needs attention.
**Priority:** Must · **Size:** S · **Depends on:** T1 (T2 for risk levels)

**Acceptance criteria**
- One row per tool: name, team, owner, risk level, date last assessed.
- Sorted High → Medium → Low → Not assessed.
- Rows without an assessment say "Not assessed"; outdated ones say "Out of date".
- If a reviewer overrode the level, the row shows the override.

**Failure cases**
- Empty state as in T1.
- The register loads even if the AI is down.
- It never shows another organization's data.

**Out of scope:** filters by risk level and team (Should), CSV export (Should).
