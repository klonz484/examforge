-- Additive multi-subject enrolment. Preserve the legacy profiles.primary_subject
-- CHECK contract; the full learner library lives in this relation.
create table if not exists public.learner_subjects (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id text not null check (length(btrim(subject_id)) > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, subject_id)
);

create index if not exists learner_subjects_subject_id_idx
  on public.learner_subjects(subject_id);

alter table public.learner_subjects enable row level security;

drop policy if exists learner_subjects_select_own on public.learner_subjects;
drop policy if exists learner_subjects_insert_own on public.learner_subjects;
drop policy if exists learner_subjects_delete_own on public.learner_subjects;

create policy learner_subjects_select_own on public.learner_subjects
  for select to authenticated using (auth.uid() = user_id);
create policy learner_subjects_insert_own on public.learner_subjects
  for insert to authenticated with check (auth.uid() = user_id);
create policy learner_subjects_delete_own on public.learner_subjects
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, delete on public.learner_subjects to authenticated;

-- Backfill the one legacy subject without changing existing profile values.
insert into public.learner_subjects (user_id, subject_id)
select id,
  case primary_subject
    when 'Mathematics' then 'mathematics'
    when 'Physical Science' then 'physical-science'
  end
from public.profiles
where primary_subject in ('Mathematics', 'Physical Science')
on conflict (user_id, subject_id) do nothing;

-- Save profile metadata and the complete subject list in one database transaction.
-- SECURITY INVOKER keeps the caller's existing RLS policies in force.
create or replace function public.save_learner_onboarding(
  p_grade integer,
  p_exam_date date,
  p_primary_subject text,
  p_weak_topics text[],
  p_subject_ids text[]
) returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_grade is null or p_grade not between 10 and 12 then
    raise exception 'Grade must be between 10 and 12' using errcode = '22023';
  end if;

  if p_primary_subject not in ('Mathematics', 'Physical Science') then
    raise exception 'Primary subject must use a supported legacy value' using errcode = '22023';
  end if;

  if p_subject_ids is null or cardinality(p_subject_ids) = 0 then
    raise exception 'Select at least one subject' using errcode = '22023';
  end if;

  if exists (
    select 1 from unnest(p_subject_ids) as item
    where item is null or btrim(item) = ''
  ) then
    raise exception 'Subject identifiers cannot be blank' using errcode = '22023';
  end if;

  insert into public.profiles (id, grade, exam_date, primary_subject, weak_topics)
  values (v_user_id, p_grade, p_exam_date, p_primary_subject, coalesce(p_weak_topics, '{}'))
  on conflict (id) do update set
    grade = excluded.grade,
    exam_date = excluded.exam_date,
    primary_subject = excluded.primary_subject,
    weak_topics = excluded.weak_topics,
    updated_at = now();

  delete from public.learner_subjects where user_id = v_user_id;

  insert into public.learner_subjects (user_id, subject_id)
  select v_user_id, distinct_subject
  from (
    select distinct btrim(item) as distinct_subject
    from unnest(p_subject_ids) as item
  ) selected;
end;
$$;

revoke all on function public.save_learner_onboarding(integer, date, text, text[], text[]) from public;
revoke all on function public.save_learner_onboarding(integer, date, text, text[], text[]) from anon;
grant execute on function public.save_learner_onboarding(integer, date, text, text[], text[]) to authenticated;
