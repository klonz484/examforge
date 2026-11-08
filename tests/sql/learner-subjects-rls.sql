-- Disposable PostgreSQL integration test for 002_learner_subjects.sql.
-- auth.uid() mirrors Supabase's JWT-claim lookup; no live Supabase project is used.
\set ON_ERROR_STOP on

create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

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

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  grade int check (grade between 10 and 12),
  exam_date date,
  primary_subject text check (primary_subject in ('Physical Science','Mathematics')),
  weak_topics text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
grant select, insert, update on public.profiles to authenticated;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');
insert into public.profiles (id, grade, exam_date, primary_subject, weak_topics) values
  ('00000000-0000-0000-0000-000000000001', 12, '2026-11-30', 'Mathematics', array['Algebra']),
  ('00000000-0000-0000-0000-000000000002', 11, '2026-12-15', 'Physical Science', array['Mechanics']);

\ir ../../supabase/migrations/002_learner_subjects.sql

do $$
begin
  if (select count(*) from public.learner_subjects) <> 2 then
    raise exception 'Legacy profile backfill did not create exactly two subject rows';
  end if;
  if not exists (select 1 from public.learner_subjects where user_id = '00000000-0000-0000-0000-000000000001' and subject_id = 'mathematics') then
    raise exception 'Mathematics legacy subject was not backfilled';
  end if;
  if not exists (select 1 from public.learner_subjects where user_id = '00000000-0000-0000-0000-000000000002' and subject_id = 'physical-science') then
    raise exception 'Physical Sciences legacy subject was not backfilled';
  end if;
end;
$$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);

do $$
begin
  if (select count(*) from public.learner_subjects) <> 1 then
    raise exception 'Account A can see another account subject rows';
  end if;
  if exists (select 1 from public.learner_subjects where user_id = '00000000-0000-0000-0000-000000000002') then
    raise exception 'Account A can read account B subject rows';
  end if;
end;
$$;

select public.save_learner_onboarding(
  10, '2026-12-01', 'Mathematics', array['Functions'],
  array['mathematics', 'accounting', 'history', 'accounting']
);

-- Create and answer a recoverable session as Account A. The answer RPC
-- writes the attempt and recovery snapshot in one transaction.
insert into public.study_sessions (
  user_id, subject, session_type, duration_seconds, status, grade, subject_id,
  source_label, session_state, completed_at
) values (
  auth.uid(), 'Mathematics', 'practice', 0, 'in_progress', 12, 'mathematics',
  'ExamForge original practice', '{"questionIndex":0,"answers":[]}'::jsonb, null
) returning id as session_id \\gset

select public.record_study_answer(
  :'session_id'::uuid,
  'math-g12-algebra-001',
  'Algebra',
  0,
  '{"selected":0}'::jsonb,
  true,
  '{"questionIndex":1,"answers":[0]}'::jsonb,
  37
);

-- Replaying the same position is idempotent rather than duplicating an attempt.
select public.record_study_answer(
  :'session_id'::uuid,
  'math-g12-algebra-001',
  'Algebra',
  0,
  '{"selected":0}'::jsonb,
  true,
  '{"questionIndex":1,"answers":[0]}'::jsonb,
  38
);

do $
begin
  if (select count(*) from public.question_attempts where study_session_id = :'session_id'::uuid) <> 1 then
    raise exception 'Answer replay created a duplicate attempt';
  end if;
  if not exists (select 1 from public.study_sessions where user_id = auth.uid() and status = 'in_progress' and duration_seconds = 38) then
    raise exception 'Answer RPC did not persist the recoverable session snapshot';
  end if;
end;
$;

select public.complete_study_session(
  :'session_id'::uuid,
  '{"questionIndex":1,"answers":[0],"completed":true}'::jsonb,
  65, 1, 1
);

do $
begin
  if not exists (
    select 1 from public.study_sessions
    where user_id = auth.uid() and status = 'completed'
      and score = 1 and total_questions = 1 and completed_at is not null
  ) then
    raise exception 'Session completion summary was not persisted';
  end if;
end;
$;

do $
begin
  if (select count(*) from public.learner_subjects) <> 3 thendo $
begin
  if (select count(*) from public.learner_subjects) <> 3 then
    raise exception 'RPC did not save the de-duplicated subject list';
  end if;
  if (select grade from public.profiles where id = auth.uid()) <> 10 then
    raise exception 'RPC did not update the caller profile';
  end if;
  if exists (select 1 from public.learner_subjects where user_id = '00000000-0000-0000-0000-000000000002') then
    raise exception 'RPC modified another account subject rows';
  end if;
end;
$$;

do $$
begin
  begin
    perform public.save_learner_onboarding(9, '2026-12-01', 'Mathematics', '{}', array['mathematics']);
    raise exception 'Invalid grade unexpectedly succeeded';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    insert into public.learner_subjects (user_id, subject_id)
    values ('00000000-0000-0000-0000-000000000002', 'forged');
    raise exception 'Cross-account insert unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

delete from public.learner_subjects
where user_id = '00000000-0000-0000-0000-000000000002';

-- Verify preservation as the database owner; Account A is intentionally
-- unable to SELECT Account B's row under RLS.
reset role;
do $$
begin
  if not exists (select 1 from public.learner_subjects where user_id = '00000000-0000-0000-0000-000000000002' and subject_id = 'physical-science') then
    raise exception 'Account A deleted account B subject data';
  end if;
end;
$$;

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);

do $
begin
  if (select count(*) from public.learner_subjects) <> 1 then
    raise exception 'Account B cannot see its own subject row or sees another account';
  end if;
  if exists (select 1 from public.learner_subjects where user_id = '00000000-0000-0000-0000-000000000001') then
    raise exception 'Account B can read account A subject rows';
  end if;
  if (select count(*) from public.study_sessions) <> 0 then
    raise exception 'Account B can read account A study sessions';
  end if;
  if (select count(*) from public.question_attempts) <> 0 then
    raise exception 'Account B can read account A question attempts';
  end if;
end;
$;

reset role;
select 'learner_subjects SQL integration checks passed' as result;
