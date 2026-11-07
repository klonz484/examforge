import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

const migrationPath = fileURLToPath(new URL('../../supabase/migrations/002_learner_subjects.sql', import.meta.url))
const migration = readFileSync(migrationPath, 'utf8')

test('learner subject migration is additive and preserves the legacy profile contract', () => {
  expect(migration).toContain('create table if not exists public.learner_subjects')
  expect(migration).toContain('primary key (user_id, subject_id)')
  expect(migration).toContain("when 'Mathematics' then 'mathematics'")
  expect(migration).toContain("when 'Physical Science' then 'physical-science'")
  expect(migration).not.toMatch(/drop\s+constraint[^;]*primary_subject/i)
  expect(migration).not.toMatch(/alter\s+column\s+primary_subject/i)
})

test('learner subject rows have own-account RLS and transactional onboarding uses invoker rights', () => {
  expect(migration).toContain('alter table public.learner_subjects enable row level security')
  expect(migration).toMatch(/for select to authenticated using \(auth\.uid\(\) = user_id\)/i)
  expect(migration).toMatch(/for insert to authenticated with check \(auth\.uid\(\) = user_id\)/i)
  expect(migration).toMatch(/for delete to authenticated using \(auth\.uid\(\) = user_id\)/i)
  expect(migration).toMatch(/function public\.save_learner_onboarding[\s\S]*?security invoker/i)
  expect(migration).toContain('grant execute on function public.save_learner_onboarding')
  expect(migration).toContain('delete from public.learner_subjects where user_id = v_user_id')
  expect(migration).toContain('insert into public.learner_subjects (user_id, subject_id)')
})
