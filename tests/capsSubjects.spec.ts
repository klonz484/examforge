import { test, expect } from '@playwright/test'
import { CAPS_SUBJECTS, getCapsSubjectsForGrade, getCapsSubjectsByCategory, searchCapsSubjects } from '../src/data/capsSubjects'

test('CAPS catalogue has unique stable identifiers', () => {
  const ids = CAPS_SUBJECTS.map((subject) => subject.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test('legacy Mathematics and Physical Science identifiers remain', () => {
  expect(CAPS_SUBJECTS.some((subject) => subject.id === 'mathematics')).toBe(true)
  expect(CAPS_SUBJECTS.some((subject) => subject.id === 'physical-science')).toBe(true)
})

test('all FET grade filters return catalogue entries', () => {
  for (const grade of [10, 11, 12] as const) {
    expect(getCapsSubjectsForGrade(grade).length).toBeGreaterThan(30)
  }
})

test('category grouping retains every catalogue entry', () => {
  const groups = getCapsSubjectsByCategory(12)
  expect(Object.values(groups).flat().length).toBe(getCapsSubjectsForGrade(12).length)
})

test('search supports common subject aliases', () => {
  expect(searchCapsSubjects('CAT').some((subject) => subject.id === 'computer-applications-technology')).toBe(true)
  expect(searchCapsSubjects('Maths').some((subject) => subject.id === 'mathematics')).toBe(true)
})
