import { expect, test } from '@playwright/test'
import { PRACTICE_QUESTIONS, selectPracticeQuestions } from '../../src/data/practiceQuestions'

test('starter questions have stable identifiers, grade, topic and honest provenance', () => {
  const ids = PRACTICE_QUESTIONS.map(question => question.id)
  expect(new Set(ids).size).toBe(ids.length)
  for (const question of PRACTICE_QUESTIONS) {
    expect([10,11,12]).toContain(question.grade)
    expect(['mathematics','physical-science']).toContain(question.subjectId)
    expect(question.topic.length).toBeGreaterThan(0)
    expect(question.options.length).toBeGreaterThanOrEqual(2)
    expect(question.answer).toBeGreaterThanOrEqual(0)
    expect(question.answer).toBeLessThan(question.options.length)
    expect(question.explanation.length).toBeGreaterThan(20)
    expect(question.sourceLabel).toBe('ExamForge original practice')
    expect(question.provenance).toContain('not an official DBE question')
  }
})

test('question selection respects subject, grade and weak-topic priority', () => {
  const selected = selectPracticeQuestions('mathematics', 12, ['Calculus'], 5)
  expect(selected).toHaveLength(5)
  expect(selected.every(question => question.subjectId === 'mathematics' && question.grade === 12)).toBe(true)
  expect(selected[0].topic).toBe('Calculus')
  expect(selectPracticeQuestions('mathematics', 11, [], 5)).toHaveLength(5)
  expect(selectPracticeQuestions('mathematics', 9, [], 5)).toEqual([])
  expect(selectPracticeQuestions('accounting', 12, [], 5)).toEqual([])
})
