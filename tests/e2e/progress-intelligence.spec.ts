import { test, expect } from '@playwright/test'
import { analyseProgress } from '../../src/data/progressIntelligence'
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
