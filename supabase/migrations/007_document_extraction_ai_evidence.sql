-- Persist extraction diagnostics and source evidence for human-reviewed AI drafts.
alter table public.note_uploads
  add column if not exists extraction_metadata jsonb not null default '{}'::jsonb,
  add column if not exists extracted_at timestamptz,
  add column if not exists extraction_error text;

create index if not exists note_uploads_processing_queue_idx
  on public.note_uploads(processing_status, created_at)
  where processing_status in ('queued','processing','failed');

alter table public.generated_questions
  add column if not exists evidence_text text,
  add column if not exists evidence_match boolean not null default false;
