import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('learner subject migration is additive, backfills legacy profiles, and protects each account', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/002_learner_subjects.sql'), 'utf8')
  expect(sql).toContain('create table if not exists public.learner_subjects')
  expect(sql).toContain('unique (user_id, subject_id)')
  expect(sql).toContain('references auth.users(id) on delete cascade')
  expect(sql).toContain('insert into public.learner_subjects')
  expect(sql).toContain("when p.primary_subject = 'Mathematics' then 'mathematics'")
  expect(sql).toContain("when p.primary_subject in ('Physical Science', 'Physical Sciences') then 'physical-science'")
  expect(sql).toContain('drop constraint if exists profiles_primary_subject_check')
  expect(sql).toContain('alter table public.learner_subjects enable row level security')
  expect(sql).toContain('using (auth.uid() = user_id)')
  expect(sql).toContain('with check (auth.uid() = user_id)')
  expect(sql).toContain('grant select, insert, update, delete on public.learner_subjects to authenticated')
})
