# GovForge — PRD v0.1

_v0.1 written Nov 20; corrected Nov 26 to match as-built._

> Everything here is an assumption until interviews are done (0 of 12 completed as of Nov 20, 2026).

## Problem (assumption)
Organizations adopting AI tools often don't know which tools their people use or what data goes into them, so privacy and compliance risks go unmanaged.

## Hypotheses
- **H1:** Most small and mid-sized organizations have no central list of AI tools in use.
- **H2:** Approving a new AI tool is informal or slow because there's no consistent way to assess risk.
- **H3 (riskiest):** The people responsible would use a structured AI risk assessment with recommended controls.

## Users
- **Primary:** IT or operations lead at a small or mid-sized organization (10–500 staff). *(Provisional)*
- **Secondary:** Risk, compliance or privacy reviewer.

## Goals
- Every AI tool in one place.
- A consistent first-pass risk assessment in minutes, not days.
- A reviewer can show an auditor what's in use and why.

## Non-goals
- Automatic discovery of tools on the network.
- Blocking or enforcing controls.
- Legal advice.
- Clause-by-clause mapping to specific laws.

## Success metric
A first-time user adds a tool and gets its assessment in under 10 minutes.

## Risks
- AI rates a risky tool Low and people trust it.
- The register goes stale.
- Users paste sensitive data into descriptions.

## V1 scope
**Must**
- Add, edit and view tools in the register.
- AI assessment: risk level, 3–5 reasons, 3–5 recommended controls.
- "AI draft, review before relying on it" label plus reviewer override with a reason.
- Saving works even when the AI is down.
- One organization, sign-in required.

**Should (only if time)**
- Filter by risk level and team.
- Assessment history per tool.
- CSV export.
- "Review due" flag after 90 days.

**Won't**
- Automatic discovery; enforcing controls; multiple organizations and role management; law-by-law mapping; approval workflow.

**Decided**
- Primary user = IT/ops lead (provisional).
- AI result = labeled draft with human override (not final, not gated).

## User stories

### 1. Add a tool
As an IT or operations lead, I want to add an AI tool my team uses to one shared register, so we have a single list of what's in use.
- Given I'm signed in, when I enter tool name, vendor, purpose, team and data types and click Save, then it appears in the register with today's date and me as owner.
- Given a required field (name, purpose, data types) is empty, when I click Save, then the form shows which field is missing and nothing is saved.
- **Failure cases:** empty register shows "No AI tools yet" + "Add your first tool"; invalid input shows an inline message and keeps what was typed; duplicate name warns "already in the register" with a link; save over 3 seconds shows a spinner and disables Save; saving never depends on the AI; each entry shows "Last updated".

### 2. Get an AI risk assessment
As the person approving AI tools, I want an AI-generated risk assessment for a tool, so I get a consistent first view of its risk without waiting days.
- Given a saved tool, when I click Assess, then within 30 seconds I see Low/Medium/High, 3–5 reasons tied to what I entered, and 3–5 recommended controls.
- It's labeled "AI draft, review before relying on it" with the date and inputs used.
- If I edit any input sent to the AI (name, vendor, purpose or data types) and save, the old assessment is marked "Out of date, re-assess". *(Widened from data types only by the tech spec on Nov 23, D2.)*
- **Failure cases:** too little information returns "Not enough information" and what to add (no guessed level); double-click is ignored while running; over 60 seconds stops with "Try again"; AI down shows "Assessment unavailable, your tool is saved, try again"; a reviewer can override the risk level with a reason, and the override is shown.

### 3. View the register
As an IT lead or compliance reviewer, I want every AI tool in one list with its risk level, so I can spot what needs attention.
- One row per tool: name, team, owner, risk level, date last assessed, sorted High first.
- Rows without an assessment say "Not assessed"; outdated ones say "Out of date".
- **Failure cases:** empty state as in story 1; the register loads even if the AI is down; it never shows another organization's data.
