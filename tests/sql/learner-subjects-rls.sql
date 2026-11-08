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

do $$
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

do $$
begin
  if (select count(*) from public.learner_subjects) <> 1 then
    raise exception 'Account B cannot see its own subject row or sees another account';
  end if;
  if exists (select 1 from public.learner_subjects where user_id = '00000000-0000-0000-0000-000000000001') then
    raise exception 'Account B can read account A subject rows';
  end if;
end;
$$;

reset role;
select 'learner_subjects SQL integration checks passed' as result;
