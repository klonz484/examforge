import { expect, test } from '@playwright/test'
import {
  CAPS_SUBJECTS,
  getCapsSubjectsByCategory,
  getCapsSubjectsForGrade,
  searchCapsSubjects,
} from '../../src/data/capsSubjects'

test('catalogue identifiers are unique and preserve legacy subject IDs', () => {
  const ids = CAPS_SUBJECTS.map((item) => item.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(ids).toContain('mathematics')
  expect(ids).toContain('physical-science')
})

test('grade-specific results contain only ATP-listed or specialist ATP offerings', () => {
  for (const grade of [10, 11, 12] as const) {
    const subjects = getCapsSubjectsForGrade(grade)
    expect(subjects.length).toBeGreaterThan(30)
    expect(subjects.every((item) => item.grades.includes(grade))).toBe(true)
    expect(subjects.every((item) => item.status === 'atp-listed' || item.status === 'specialist-atp')).toBe(true)
  }
})

test('CAPS-index-only entries remain discoverable without a grade availability claim', () => {
  for (const id of [
    'equine-studies',
    'marine-sciences',
    'maritime-economics',
    'nautical-science',
    'sport-and-exercise-science',
    'language-french-sal',
    'language-mandarin-sal',
    'computer-applications-technology',
    'information-technology',
  ]) {
    const item = CAPS_SUBJECTS.find((subject) => subject.id === id)
    expect(item).toBeTruthy()
    expect(item?.status).toBe('caps-index-only')
    expect(item?.grades).toHaveLength(0)
  }
})

test('South African Sign Language is explicitly marked as a specialist offering', () => {
  const saslHome = CAPS_SUBJECTS.find((item) => item.id === 'language-south-african-sign-language-hl')
  const saslSal = CAPS_SUBJECTS.find((item) => item.id === 'language-south-african-sign-language-sal')
  expect(saslHome?.languageLevel).toBe('Home Language')
  expect(saslHome?.grades).toEqual([10, 11, 12])
  expect(saslHome?.status).toBe('specialist-atp')
  expect(saslSal?.grades).toEqual([11])
  expect(saslSal?.status).toBe('specialist-atp')
})

test('technical and music umbrella entries are separated from selectable pathways', () => {
  expect(CAPS_SUBJECTS.find((item) => item.id === 'mechanical-technology')?.status).toBe('pathway-parent')
  expect(CAPS_SUBJECTS.find((item) => item.id === 'mechanical-technology-automotive')?.pathwayGroup).toBe('mechanical-technology')
  expect(CAPS_SUBJECTS.find((item) => item.id === 'electrical-technology-power-systems')?.pathwayGroup).toBe('electrical-technology')
  expect(CAPS_SUBJECTS.find((item) => item.id === 'music-jazz')?.pathwayGroup).toBe('music')
})

test('category grouping retains every ATP grade offering exactly once', () => {
  for (const grade of [10, 11, 12] as const) {
    const all = getCapsSubjectsForGrade(grade)
    const grouped = Object.values(getCapsSubjectsByCategory(grade)).flat()
    expect(grouped).toHaveLength(all.length)
    expect(new Set(grouped.map((item) => item.id)).size).toBe(all.length)
  }
})

test('search recognises aliases, legacy names, and language names', () => {
  expect(searchCapsSubjects('CAT').some((item) => item.id === 'computer-applications-technology')).toBe(true)
  expect(searchCapsSubjects('Maths').some((item) => item.id === 'mathematics')).toBe(true)
  expect(searchCapsSubjects('Physical Science').some((item) => item.id === 'physical-science')).toBe(true)
  expect(searchCapsSubjects('itsonga').some((item) => item.name.startsWith('siSwati '))).toBe(false)
  expect(searchCapsSubjects('itsonga').some((item) => item.name.startsWith('itsonga '))).toBe(false)
  expect(searchCapsSubjects('itsonga').some((item) => item.name.startsWith('isi') || item.name.startsWith('Xitsonga '))).toBe(true)
})

test('grade-scoped search keeps unverified CAPS index entries visible and labelled', () => {
  const result = searchCapsSubjects('Equine', 12)
  expect(result).toHaveLength(1)
  expect(result[0].status).toBe('caps-index-only')
  expect(result[0].grades).toHaveLength(0)
})
