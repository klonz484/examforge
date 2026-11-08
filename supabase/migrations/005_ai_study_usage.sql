-- Server-side AI Academy quota and provenance support.
-- AI provider credentials must remain in Supabase Edge Function secrets.
alter table public.generated_questions
  add column if not exists grade integer check (grade between 10 and 12),
  add column if not exists subject_id text,
  add column if not exists source_label text not null default 'AI-generated practice draft',
  add column if not exists provenance text not null default 'AI-generated content; not an official DBE question or memo.',
  add column if not exists generation_model text;

create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (timezone('Africa/Johannesburg', now()))::date,
  request_count integer not null default 0 check (request_count >= 0),
  input_char_count bigint not null default 0 check (input_char_count >= 0),
  output_char_count bigint not null default 0 check (output_char_count >= 0),
  last_request_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index if not exists ai_usage_daily_date_idx
  on public.ai_usage_daily(usage_date desc);

alter table public.ai_usage_daily enable row level security;
drop policy if exists ai_usage_daily_select_own on public.ai_usage_daily;
create policy ai_usage_daily_select_own on public.ai_usage_daily
  for select to authenticated using (auth.uid() = user_id);

revoke all on public.ai_usage_daily from anon, authenticated;
grant select on public.ai_usage_daily to authenticated;
grant all on public.ai_usage_daily to service_role;

-- Only a server-side service-role client can reserve or record AI usage.
-- The request counter is incremented atomically before contacting a provider.
create or replace function public.reserve_ai_study_request(
  p_user_id uuid,
  p_daily_limit integer default 5
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_usage_date date := (timezone('Africa/Johannesburg', now()))::date;
begin
  if p_user_id is null or p_daily_limit is null or p_daily_limit < 1 or p_daily_limit > 20 then
    raise exception 'A valid learner and daily limit between 1 and 20 are required' using errcode = '22023';
  end if;

  insert into public.ai_usage_daily (
    user_id, usage_date, request_count, last_request_at, updated_at
  ) values (
    p_user_id, v_usage_date, 1, now(), now()
  )
  on conflict (user_id, usage_date) do update set
    request_count = ai_usage_daily.request_count + 1,
    last_request_at = now(),
    updated_at = now()
  where ai_usage_daily.request_count < p_daily_limit
  returning request_count into v_count;

  return found;
end;
$$;

create or replace function public.record_ai_study_usage(
  p_user_id uuid,
  p_input_chars integer,
  p_output_chars integer
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usage_date date := (timezone('Africa/Johannesburg', now()))::date;
begin
  if p_user_id is null or p_input_chars is null or p_output_chars is null
     or p_input_chars < 0 or p_output_chars < 0 then
    raise exception 'Valid usage amounts and learner are required' using errcode = '22023';
  end if;

  update public.ai_usage_daily
    set input_char_count = input_char_count + p_input_chars,
        output_char_count = output_char_count + p_output_chars,
        updated_at = now()
    where user_id = p_user_id and usage_date = v_usage_date;
  if not found then
    raise exception 'AI request reservation not found for the current local day' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.reserve_ai_study_request(uuid, integer) from public, anon, authenticated;
revoke all on function public.record_ai_study_usage(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.reserve_ai_study_request(uuid, integer) to service_role;
grant execute on function public.record_ai_study_usage(uuid, integer, integer) to service_role;
