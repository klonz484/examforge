import { test, expect } from '@playwright/test'
import { analyseProgress, scopeProgressAttempts } from '../../src/data/progressIntelligence'
import { scheduleFlashcardReview } from '../../src/data/spacedRepetition'

test('progress suggestions require a meaningful topic sample and explain the recommendation', () => {
  const now = Date.parse('2026-11-08T12:00:00.000Z')
  const attempts = [
    { topic:'Algebra', correct:true, t:now - 2_000 },
    { topic:'Algebra', correct:false, t:now - 1_000 },
    { topic:'Algebra', correct:false, t:now },
    { topic:'Functions', correct:true, t:now - 500 },
  ]
  const result = analyseProgress(attempts, ['Algebra','Functions','Trigonometry'], now)
  expect(result.recommendedTopic?.topic).toBe('Algebra')
  expect(result.recommendedTopic?.attempts).toBe(3)
  expect(result.recommendedTopic?.accuracy).toBe(33)
  expect(result.explanation).toContain('at least three recorded attempts')
  expect(result.topics.find(topic => topic.topic === 'Functions')?.evidenceStatus).toBe('insufficient-sample')
})

test('spaced review uses the same interval schedule as the secure database function', () => {
  const now = new Date('2026-11-08T12:00:00.000Z')
  const again = scheduleFlashcardReview('math-g12-algebra-001', undefined, 0, now)
  expect(again.interval_days).toBe(0)
  expect(again.repetitions).toBe(0)

  const firstGood = scheduleFlashcardReview('math-g12-algebra-001', again, 2, now)
  expect(firstGood.interval_days).toBe(1)
  expect(firstGood.repetitions).toBe(1)

  const secondGood = scheduleFlashcardReview('math-g12-algebra-001', firstGood, 2, now)
  expect(secondGood.interval_days).toBe(3)
  expect(secondGood.repetitions).toBe(2)
})


test('empty saved history produces no score, trend or recommendation', () => {
  const now = Date.parse('2026-11-08T12:00:00.000Z')
  const result = analyseProgress([], ['Algebra', 'Functions'], now)

  expect(result.topics).toHaveLength(2)
  expect(result.topics.every(topic => topic.attempts === 0 && topic.correct === 0)).toBe(true)
  expect(result.recommendedTopic).toBeNull()
  expect(result.recentAccuracy).toBeNull()
  expect(result.previousAccuracy).toBeNull()
  expect(result.trend).toBe('insufficient-data')
})

test('one or two saved attempts show accuracy but never produce a topic recommendation', () => {
  const now = Date.parse('2026-11-08T12:00:00.000Z')
  const result = analyseProgress([
    { topic: 'Algebra', correct: true, t: now - 1_000 },
    { topic: 'Algebra', correct: false, t: now },
  ], ['Algebra', 'Functions'], now)

  expect(result.topics[0]).toMatchObject({
    topic: 'Algebra', attempts: 2, correct: 1, accuracy: 50,
    evidenceStatus: 'insufficient-sample',
  })
  expect(result.topics[1].attempts).toBe(0)
  expect(result.recommendedTopic).toBeNull()
  expect(result.trend).toBe('insufficient-data')
})

test('saved progress is scoped by stable subject and grade, not topic text alone', () => {
  const knownQuestions = [
    { id: 'math-g12-functions-001', subjectId: 'mathematics', grade: 12 },
    { id: 'math-g10-functions-001', subjectId: 'mathematics', grade: 10 },
    { id: 'science-g12-mechanics-001', subjectId: 'physical-science', grade: 12 },
  ]
  const attempts = [
    { topic: 'Functions', correct: true, t: 1, questionId: 'math-g12-functions-001' },
    { topic: 'Functions', correct: false, t: 2, questionId: 'math-g10-functions-001' },
    { topic: 'Functions', correct: false, t: 3, subjectId: 'mathematics', grade: 11 },
    { topic: 'Mechanics', correct: false, t: 4, questionId: 'science-g12-mechanics-001' },
    { topic: 'Functions', correct: false, t: 5 },
  ]
  const scoped = scopeProgressAttempts(attempts, 'mathematics', 12, knownQuestions)

  expect(scoped).toHaveLength(1)
  expect(scoped[0]).toMatchObject({
    topic: 'Functions', correct: true, subjectId: 'mathematics', grade: 12,
  })
})
