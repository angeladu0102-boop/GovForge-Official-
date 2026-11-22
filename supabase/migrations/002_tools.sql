-- GovForge T1: the AI tool register.
-- Run once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  vendor text,
  purpose text not null check (char_length(trim(purpose)) between 1 and 1000),
  team text,
  data_types text[] not null check (cardinality(data_types) >= 1),
  owner_id uuid not null references public.members (user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data_types_changed_at timestamptz not null default now()
);

-- No two tools with the same name (ignoring capitals) in one organization.
create unique index if not exists tools_org_name_unique
  on public.tools (org_id, lower(name));

-- Grants: signed-in users may read, add and edit tools (no delete in V1).
grant select, insert, update on public.tools to authenticated;

-- Row-level security: only your own organization's tools, ever.
alter table public.tools enable row level security;

drop policy if exists "Read own org tools" on public.tools;
create policy "Read own org tools"
  on public.tools for select to authenticated
  using (org_id = public.current_org_id());

drop policy if exists "Add tools to own org as yourself" on public.tools;
create policy "Add tools to own org as yourself"
  on public.tools for insert to authenticated
  with check (org_id = public.current_org_id() and owner_id = auth.uid());

drop policy if exists "Edit own org tools" on public.tools;
create policy "Edit own org tools"
  on public.tools for update to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
