-- GovForge T2: AI risk assessments (tech spec 3.8, decisions D1, D4, D6 and plan-review C).
-- Run once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,

  -- Result
  status text not null check (status in ('complete', 'insufficient_info')),
  ai_level text check (ai_level in ('Low', 'Medium', 'High')),       -- the AI's own level, before the floor
  floor_level text check (floor_level in ('Medium', 'High')),        -- minimum from data types (D1/D5), or empty
  floor_reason text,                                                 -- e.g. "Handles Health data"
  risk_level text check (risk_level in ('Low', 'Medium', 'High')),   -- final = max(floor, AI)
  reasons jsonb,
  controls jsonb,
  missing_info jsonb,

  -- Traceability
  inputs_snapshot jsonb not null,   -- exact tool details used ("inputs used"; D2 compares against this)
  model text,                       -- empty when the code-side thin-input check stopped it (no AI call, D4)
  prompt_version text,
  duration_ms integer check (duration_ms >= 0),
  created_by uuid not null references public.members (user_id),
  created_at timestamptz not null default now(),

  -- Reviewer override (D6: each new assessment starts with none)
  override_level text check (override_level in ('Low', 'Medium', 'High')),
  override_reason text check (override_reason is null or char_length(trim(override_reason)) >= 10),
  overridden_by uuid references public.members (user_id),
  overridden_at timestamptz,

  -- A complete assessment always has a level; "Not enough information" never does (D4).
  constraint assessments_level_matches_status check (
    (status = 'complete' and risk_level is not null and ai_level is not null
       and reasons is not null and controls is not null)
    or (status = 'insufficient_info' and risk_level is null and ai_level is null
       and missing_info is not null)
  ),
  -- Override fields are all set together, and only on complete assessments.
  constraint assessments_override_all_or_nothing check (
    (override_level is null and override_reason is null and overridden_by is null and overridden_at is null)
    or (override_level is not null and override_reason is not null and overridden_by is not null
        and overridden_at is not null and status = 'complete')
  )
);

-- "Current assessment" = newest row per tool; this index makes that lookup fast.
create index if not exists assessments_tool_newest
  on public.assessments (tool_id, created_at desc);

-- Grants: signed-in users may read and add assessments, and may update ONLY the
-- override columns. The AI's result can never be edited after it's saved. No delete.
grant select, insert on public.assessments to authenticated;
grant update (override_level, override_reason, overridden_by, overridden_at)
  on public.assessments to authenticated;

-- Row-level security: only your own organization's assessments, ever.
alter table public.assessments enable row level security;

drop policy if exists "Read own org assessments" on public.assessments;
create policy "Read own org assessments"
  on public.assessments for select to authenticated
  using (org_id = public.current_org_id());

drop policy if exists "Add assessments to own org tools as yourself" on public.assessments;
create policy "Add assessments to own org tools as yourself"
  on public.assessments for insert to authenticated
  with check (
    org_id = public.current_org_id()
    and created_by = auth.uid()
    and exists (
      select 1 from public.tools t
      where t.id = tool_id and t.org_id = public.current_org_id()
    )
  );

-- Override: own org, recorded as yourself, and only on the tool's newest assessment
-- (plan-review C). "complete only" is enforced by the check constraint above.
drop policy if exists "Override newest own org assessment" on public.assessments;
create policy "Override newest own org assessment"
  on public.assessments for update to authenticated
  using (
    org_id = public.current_org_id()
    and not exists (
      select 1 from public.assessments newer
      where newer.tool_id = assessments.tool_id
        and newer.created_at > assessments.created_at
    )
  )
  with check (
    org_id = public.current_org_id()
    and overridden_by = auth.uid()
  );
