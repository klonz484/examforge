-- Disposable PostgreSQL tests for AI usage quota and learner-scoped visibility.
-- Run after learner-subjects-rls.sql; this only uses local CI identities.
\set ON_ERROR_STOP on

-- Model the existing table from migration 001 before applying additive migration 005.
create extension if not exists pgcrypto;
create table public.generated_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note_upload_id uuid,
  subject text not null,
  topic text not null,
  question_type text not null check (question_type in ('mcq','calculation','explain','derive')),
  prompt text not null,
  options jsonb,
  answer_key jsonb,
  explanation text,
  confidence numeric(4,3),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table public.generated_questions enable row level security;
create policy generated_questions_select_own on public.generated_questions
  for select to authenticated using (auth.uid() = user_id);
grant select on public.generated_questions to authenticated;

\ir ../../supabase/migrations/005_ai_study_usage.sql

set role service_role;
select public.reserve_ai_study_request('00000000-0000-0000-0000-000000000001', 2) as first_request;
select public.reserve_ai_study_request('00000000-0000-0000-0000-000000000001', 2) as second_request;
select public.reserve_ai_study_request('00000000-0000-0000-0000-000000000001', 2) as over_limit_request;
select public.record_ai_study_usage('00000000-0000-0000-0000-000000000001', 500, 250);

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);

do $$
begin
  if (select count(*) from public.ai_usage_daily) <> 1 then
    raise exception 'Account A cannot see its own AI usage row';
  end if;
  if not exists (
    select 1 from public.ai_usage_daily
    where user_id = auth.uid() and request_count = 2
      and input_char_count = 500 and output_char_count = 250
  ) then
    raise exception 'AI quota or usage counters were not recorded correctly';
  end if;
  begin
    perform public.reserve_ai_study_request(auth.uid(), 5);
    raise exception 'Authenticated learner unexpectedly reserved AI quota directly';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);

do $$
begin
  if (select count(*) from public.ai_usage_daily) <> 0 then
    raise exception 'Account B can read Account A AI usage counters';
  end if;
end;
$$;

reset role;
select 'AI usage quota and isolation checks passed' as result;
