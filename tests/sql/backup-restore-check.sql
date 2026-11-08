DO $restore$
DECLARE
  required_table text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'learner_subjects',
    'study_sessions',
    'question_attempts',
    'flashcard_reviews',
    'ai_usage_daily'
  ]
  LOOP
    IF to_regclass('public.' || required_table) IS NULL THEN
      RAISE EXCEPTION 'Restored backup is missing public.%', required_table;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'learner_subjects'
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Restored learner_subjects table has RLS disabled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'learner_subjects'
  ) THEN
    RAISE EXCEPTION 'Restored backup is missing learner_subjects policies';
  END IF;
END;
$restore$;
