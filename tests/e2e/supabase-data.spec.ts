import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const emailA = process.env.E2E_TEST_EMAIL_A
const passwordA = process.env.E2E_TEST_PASSWORD_A
const emailB = process.env.E2E_TEST_EMAIL_B
const passwordB = process.env.E2E_TEST_PASSWORD_B

// These tests create and delete real user-owned records. Only run when an explicitly disposable staging project and its test accounts are configured.
test.skip(process.env.SUPABASE_IS_DISPOSABLE_STAGING !== 'true' || !url || !anonKey || !emailA || !passwordA || !emailB || !passwordB, 'Requires explicitly designated disposable Supabase staging credentials; never run against production.')

function client() {
  if (!url || !anonKey) throw new Error('Supabase test configuration is missing.')
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

test('Supabase study data and private notes enforce per-account access', async () => {
  expect(url).toBeTruthy()
  expect(anonKey).toBeTruthy()
  expect(emailA).toBeTruthy()
  expect(passwordA).toBeTruthy()
  expect(emailB).toBeTruthy()
  expect(passwordB).toBeTruthy()

  const accountA = client()
  const accountB = client()
  const signInA = await accountA.auth.signInWithPassword({ email: emailA!, password: passwordA! })
  const signInB = await accountB.auth.signInWithPassword({ email: emailB!, password: passwordB! })
  expect(signInA.error).toBeNull()
  expect(signInB.error).toBeNull()
  const userA = signInA.data.user
  expect(userA).toBeTruthy()

  const marker = randomUUID()
  const session = await accountA.from('study_sessions').insert({
    subject: 'Mathematics',
    subject_id: 'mathematics',
    grade: 12,
    session_type: 'practice',
    status: 'in_progress',
    source_label: 'ExamForge original practice',
    session_state: { questionIndex: 0, answers: [] },
    duration_seconds: 0,
    total_questions: 1,
    completed_at: null,
  }).select('id').single()
  expect(session.error).toBeNull()
  expect(session.data?.id).toBeTruthy()

  const answerSave = await accountA.rpc('record_study_answer', {
    p_session_id: session.data!.id,
    p_question_id: 'math-g12-algebra-001',
    p_topic: `E2E Test ${marker}`,
    p_question_position: 0,
    p_response: { selected: 0 },
    p_is_correct: true,
    p_session_state: { questionIndex: 1, answers: [0] },
    p_duration_seconds: 42,
  })
  expect(answerSave.error).toBeNull()
  const completion = await accountA.rpc('complete_study_session', {
    p_session_id: session.data!.id,
    p_session_state: { questionIndex: 1, answers: [0], completed: true },
    p_duration_seconds: 42,
    p_score: 1,
    p_total_questions: 1,
  })
  expect(completion.error).toBeNull()

  const attempt = await accountA.from('question_attempts').insert({
    source_type: 'seed',
    topic: `E2E Test ${marker}`,
    is_correct: true,
    response: { test_marker: marker },
  }).select('id').single()
  expect(attempt.error).toBeNull()
  expect(attempt.data?.id).toBeTruthy()

  const ownSessions = await accountA.from('study_sessions').select('id').eq('id', session.data!.id)
  expect(ownSessions.error).toBeNull()
  expect(ownSessions.data).toHaveLength(1)
  const ownAttempts = await accountA.from('question_attempts').select('id').eq('id', attempt.data!.id)
  expect(ownAttempts.error).toBeNull()
  expect(ownAttempts.data).toHaveLength(1)

  const otherSessions = await accountB.from('study_sessions').select('id').eq('id', session.data!.id)
  expect(otherSessions.error).toBeNull()
  expect(otherSessions.data).toEqual([])
  const otherAttempts = await accountB.from('question_attempts').select('id').eq('id', attempt.data!.id)
  expect(otherAttempts.error).toBeNull()
  expect(otherAttempts.data).toEqual([])

  const forgedSession = await accountB.from('study_sessions').insert({
    user_id: userA!.id,
    subject: `E2E forged ${marker}`,
    session_type: 'rewind',
    duration_seconds: 1,
  })
  expect(forgedSession.error).not.toBeNull()

  const forgedAttempt = await accountB.from('question_attempts').insert({
    user_id: userA!.id,
    source_type: 'seed',
    topic: `E2E forged ${marker}`,
    is_correct: false,
  })
  expect(forgedAttempt.error).not.toBeNull()

  const storagePath = `${userA!.id}/e2e-${marker}.pdf`
  const pdfBytes = Buffer.from('%PDF-1.4\\n% ExamForge E2E test file\\n')
  const upload = await accountA.storage.from('student-notes').upload(storagePath, pdfBytes, {
    contentType: 'application/pdf',
    upsert: false,
  })
  expect(upload.error).toBeNull()

  const note = await accountA.from('note_uploads').insert({
    storage_path: storagePath,
    original_name: `examforge-e2e-${marker}.pdf`,
    mime_type: 'application/pdf',
    size_bytes: pdfBytes.byteLength,
    processing_status: 'queued',
  }).select('id').single()
  expect(note.error).toBeNull()
  expect(note.data?.id).toBeTruthy()

  const ownNote = await accountA.from('note_uploads').select('id').eq('id', note.data!.id)
  expect(ownNote.error).toBeNull()
  expect(ownNote.data).toHaveLength(1)
  const otherNote = await accountB.from('note_uploads').select('id').eq('id', note.data!.id)
  expect(otherNote.error).toBeNull()
  expect(otherNote.data).toEqual([])

  const otherDownload = await accountB.storage.from('student-notes').download(storagePath)
  expect(otherDownload.error).not.toBeNull()
  const forgedUpload = await accountB.storage.from('student-notes').upload(
    `${userA!.id}/e2e-forged-${marker}.pdf`,
    pdfBytes,
    { contentType: 'application/pdf', upsert: false },
  )
  expect(forgedUpload.error).not.toBeNull()

  // Notes and objects have owner-delete policies, so remove the temporary private file.
  const deletedNote = await accountA.from('note_uploads').delete().eq('id', note.data!.id)
  expect(deletedNote.error).toBeNull()
  const deletedObject = await accountA.storage.from('student-notes').remove([storagePath])
  expect(deletedObject.error).toBeNull()

  await accountA.auth.signOut()
  await accountB.auth.signOut()
})


test('signed-in learner can recover a cloud session after sign-out and sign-in', async ({ page }) => {
  const account = client()
  const signedIn = await account.auth.signInWithPassword({ email: emailA!, password: passwordA! })
  expect(signedIn.error).toBeNull()
  const userId = signedIn.data.user!.id

  // This is a disposable staging account. Give it a known, supported study setup.
  const oldSessions = await account.from('study_sessions').update({ status: 'abandoned' })
    .eq('user_id', userId).eq('status', 'in_progress')
  expect(oldSessions.error).toBeNull()
  const future = new Date()
  future.setDate(future.getDate() + 30)
  const date = future.toISOString().slice(0, 10)
  const setup = await account.rpc('save_learner_onboarding', {
    p_grade: 12, p_exam_date: date, p_primary_subject: 'Mathematics',
    p_weak_topics: ['Algebra', 'Functions'], p_subject_ids: ['mathematics'],
  })
  expect(setup.error).toBeNull()
  await account.auth.signOut()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear() })
  await page.goto('/examforge/')
  await page.locator('input[type="date"]').fill(date)
  await page.getByRole('button', { name: 'Mechanics', exact: true }).click()
  await page.getByRole('button', { name: 'Electricity', exact: true }).click()
  await page.getByRole('button', { name: /Start Forging/ }).click()
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('button', { name: /Account \/ sign in/ }).click()
  await page.getByRole('button', { name: /Already have an account\? Sign in/ }).click()
  await page.getByLabel('Email address').fill(emailA!)
  await page.getByLabel('Password').fill(passwordA!)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByLabel("Choose today's study subject")).toHaveValue('mathematics')
  await expect(page.getByRole('button', { name: /Start Tonight/ })).toBeVisible()
  await page.getByRole('button', { name: /Start Tonight/ }).click()
  await page.locator('.answer-option').nth(3).click()
  await page.getByRole('button', { name: 'Save & exit' }).click()

  // Remove the device copy to prove recovery comes from the account-owned row.
  await page.evaluate((id) => localStorage.removeItem(`ef:${id}:active-session`), userId)
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('button', { name: /Account \/ sign in/ }).click()
  await page.getByRole('button', { name: /Already have an account\? Sign in/ }).click()
  await page.getByLabel('Email address').fill(emailA!)
  await page.getByLabel('Password').fill(passwordA!)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('button', { name: /Resume saved session/ })).toBeVisible()
  await page.getByRole('button', { name: /Resume saved session/ }).click()
  await expect(page.locator('.answer-option').nth(3)).toHaveClass(/picked/)
  await page.getByRole('button', { name: 'Abandon this session' }).click()
  await account.auth.signOut()
})
