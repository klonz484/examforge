import { test, expect } from '@playwright/test'
import {
  CAPS_SUBJECTS,
  getCapsSubjectsForGrade,
  getCapsSubjectsByCategory,
  searchCapsSubjects,
} from '../../src/data/capsSubjects'

test('catalogue identifiers are unique and stable legacy IDs remain', () => {
  const ids = CAPS_SUBJECTS.map((item) => item.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(ids).toContain('mathematics')
  expect(ids).toContain('physical-science')
})

test('grade filters expose only ATP-listed grade offerings', () => {
  for (const grade of [10, 11, 12] as const) {
    const subjects = getCapsSubjectsForGrade(grade)
    expect(subjects.length).toBeGreaterThan(30)
    expect(subjects.every((item) => item.grades.includes(grade))).toBe(true)
    expect(subjects.every((item) => item.status === 'atp-listed' || item.status === 'specialist-atp')).toBe(true)
  }
})

test('CAPS-index-only offerings are discoverable but do not claim grade availability', () => {
  for (const id of ['equine-studies', 'marine-sciences', 'maritime-economics', 'nautical-science', 'sport-and-exercise-science', 'language-french-sal', 'language-mandarin-sal', 'computer-applications-technology', 'information-technology']) {
    const item = CAPS_SUBJECTS.find((subject) => subject.id === id)
    expect(item).toBeTruthy()
    expect(item?.status).toBe('caps-index-only')
    expect(item?.grades).toHaveLength(0)
  }
})

test('South African Sign Language is represented as a specialist Home Language', () => {
  const sasl = CAPS_SUBJECTS.find((item) => item.id === 'language-south-african-sign-language-hl')
  expect(sasl?.languageLevel).toBe('Home Language')
  expect(sasl?.grades).toEqual([10, 11, 12])
  expect(sasl?.status).toBe('specialist-atp')
})

test('technical and music pathways are distinct from their umbrella entries', () => {
  expect(CAPS_SUBJECTS.find((item) => item.id === 'mechanical-technology')?.status).toBe('pathway-parent')
  expect(CAPS_SUBJECTS.find((item) => item.id === 'mechanical-technology-automotive')?.pathwayGroup).toBe('mechanical-technology')
  expect(CAPS_SUBJECTS.find((item) => item.id === 'electrical-technology-power-systems')?.pathwayGroup).toBe('electrical-technology')
  expect(CAPS_SUBJECTS.find((item) => item.id === 'music-jazz')?.pathwayGroup).toBe('music')
})

test('category grouping retains every grade-specific subject exactly once', () => {
  for (const grade of [10, 11, 12] as const) {
    const all = getCapsSubjectsForGrade(grade)
    const grouped = Object.values(getCapsSubjectsByCategory(grade)).flat()
    expect(grouped.length).toBe(all.length)
    expect(new Set(grouped.map((item) => item.id)).size).toBe(all.length)
  }
})

test('search supports common aliases and legacy display names', () => {
  expect(searchCapsSubjects('CAT').some((item) => item.id === 'computer-applications-technology')).toBe(true)
  expect(searchCapsSubjects('Maths').some((item) => item.id === 'mathematics')).toBe(true)
  expect(searchCapsSubjects('Physical Science').some((item) => item.id === 'physical-science')).toBe(true)
  expect(searchCapsSubjects('itsonga').some((item) => item.name.startsWith('Xitsonga '))).toBe(true)
})
