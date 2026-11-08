type SupportedGrade = 10 | 11 | 12

const SUBJECTS = {
  mathematics: {
    names: ['Mathematics'],
    topics: {
      10: ['Algebraic expressions', 'Exponents and surds', 'Equations and inequalities', 'Functions and graphs', 'Trigonometry'],
      11: ['Quadratic equations', 'Number patterns, sequences and series', 'Functions and graphs', 'Trigonometry', 'Analytical Geometry'],
      12: ['Algebra', 'Functions', 'Trigonometry', 'Calculus', 'Euclidean Geometry', 'Analytical Geometry', 'Sequences & Series', 'Finance & Growth'],
    },
  },
  'physical-science': {
    names: ['Physical Science', 'Physical Sciences'],
    topics: {
      10: ['Waves, sound and light', 'Electric circuits', 'Electrostatics', 'Matter and materials: atomic structure', 'Chemical change'],
      11: ['Mechanics: Newton’s laws', 'Newton’s law of universal gravitation', 'Momentum and impulse', 'Chemical change and stoichiometry', 'Electric circuits and magnetism'],
      12: ['Mechanics', 'Electricity', 'Waves', 'Chemical Change', 'Momentum & Impulse', 'Energy & Work', 'Stoichiometry', 'Organic Chemistry'],
    },
  },
} as const

function normalise(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

/**
 * Restrict AI drafts to the exact subject/grade/topic combinations for which
 * ExamForge currently has a reviewed starter practice map. Catalogue presence
 * alone does not establish learning-content coverage.
 */
export function isSupportedAiStudyContext(
  grade: number,
  subjectId: string,
  subjectName: string,
  topic: string,
): boolean {
  if (!Number.isInteger(grade) || ![10, 11, 12].includes(grade)) return false
  const subject = SUBJECTS[subjectId as keyof typeof SUBJECTS]
  if (!subject) return false
  const topics = subject.topics[grade as SupportedGrade]
  if (!topics) return false

  return subject.names.some(name => normalise(name) === normalise(subjectName)) &&
    topics.some(candidate => normalise(candidate) === normalise(topic))
}
