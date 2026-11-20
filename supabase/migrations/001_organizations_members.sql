-- GovForge T0: organizations and members, with row-level security.
-- Run once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Which organization does the signed-in user belong to?
-- "security definer" lets policies call this without looping back into members' own policy.
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.members where user_id = auth.uid()
$$;

-- Grants: allow signed-in users to query these tables at all.
-- (Row-level security below then limits WHICH rows they see.)
-- Found in T0 testing: without these, reads fail with "permission denied".
grant usage on schema public to authenticated;
grant select on public.organizations, public.members to authenticated;

-- Row-level security: the database itself refuses rows from other organizations.
alter table public.organizations enable row level security;
alter table public.members enable row level security;

drop policy if exists "Members read own organization" on public.organizations;
create policy "Members read own organization"
  on public.organizations for select
  to authenticated
  using (id = public.current_org_id());

drop policy if exists "Members read members of own organization" on public.members;
create policy "Members read members of own organization"
  on public.members for select
  to authenticated
  using (org_id = public.current_org_id());

-- Seed: one organization, and every existing user becomes a member of it.
insert into public.organizations (name)
select 'GovForge Demo Org'
where not exists (select 1 from public.organizations);

insert into public.members (user_id, org_id, display_name)
select u.id,
       (select id from public.organizations order by created_at limit 1),
       coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (user_id) do nothing;
