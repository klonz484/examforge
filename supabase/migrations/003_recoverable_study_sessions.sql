-- Recoverable Tonight's 20 sessions and attributable question attempts.
-- Additive only: existing completed study history remains intact.
alter table public.study_sessions
  add column if not exists status text not null default 'completed'
    check (status in ('in_progress','completed','abandoned')),
  add column if not exists session_state jsonb,
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists last_activity_at timestamptz not null default now(),
  add column if not exists grade integer check (grade between 10 and 12),
  add column if not exists subject_id text,
  add column if not exists source_label text;

-- Existing completed_at values and the legacy default are preserved. New in-progress
-- inserts explicitly set completed_at = null; older clients still get a completion time.
alter table public.study_sessions alter column completed_at drop not null;
alter table public.study_sessions alter column completed_at set default now();

alter table public.question_attempts
  add column if not exists study_session_id uuid references public.study_sessions(id) on delete cascade,
  add column if not exists question_id text,
  add column if not exists question_position integer check (question_position is null or question_position >= 0);

alter table public.question_attempts
  drop constraint if exists question_attempts_source_type_check;
alter table public.question_attempts
  add constraint question_attempts_source_type_check
  check (source_type in ('generated','past_paper','formula','seed','curated'));

create unique index if not exists question_attempts_session_position_uidx
  on public.question_attempts(study_session_id, question_position)
  where study_session_id is not null and question_position is not null;

create index if not exists study_sessions_recovery_idx
  on public.study_sessions(user_id, status, last_activity_at desc);

drop policy if exists sessions_update_own on public.study_sessions;
create policy sessions_update_own on public.study_sessions
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists attempts_update_own on public.question_attempts;
create policy attempts_update_own on public.question_attempts
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
grant select, insert, update on public.study_sessions to authenticated;
grant select, insert, update on public.question_attempts to authenticated;

-- Record each answer and update the recoverable snapshot atomically.
create or replace function public.record_study_answer(
  p_session_id uuid,
  p_question_id text,
  p_topic text,
  p_question_position integer,
  p_response jsonb,
  p_is_correct boolean,
  p_session_state jsonb,
  p_duration_seconds integer
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
  if p_question_id is null or btrim(p_question_id) = '' or p_topic is null or btrim(p_topic) = '' then
    raise exception 'Question identifier and topic are required' using errcode = '22023';
  end if;
  if p_question_position is null or p_question_position < 0 then
    raise exception 'Question position must be zero or greater' using errcode = '22023';
  end if;
  if p_is_correct is null or p_response is null or p_session_state is null then
    raise exception 'Answer, response and recovery state are required' using errcode = '22023';
  end if;

  update public.study_sessions
    set session_state = p_session_state,
        duration_seconds = greatest(coalesce(p_duration_seconds, 0), 0),
        last_activity_at = now()
    where id = p_session_id and user_id = v_user_id and status = 'in_progress';
  if not found then
    raise exception 'Active study session not found' using errcode = 'P0002';
  end if;

  insert into public.question_attempts (
    user_id, study_session_id, question_id, question_position,
    source_type, topic, is_correct, response
  ) values (
    v_user_id, p_session_id, p_question_id, p_question_position,
    'curated', p_topic, p_is_correct, p_response
  )
  on conflict (study_session_id, question_position)
    where study_session_id is not null and question_position is not null
  do update set
    question_id = excluded.question_id,
    topic = excluded.topic,
    is_correct = excluded.is_correct,
    response = excluded.response,
    attempted_at = now();
end;
$$;

revoke all on function public.record_study_answer(uuid,text,text,integer,jsonb,boolean,jsonb,integer) from public;
revoke all on function public.record_study_answer(uuid,text,text,integer,jsonb,boolean,jsonb,integer) from anon;
grant execute on function public.record_study_answer(uuid,text,text,integer,jsonb,boolean,jsonb,integer) to authenticated;

create or replace function public.complete_study_session(
  p_session_id uuid,
  p_session_state jsonb,
  p_duration_seconds integer,
  p_score integer,
  p_total_questions integer
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
  if p_session_state is null or p_total_questions is null or p_total_questions < 1
     or p_score is null or p_score < 0 or p_score > p_total_questions then
    raise exception 'Invalid completed session summary' using errcode = '22023';
  end if;

  update public.study_sessions
    set status = 'completed',
        session_state = p_session_state,
        duration_seconds = greatest(coalesce(p_duration_seconds, 0), 0),
        score = p_score,
        total_questions = p_total_questions,
        completed_at = now(),
        last_activity_at = now()
    where id = p_session_id and user_id = v_user_id and status = 'in_progress';
  if not found then
    raise exception 'Active study session not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.complete_study_session(uuid,jsonb,integer,integer,integer) from public;
revoke all on function public.complete_study_session(uuid,jsonb,integer,integer,integer) from anon;
grant execute on function public.complete_study_session(uuid,jsonb,integer,integer,integer) to authenticated;
