-- Disposable PostgreSQL tests for 004_flashcard_reviews.sql.
-- Run after recoverable-study-sessions.sql in the same CI database.
\set ON_ERROR_STOP on
\ir ../../supabase/migrations/004_flashcard_reviews.sql

set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', false);

insert into public.question_attempts (
  user_id, study_session_id, question_id, question_position,
  source_type, topic, is_correct, response
) values (
  auth.uid(), null, 'science-g12-mechanics-001', null,
  'curated', 'Mechanics', false, '{"selected":3}'::jsonb
);

select public.review_flashcard('science-g12-mechanics-001', 0);
do $$
begin
  if not exists (
    select 1 from public.flashcard_reviews
    where user_id = auth.uid() and question_id = 'science-g12-mechanics-001'
      and interval_days = 0 and repetitions = 0 and last_grade = 0
      and ease_factor = 2.30 and next_review_at <= now()
  ) then
    raise exception 'Again did not reset the card to an immediate review';
  end if;
end;
$$;

select public.review_flashcard('science-g12-mechanics-001', 2);
select public.review_flashcard('science-g12-mechanics-001', 2);
do $$
begin
  if not exists (
    select 1 from public.flashcard_reviews
    where user_id = auth.uid() and question_id = 'science-g12-mechanics-001'
      and repetitions = 2 and interval_days = 3 and last_grade = 2
  ) then
    raise exception 'Good review did not advance the interval and repetitions';
  end if;
end;
$$;

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', false);

do $$
begin
  if (select count(*) from public.flashcard_reviews) <> 0 then
    raise exception 'Account B can read Account A review schedule';
  end if;
  begin
    perform public.review_flashcard('science-g12-mechanics-001', 3);
    raise exception 'Account B unexpectedly reviewed Account A mistake';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
select 'flashcard spaced-repetition and RLS checks passed' as result;
