-- ExamForge learner subject library.
-- Additive migration: keeps profiles.primary_subject and all existing records intact.
-- Apply only after reviewing in the Supabase SQL editor / migration pipeline.

create table if not exists public.learner_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id text not null check (length(subject_id) between 1 and 120),
  subject_name text not null check (length(subject_name) between 1 and 160),
  category text not null check (length(category) between 1 and 60),
  created_at timestamptz not null default now(),
  constraint learner_subjects_user_subject_unique unique (user_id, subject_id)
);

create index if not exists learner_subjects_user_created_idx
  on public.learner_subjects(user_id, created_at);

-- The legacy column used to allow only Mathematics and Physical Science.
-- Remove only that narrow check; preserve the column and its existing values.
alter table public.profiles
  drop constraint if exists profiles_primary_subject_check;

-- Backfill each existing learner's legacy primary subject as an enrolled subject.
insert into public.learner_subjects (user_id, subject_id, subject_name, category)
select
  p.id,
  case
    when p.primary_subject in ('Physical Science', 'Physical Sciences') then 'physical-science'
    when p.primary_subject = 'Mathematics' then 'mathematics'
    else lower(regexp_replace(trim(p.primary_subject), '[^a-zA-Z0-9]+', '-', 'g'))
  end,
  p.primary_subject,
  case
    when p.primary_subject = 'Mathematics' then 'mathematics'
    when p.primary_subject in ('Physical Science', 'Physical Sciences') then 'sciences'
    else 'other'
  end
from public.profiles p
where p.primary_subject is not null and trim(p.primary_subject) <> ''
on conflict (user_id, subject_id) do nothing;

alter table public.learner_subjects enable row level security;

drop policy if exists learner_subjects_select_own on public.learner_subjects;
drop policy if exists learner_subjects_insert_own on public.learner_subjects;
drop policy if exists learner_subjects_update_own on public.learner_subjects;
drop policy if exists learner_subjects_delete_own on public.learner_subjects;

create policy learner_subjects_select_own
  on public.learner_subjects for select to authenticated
  using (auth.uid() = user_id);

create policy learner_subjects_insert_own
  on public.learner_subjects for insert to authenticated
  with check (auth.uid() = user_id);

create policy learner_subjects_update_own
  on public.learner_subjects for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy learner_subjects_delete_own
  on public.learner_subjects for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.learner_subjects to authenticated;
