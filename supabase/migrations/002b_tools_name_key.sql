-- GovForge T1 fix (Nov 23, 2026): duplicate check ignores capitals, spaces and punctuation.
-- "ChatGPT", "chatgpt", "Chat GPT" and "Chat-GPT" all count as the same tool.
-- Run once in Supabase: SQL Editor → New query → paste → Run.

alter table public.tools
  add column if not exists name_key text
  generated always as (regexp_replace(lower(name), '[[:space:][:punct:]]', '', 'g')) stored;

drop index if exists public.tools_org_name_unique;
create unique index if not exists tools_org_name_key_unique
  on public.tools (org_id, name_key);
