-- Persist the curriculum context used to interpret every curated attempt.
-- Backfill rows linked to an existing study session; unlinked legacy rows remain
-- intentionally unclassified rather than being guessed from a topic label.

alter table public.question_attempts
  add column if not exists subject_id text,
  add column if not exists grade integer
    check (grade is null or grade between 10 and 12);

update public.question_attempts as attempt
set
  subject_id = coalesce(attempt.subject_id, session.subject_id),
  grade = coalesce(attempt.grade, session.grade)
from public.study_sessions as session
where attempt.study_session_id = session.id
  and (attempt.subject_id is null or attempt.grade is null);

create index if not exists question_attempts_user_context_topic_idx
  on public.question_attempts(user_id, subject_id, grade, topic, attempted_at desc);

-- The signed-in learner cannot submit or spoof grade/subject context. It is copied
-- from the owner-controlled in-progress session inside the same transaction.
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
  v_grade integer;
  v_subject_id text;
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

  select grade, subject_id
    into v_grade, v_subject_id
    from public.study_sessions
   where id = p_session_id
     and user_id = v_user_id
     and status = 'in_progress'
   for update;

  if not found then
    raise exception 'Active study session not found' using errcode = 'P0002';
  end if;

  update public.study_sessions
     set session_state = p_session_state,
         duration_seconds = greatest(coalesce(p_duration_seconds, 0), 0),
         last_activity_at = now()
   where id = p_session_id
     and user_id = v_user_id
     and status = 'in_progress';

  insert into public.question_attempts (
    user_id, study_session_id, question_id, question_position,
    source_type, topic, is_correct, response, subject_id, grade
  ) values (
    v_user_id, p_session_id, p_question_id, p_question_position,
    'curated', p_topic, p_is_correct, p_response, v_subject_id, v_grade
  )
  on conflict (study_session_id, question_position)
    where study_session_id is not null and question_position is not null
  do update set
    question_id = excluded.question_id,
    topic = excluded.topic,
    is_correct = excluded.is_correct,
    response = excluded.response,
    subject_id = excluded.subject_id,
    grade = excluded.grade,
    attempted_at = now();
end;
$$;

revoke all on function public.record_study_answer(uuid,text,text,integer,jsonb,boolean,jsonb,integer) from public;
revoke all on function public.record_study_answer(uuid,text,text,integer,jsonb,boolean,jsonb,integer) from anon;
grant execute on function public.record_study_answer(uuid,text,text,integer,jsonb,boolean,jsonb,integer) to authenticated;
