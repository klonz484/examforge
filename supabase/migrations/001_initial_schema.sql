-- ExamForge MVP schema (safe to re-run). Run in Supabase SQL Editor or with Supabase CLI.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  grade int check (grade between 10 and 12),
  exam_date date,
  primary_subject text check (primary_subject in ('Physical Science','Mathematics')),
  weak_topics text[] not null default '{}',
  plan text not null default 'free' check (plan in ('free','monthly','until_finals')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
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

create table if not exists public.note_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  processing_status text not null default 'queued' check (processing_status in ('queued','processing','ready','low_confidence','failed')),
  extracted_text text,
  extraction_confidence numeric(4,3),
  created_at timestamptz not null default now()
);

create table if not exists public.generated_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note_upload_id uuid references public.note_uploads(id) on delete set null,
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

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  generated_question_id uuid references public.generated_questions(id) on delete cascade,
  source_type text not null check (source_type in ('generated','past_paper','formula','seed')),
  topic text not null,
  is_correct boolean not null,
  response jsonb,
  attempted_at timestamptz not null default now()
);

create index if not exists study_sessions_user_date_idx on public.study_sessions(user_id, completed_at desc);
create index if not exists note_uploads_user_date_idx on public.note_uploads(user_id, created_at desc);
create index if not exists generated_questions_user_topic_idx on public.generated_questions(user_id, topic, review_status);
create index if not exists question_attempts_user_topic_idx on public.question_attempts(user_id, topic, attempted_at desc);

alter table public.profiles enable row level security;
alter table public.study_sessions enable row level security;
alter table public.note_uploads enable row level security;
alter table public.generated_questions enable row level security;
alter table public.question_attempts enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "sessions_select_own" on public.study_sessions;
drop policy if exists "sessions_insert_own" on public.study_sessions;
drop policy if exists "notes_select_own" on public.note_uploads;
drop policy if exists "notes_insert_own" on public.note_uploads;
drop policy if exists "notes_delete_own" on public.note_uploads;
drop policy if exists "questions_select_own" on public.generated_questions;
drop policy if exists "attempts_select_own" on public.question_attempts;
drop policy if exists "attempts_insert_own" on public.question_attempts;
drop policy if exists "questions_update_own" on public.generated_questions;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "sessions_select_own" on public.study_sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.study_sessions for insert with check (auth.uid() = user_id);
create policy "notes_select_own" on public.note_uploads for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.note_uploads for insert
  with check (auth.uid() = user_id and processing_status = 'queued' and extracted_text is null and extraction_confidence is null);
create policy "notes_delete_own" on public.note_uploads for delete using (auth.uid() = user_id);
create policy "questions_select_own" on public.generated_questions for select using (auth.uid() = user_id);
create policy "attempts_select_own" on public.question_attempts for select using (auth.uid() = user_id);
create policy "attempts_insert_own" on public.question_attempts for insert with check (auth.uid() = user_id);

-- Students may review (approve/reject) their own drafts, but may change nothing else.
-- Question content is written only by trusted server code (Edge Functions).
drop policy if exists "questions_update_own" on public.generated_questions;
create policy "questions_update_own" on public.generated_questions for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke update on public.generated_questions from anon, authenticated;
grant update (review_status) on public.generated_questions to authenticated;

-- Private bucket. Each object is stored under {auth.uid()}/... .
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-notes','student-notes',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

drop policy if exists "notes_bucket_read_own" on storage.objects;
drop policy if exists "notes_bucket_upload_own" on storage.objects;
drop policy if exists "notes_bucket_delete_own" on storage.objects;
create policy "notes_bucket_read_own" on storage.objects for select to authenticated
using (bucket_id = 'student-notes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "notes_bucket_upload_own" on storage.objects for insert to authenticated
with check (bucket_id = 'student-notes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "notes_bucket_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'student-notes' and (storage.foldername(name))[1] = auth.uid()::text);
