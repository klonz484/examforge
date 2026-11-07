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
    subject: `E2E Test ${marker}`,
    session_type: 'rewind',
    duration_seconds: 42,
    score: 1,
    total_questions: 1,
  }).select('id').single()
  expect(session.error).toBeNull()
  expect(session.data?.id).toBeTruthy()

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
