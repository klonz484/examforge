import { test, expect } from '@playwright/test'
import { PRACTICE_QUESTIONS, getPracticeTopics, selectPracticeQuestions } from '../../src/data/practiceQuestions'

test('all three FET grades have distinct original Mathematics and Physical Sciences practice sets', () => {
  const identifiers = PRACTICE_QUESTIONS.map(question => question.id)
  expect(new Set(identifiers).size).toBe(identifiers.length)

  for (const grade of [10, 11, 12]) {
    for (const subjectId of ['mathematics', 'physical-science']) {
      const topics = getPracticeTopics(subjectId, grade)
      const questions = selectPracticeQuestions(subjectId, grade, [], 5)
      expect(topics.length).toBeGreaterThanOrEqual(5)
      expect(questions).toHaveLength(5)
      expect(questions.every(question => question.grade === grade && question.subjectId === subjectId)).toBe(true)
      expect(questions.every(question => question.options.length >= 2 && question.answer >= 0 && question.answer < question.options.length)).toBe(true)
      expect(questions.every(question => question.explanation.length >= 20)).toBe(true)
      expect(questions.every(question => question.provenance.includes('not an official DBE question'))).toBe(true)
    }
  }
})

test('weak-topic prioritisation only draws from the selected grade and subject', () => {
  const priority = 'Algebraic expressions'
  const questions = selectPracticeQuestions('mathematics', 10, [priority], 5)
  expect(questions[0].topic).toBe(priority)
  expect(questions.every(question => question.grade === 10 && question.subjectId === 'mathematics')).toBe(true)
})
