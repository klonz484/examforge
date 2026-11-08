-- Disposable PostgreSQL integration tests for 003_recoverable_study_sessions.sql.
-- Run after learner-subjects-rls.sql in CI. This script may reset only the CI test tables.
\set ON_ERROR_STOP on

create extension if not exists pgcrypto;
drop table if exists public.question_attempts cascade;
drop table if exists public.study_sessions cascade;

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null,
  session_type text not null check (session_type in ('rewind','paper','practice','mock')),
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  score int,
  total_questions int,
  check (score is null or (score >= 0 and total_questions is not null and score <= total_questions)),
  completed_at timestamptz not null default now()
);
alter table public.study_sessions enable row level security;
create policy sessions_select_own on public.study_sessions for select to authenticated using (auth.uid() = user_id);
create policy sessions_insert_own on public.study_sessions for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.study_sessions to authenticated;

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  generated_question_id uuid,
  source_type text not null check (source_type in ('generated','past_paper','formula','seed')),
  topic text not null,
  is_correct boolean not null,
  response jsonb,
  attempted_at timestamptz not null default now()
);
alter table public.question_attempts enable row level security;
create policy attempts_select_own on public.question_attempts for select to authenticated using (auth.uid() = user_id);
create policy attempts_insert_own on public.question_attempts for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.question_attempts to authenticated;

insert into auth.users (id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

\ir ../../supabase/migrations/003_recoverable_study_sessions.sql

-- Simulate an existing completed session and attempt before the context migration.
insert into public.study_sessions (
  id, user_id, subject, session_type, status, grade, subject_id,
  duration_seconds, completed_at
) values (
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Physical Sciences', 'practice', 'completed', 11, 'physical-science',
  60, now()
);
insert into public.question_attempts (
  user_id, study_session_id, question_id, question_position,
  source_type, topic, is_correct, response
) values (
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  'science-g11-newton-001', 0, 'curated', 'Mechanics', false,
  '{"selected":1}'::jsonb
);

\ir ../../supabase/migrations/006_progress_attempt_context.sql

do $$
begin
  if not exists (
    select 1 from public.question_attempts
    where study_session_id = '20000000-0000-0000-0000-000000000002'
      and subject_id = 'physical-science' and grade = 11
  ) then
    raise exception 'Historical attempt was not backfilled from its saved session context';
  end if;
end;
$$;

set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', false);

insert into public.study_sessions (
  id, user_id, subject, session_type, status, duration_seconds, grade,
  subject_id, source_label, session_state, completed_at
) values (
  '20000000-0000-0000-0000-000000000001', auth.uid(), 'Mathematics',
  'practice', 'in_progress', 0, 12, 'mathematics', 'ExamForge original practice',
  '{"questionIndex":0,"answers":[]}'::jsonb, null
);

select public.record_study_answer(
  '20000000-0000-0000-0000-000000000001',
  'math-g12-algebra-001', 'Algebra', 0, '{"selected":3}'::jsonb, false,
  '{"questionIndex":0,"answers":[3]}'::jsonb, 42
);

-- Repeating an answer at the same session position must update, not duplicate.
select public.record_study_answer(
  '20000000-0000-0000-0000-000000000001',
  'math-g12-algebra-001', 'Algebra', 0, '{"selected":0}'::jsonb, true,
  '{"questionIndex":1,"answers":[0]}'::jsonb, 55
);

do $$
begin
  if (select count(*) from public.question_attempts where study_session_id = '20000000-0000-0000-0000-000000000001') <> 1 then
    raise exception 'Answer replay created a duplicate attempt';
  end if;
  if not exists (
    select 1 from public.study_sessions
    where id = '20000000-0000-0000-0000-000000000001'
      and status = 'in_progress' and duration_seconds = 55
      and session_state -> 'answers' = '[0]'::jsonb
  ) then
    raise exception 'Answer RPC did not persist the latest recovery snapshot';
  end if;
end;
$$;

select public.complete_study_session(
  '20000000-0000-0000-0000-000000000001',
  '{"questionIndex":1,"answers":[0],"completed":true}'::jsonb,
  90, 1, 1
);

do $$
begin
  if not exists (
    select 1 from public.study_sessions
    where id = '20000000-0000-0000-0000-000000000001'
      and status = 'completed' and score = 1 and total_questions = 1
      and completed_at is not null
  ) then
    raise exception 'Session completion summary was not persisted';
  end if;
  if not exists (
    select 1 from public.question_attempts
    where study_session_id = '20000000-0000-0000-0000-000000000001'
      and is_correct and response ->> 'selected' = '0'
      and subject_id = 'mathematics' and grade = 12
  ) then
    raise exception 'Saved attempt is missing grade/subject context from its study session';
  end if;
end;
$$;

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', false);

do $$
begin
  if (select count(*) from public.study_sessions) <> 0 then
    raise exception 'Account B can read Account A study sessions';
  end if;
  if (select count(*) from public.question_attempts) <> 0 then
    raise exception 'Account B can read Account A question attempts';
  end if;
  begin
    perform public.record_study_answer(
      '20000000-0000-0000-0000-000000000001',
      'math-g12-algebra-001', 'Algebra', 0, '{"selected":0}'::jsonb, true,
      '{"questionIndex":1,"answers":[0]}'::jsonb, 91
    );
    raise exception 'Account B unexpectedly changed Account A session';
  exception when sqlstate 'P0002' then
    null;
  end;
end;
$$;

reset role;
select 'recoverable study session SQL integration checks passed' as result;
