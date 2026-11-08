import { test, expect } from '@playwright/test'
import { cleanExtractedText, hasPdfMagicBytes, hasUsableStudyText, isAllowedNoteMimeType, isOwnedNoteStoragePath } from '../../supabase/functions/_shared/document-validation'
import { parseQuestionDraft } from '../../supabase/functions/_shared/ai-validation'

const sourceText = 'Newton’s second law states that the net force acting on an object is equal to its mass multiplied by its acceleration.'

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
