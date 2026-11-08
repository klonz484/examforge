import { test, expect } from '@playwright/test'
import { cleanExtractedText, hasPdfMagicBytes, hasUsableStudyText, isAllowedNoteMimeType, isOwnedNoteStoragePath } from '../../supabase/functions/_shared/document-validation'
import { parseQuestionDraft } from '../../supabase/functions/_shared/ai-validation'
import { isSupportedAiStudyContext } from '../../supabase/functions/_shared/ai-caps-metadata'
import { getPracticeTopics } from '../../src/data/practiceQuestions'

const sourceText = 'Newton’s second law states that the net force acting on an object is equal to its mass multiplied by its acceleration.'

test('AI subject, grade and topic metadata matches only supported starter practice sets', () => {
  const subjects = [
    { id: 'mathematics', names: ['Mathematics'] },
    { id: 'physical-science', names: ['Physical Science', 'Physical Sciences'] },
  ] as const

  for (const subject of subjects) {
    for (const grade of [10, 11, 12]) {
      const topics = getPracticeTopics(subject.id, grade)
      expect(topics.length).toBeGreaterThan(0)
      for (const name of subject.names) {
        for (const topic of topics) {
          expect(isSupportedAiStudyContext(grade, subject.id, name, topic)).toBe(true)
        }
      }
    }
  }

  expect(isSupportedAiStudyContext(12, 'mathematics', 'Physical Sciences', 'Algebra')).toBe(false)
  expect(isSupportedAiStudyContext(10, 'mathematics', 'Mathematics', 'Calculus')).toBe(false)
  expect(isSupportedAiStudyContext(13, 'mathematics', 'Mathematics', 'Algebra')).toBe(false)
  expect(isSupportedAiStudyContext(12, 'unknown-subject', 'Unknown', 'Algebra')).toBe(false)
})

test('private document validation rejects invalid paths, MIME types, and PDF signatures', () => {
  expect(isOwnedNoteStoragePath('user-a', 'user-a/notes-123.pdf')).toBe(true)
  expect(isOwnedNoteStoragePath('user-a', 'user-b/notes-123.pdf')).toBe(false)
  expect(isOwnedNoteStoragePath('user-a', 'user-a/../other.pdf')).toBe(false)
  expect(isOwnedNoteStoragePath('user-a', 'user-a\\..\\other.pdf')).toBe(false)
  expect(isAllowedNoteMimeType('application/pdf')).toBe(true)
  expect(isAllowedNoteMimeType('application/x-msdownload')).toBe(false)
  expect(hasPdfMagicBytes(new TextEncoder().encode('%PDF-1.7 test'))).toBe(true)
  expect(hasPdfMagicBytes(new TextEncoder().encode('not a PDF'))).toBe(false)
})

test('extracted text is normalised, bounded, and checked for useful content', () => {
  const cleaned = cleanExtractedText('Newton\u0000 law\u0001\n\n\nforce and mass')
  expect(cleaned).toBe('Newton law\n\nforce and mass')
  expect(cleanExtractedText('x'.repeat(20), 8)).toBe('x'.repeat(8))
  expect(hasUsableStudyText(sourceText)).toBe(true)
  expect(hasUsableStudyText('short note')).toBe(false)
})

test('AI draft validation requires four distinct choices and evidence found in the source', () => {
  const raw = JSON.stringify({
    prompt: 'Which relationship describes Newton’s second law?',
    options: ['F = ma', 'V = IR', 'p = mv', 'W = mg'],
    answerIndex: 0,
    explanation: 'Newton’s second law says net force equals mass multiplied by acceleration.',
    evidence: 'net force acting on an object is equal to its mass multiplied by its acceleration',
    confidence: 0.82,
  })
  const parsed = parseQuestionDraft(raw, sourceText)
  expect(parsed.answerIndex).toBe(0)
  expect(parsed.evidence).toContain('net force')
})

test('AI draft validation rejects unsupported evidence and duplicate answer options', () => {
  const unsupported = JSON.stringify({
    prompt: 'Which relationship describes Newton’s second law?',
    options: ['F = ma', 'V = IR', 'p = mv', 'W = mg'],
    answerIndex: 0,
    explanation: 'This explanation has enough characters for the minimum validation check.',
    evidence: 'Acceleration is always constant when an object moves at a steady speed.',
    confidence: 0.9,
  })
  expect(() => parseQuestionDraft(unsupported, sourceText)).toThrow(/not present/)

  const duplicate = JSON.stringify({
    prompt: 'Which relationship describes Newton’s second law?',
    options: ['F = ma', 'F = ma', 'p = mv', 'W = mg'],
    answerIndex: 0,
    explanation: 'This explanation has enough characters for the minimum validation check.',
    evidence: 'net force acting on an object',
    confidence: 0.9,
  })
  expect(() => parseQuestionDraft(duplicate, sourceText)).toThrow(/distinct/)
})

test('AI drafting stays disabled in the learner UI until explicit owner approval', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/examforge/')
  const future = new Date()
  future.setDate(future.getDate() + 30)
  const date = [future.getFullYear(), String(future.getMonth() + 1).padStart(2, '0'), String(future.getDate()).padStart(2, '0')].join('-')
  await page.locator('input[type="date"]').fill(date)
  await page.getByRole('button', { name: 'Mechanics', exact: true }).click()
  await page.getByRole('button', { name: 'Electricity', exact: true }).click()
  await page.getByRole('button', { name: /Start Forging/ }).click()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Upload' }).click()

  await expect(page.getByRole('heading', { name: 'Study material' })).toBeVisible()
  await expect(page.getByText(/Text extraction is available for selectable-text PDFs/)).toBeVisible()
  await expect(page.getByText(/Capture handwritten or printed notes instantly/)).toHaveCount(0)
  await expect(page.getByText(/AI drafting is disabled until the project owner/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'AI provider not enabled' })).toBeDisabled()
})
