-- Disposable PostgreSQL tests for AI usage quota and learner-scoped visibility.
-- Run after learner-subjects-rls.sql; this only uses local CI identities.
\set ON_ERROR_STOP on

-- generated_questions is created in learner-subjects-rls.sql before this additive migration.
\ir ../../supabase/migrations/005_ai_study_usage.sql

set role service_role;
select public.reserve_ai_study_request('00000000-0000-0000-0000-000000000001', 2) as first_request;
select public.reserve_ai_study_request('00000000-0000-0000-0000-000000000001', 2) as second_request;
select public.reserve_ai_study_request('00000000-0000-0000-0000-000000000001', 2) as over_limit_request;
select public.record_ai_study_usage('00000000-0000-0000-0000-000000000001', 500, 250);

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);

do $$
begin
  if (select count(*) from public.ai_usage_daily) <> 1 then
    raise exception 'Account A cannot see its own AI usage row';
  end if;
  if not exists (
    select 1 from public.ai_usage_daily
    where user_id = auth.uid() and request_count = 2
      and input_char_count = 500 and output_char_count = 250
  ) then
    raise exception 'AI quota or usage counters were not recorded correctly';
  end if;
  begin
    perform public.reserve_ai_study_request(auth.uid(), 5);
    raise exception 'Authenticated learner unexpectedly reserved AI quota directly';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);

do $$
begin
  if (select count(*) from public.ai_usage_daily) <> 0 then
    raise exception 'Account B can read Account A AI usage counters';
  end if;
end;
$$;

reset role;
select 'AI usage quota and isolation checks passed' as result;
