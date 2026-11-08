import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { analyseProgress, scopeProgressAttempts } from '../../src/data/progressIntelligence'
import { PRACTICE_QUESTIONS } from '../../src/data/practiceQuestions'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const emailA = process.env.E2E_TEST_EMAIL_A
const passwordA = process.env.E2E_TEST_PASSWORD_A
const emailB = process.env.E2E_TEST_EMAIL_B
const passwordB = process.env.E2E_TEST_PASSWORD_B
const emailC = process.env.E2E_TEST_EMAIL_C
const passwordC = process.env.E2E_TEST_PASSWORD_C

// These tests create and delete real user-owned records. Only run when an explicitly disposable staging project and its test accounts are configured.
test.skip(process.env.SUPABASE_IS_DISPOSABLE_STAGING !== 'true' || !url || !anonKey || !emailA || !passwordA || !emailB || !passwordB || !emailC || !passwordC, 'Requires explicitly designated disposable Supabase staging credentials; never run against production.')

function client() {
  if (!url || !anonKey) throw new Error('Supabase test configuration is missing.')
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

function createTextPdf(text: string): Buffer {
  const safeText = text.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')
  const stream = `BT /F1 12 Tf 72 720 Td (${safeText}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ]
  let output = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(output))
    output += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = Buffer.byteLength(output)
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) output += `${String(offset).padStart(10, '0')} 00000 n \n`
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return Buffer.from(output, 'utf8')
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
    p_topic: 'Algebra',
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

  // Progress must be calculated from the saved account row and its stored context,
  // not from local demo state or a matching topic label on another grade/subject.
  const savedProgressRows = await accountA.from('question_attempts')
    .select('topic,is_correct,attempted_at,question_id,subject_id,grade')
    .eq('study_session_id', session.data!.id)
  expect(savedProgressRows.error).toBeNull()
  expect(savedProgressRows.data).toHaveLength(1)
  expect(savedProgressRows.data![0]).toMatchObject({
    topic: 'Algebra', subject_id: 'mathematics', grade: 12, is_correct: true,
  })
  const accountAAttempts = savedProgressRows.data!.map(row => ({
    topic: String(row.topic),
    correct: Boolean(row.is_correct),
    t: new Date(String(row.attempted_at)).getTime(),
    questionId: String(row.question_id),
    subjectId: String(row.subject_id),
    grade: Number(row.grade),
  }))
  const accountAScoped = scopeProgressAttempts(accountAAttempts, 'mathematics', 12, PRACTICE_QUESTIONS)
  const accountAProgress = analyseProgress(accountAScoped, ['Algebra', 'Functions'])
  expect(accountAProgress.topics[0]).toMatchObject({ attempts: 1, correct: 1, accuracy: 100, evidenceStatus: 'insufficient-sample' })
  expect(accountAProgress.recommendedTopic).toBeNull()

  const accountBRows = await accountB.from('question_attempts')
    .select('topic,is_correct,attempted_at,question_id,subject_id,grade')
    .eq('user_id', signInB.data.user!.id)
  expect(accountBRows.error).toBeNull()
  expect(accountBRows.data).toHaveLength(0)
  const accountBProgress = analyseProgress(
    scopeProgressAttempts([], 'mathematics', 12, PRACTICE_QUESTIONS),
    ['Algebra', 'Functions'],
  )
  expect(accountBProgress.topics.every(topic => topic.attempts === 0)).toBe(true)
  expect(accountBProgress.recommendedTopic).toBeNull()
  expect(accountBProgress.recentAccuracy).toBeNull()

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
  const pdfBytes = createTextPdf(
    "Newton's second law states that the net force acting on an object is equal to its mass multiplied by acceleration. The SI unit of force is the newton. Acceleration describes the rate of change of velocity over time."
  )
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

  const extracted = await accountA.functions.invoke('extract-study-note', { body: { noteId: note.data!.id } })
  expect(extracted.error).toBeNull()
  expect(extracted.data.status).toBe('ready')
  expect(extracted.data.extractedText).toContain('net force acting on an object')
  const storedExtraction = await accountA.from('note_uploads')
    .select('processing_status,extracted_text,extraction_metadata,extracted_at')
    .eq('id', note.data!.id).single()
  expect(storedExtraction.error).toBeNull()
  expect(storedExtraction.data.processing_status).toBe('ready')
  expect(storedExtraction.data.extracted_text).toContain('Newton')
  expect(storedExtraction.data.extraction_metadata).toMatchObject({ parser: 'unpdf@2.1.0', pages: 1, requiresOcr: false })

  // The local test environment intentionally has no AI provider secrets.
  const disabledDraft = await accountA.functions.invoke('generate-study-question', {
    body: {
      grade: 12, subjectId: 'mathematics', subjectName: 'Mathematics',
      topic: 'Algebra', noteId: note.data!.id,
    },
  })
  expect(disabledDraft.error).not.toBeNull()
  const disabledContext = (disabledDraft.error as { context?: Response }).context
  if (disabledContext) {
    const disabledBody = await disabledContext.clone().json()
    expect(String(disabledBody.error)).toContain('credentials have not been configured')
  }

  const ownNote = await accountA.from('note_uploads').select('id').eq('id', note.data!.id)
  expect(ownNote.error).toBeNull()
  expect(ownNote.data).toHaveLength(1)
  const otherNote = await accountB.from('note_uploads').select('id').eq('id', note.data!.id)
  expect(otherNote.error).toBeNull()
  expect(otherNote.data).toEqual([])
  const accountBExtraction = await accountB.functions.invoke('extract-study-note', { body: { noteId: note.data!.id } })
  expect(accountBExtraction.error).not.toBeNull()

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
  // Account C is reserved for recovery; A and B are used by the separate
  // data-isolation test. This prevents concurrent tests sharing daily state.
  const signedIn = await account.auth.signInWithPassword({ email: emailC!, password: passwordC! })
  expect(signedIn.error).toBeNull()
  const userId = signedIn.data.user!.id

  // This is a disposable staging account. Give it a known, supported study setup.
  // These accounts are disposable. Reset all earlier sessions so the run
  // is independent of any completed session left by a previous CI attempt.
  const oldSessions = await account.from('study_sessions').update({
    status: 'abandoned', completed_at: null,
  }).eq('user_id', userId)
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
  await page.getByLabel('Email address').fill(emailC!)
  await page.getByLabel('Password').fill(passwordC!)
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
  await page.getByLabel('Email address').fill(emailC!)
  await page.getByLabel('Password').fill(passwordC!)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('button', { name: /Resume saved session/ })).toBeVisible()
  await page.getByRole('button', { name: /Resume saved session/ }).click()
  await expect(page.locator('.answer-option').nth(3)).toHaveClass(/picked/)
  await page.getByRole('button', { name: 'Abandon this session' }).click()
  await account.auth.signOut()
})
