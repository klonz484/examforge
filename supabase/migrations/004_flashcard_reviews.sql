-- Learner-owned spaced-repetition state for questions answered incorrectly.
create table if not exists public.flashcard_reviews (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id text not null check (length(btrim(question_id)) > 0),
  interval_days integer not null default 0 check (interval_days >= 0),
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor >= 1.30 and ease_factor <= 3.50),
  repetitions integer not null default 0 check (repetitions >= 0),
  last_grade integer check (last_grade between 0 and 3),
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists flashcard_reviews_due_idx
  on public.flashcard_reviews(user_id, next_review_at);

alter table public.flashcard_reviews enable row level security;
drop policy if exists flashcard_reviews_select_own on public.flashcard_reviews;
drop policy if exists flashcard_reviews_insert_own on public.flashcard_reviews;
drop policy if exists flashcard_reviews_update_own on public.flashcard_reviews;
drop policy if exists flashcard_reviews_delete_own on public.flashcard_reviews;

create policy flashcard_reviews_select_own on public.flashcard_reviews
  for select to authenticated using (auth.uid() = user_id);
create policy flashcard_reviews_insert_own on public.flashcard_reviews
  for insert to authenticated with check (auth.uid() = user_id);
create policy flashcard_reviews_update_own on public.flashcard_reviews
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy flashcard_reviews_delete_own on public.flashcard_reviews
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.flashcard_reviews to authenticated;

-- Ratings: 0 Again, 1 Hard, 2 Good, 3 Easy.
-- A learner can only schedule a card created from one of their own incorrect attempts.
create or replace function public.review_flashcard(
  p_question_id text,
  p_grade integer
) returns public.flashcard_reviews
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_previous public.flashcard_reviews%rowtype;
  v_result public.flashcard_reviews%rowtype;
  v_interval integer;
  v_ease numeric(4,2);
  v_repetitions integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_question_id is null or btrim(p_question_id) = '' or p_grade is null or p_grade not between 0 and 3 then
    raise exception 'A question identifier and review grade 0–3 are required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.question_attempts
    where user_id = v_user_id and question_id = p_question_id and is_correct = false
  ) then
    raise exception 'Only your own incorrectly answered questions can be reviewed' using errcode = '42501';
  end if;

  select * into v_previous
  from public.flashcard_reviews
  where user_id = v_user_id and question_id = p_question_id
  for update;

  v_ease := coalesce(v_previous.ease_factor, 2.50);
  v_repetitions := coalesce(v_previous.repetitions, 0);
  v_interval := coalesce(v_previous.interval_days, 0);

  if p_grade = 0 then
    v_interval := 0;
    v_repetitions := 0;
    v_ease := greatest(1.30, v_ease - 0.20);
  elsif p_grade = 1 then
    v_interval := greatest(1, round(greatest(1, v_interval) * 1.20)::integer);
    v_repetitions := v_repetitions + 1;
    v_ease := greatest(1.30, v_ease - 0.15);
  elsif p_grade = 2 then
    v_interval := case
      when v_repetitions = 0 then 1
      when v_repetitions = 1 then 3
      else greatest(1, round(greatest(1, v_interval) * v_ease)::integer)
    end;
    v_repetitions := v_repetitions + 1;
  else
    v_interval := case
      when v_repetitions = 0 then 3
      when v_repetitions = 1 then 5
      else greatest(1, ceil(greatest(1, v_interval) * v_ease * 1.30)::integer)
    end;
    v_repetitions := v_repetitions + 1;
    v_ease := least(3.50, v_ease + 0.15);
  end if;

  insert into public.flashcard_reviews (
    user_id, question_id, interval_days, ease_factor, repetitions,
    last_grade, last_reviewed_at, next_review_at, updated_at
  ) values (
    v_user_id, p_question_id, v_interval, v_ease, v_repetitions,
    p_grade, now(), now() + make_interval(days => v_interval), now()
  )
  on conflict (user_id, question_id) do update set
    interval_days = excluded.interval_days,
    ease_factor = excluded.ease_factor,
    repetitions = excluded.repetitions,
    last_grade = excluded.last_grade,
    last_reviewed_at = excluded.last_reviewed_at,
    next_review_at = excluded.next_review_at,
    updated_at = excluded.updated_at
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.review_flashcard(text, integer) from public;
revoke all on function public.review_flashcard(text, integer) from anon;
grant execute on function public.review_flashcard(text, integer) to authenticated;
