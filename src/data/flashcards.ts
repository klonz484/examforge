export type RevisionFlashcard = {
  id: string
  grade: 12
  subjectId: 'mathematics' | 'physical-science'
  subject: 'Mathematics' | 'Physical Sciences'
  topic: string
  front: string
  back: string
  sourceLabel: 'ExamForge original revision card'
  provenance: string
  curriculumSourceUrl: string
}

const provenance = 'Author-created revision card aligned to a topic heading in the linked DBE Annual Teaching Plan. The wording and explanation are ExamForge-created, not an official DBE question or answer key.'

export const REVISION_FLASHCARDS: RevisionFlashcard[] = [
  {
    id:'math-g12-algebra-factorise-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Algebra',
    front:'Factorise: x² − 5x + 6',
    back:'(x − 2)(x − 3). Find two numbers whose product is +6 and sum is −5: −2 and −3.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=_kS5tgxXQ0I%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'math-g12-functions-turning-point-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Functions',
    front:'For y = a(x − p)² + q, what are the coordinates of the turning point?',
    back:'(p ; q). The sign inside the bracket is opposite the x-coordinate; q is the y-coordinate.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=_kS5tgxXQ0I%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'math-g12-trig-identity-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Trigonometry',
    front:'State the fundamental Pythagorean trigonometric identity.',
    back:'sin²θ + cos²θ = 1. It is valid for every real angle θ.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=_kS5tgxXQ0I%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'math-g12-calculus-power-rule-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Differential Calculus',
    front:'Differentiate f(x) = xⁿ using the power rule.',
    back:'f′(x) = nxⁿ⁻¹. Multiply by the original exponent, then reduce the exponent by one.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=_kS5tgxXQ0I%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'math-g12-analytical-gradient-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Analytical Geometry',
    front:'What is the gradient of the line through (x₁ ; y₁) and (x₂ ; y₂)?',
    back:'m = (y₂ − y₁) ÷ (x₂ − x₁), provided x₂ ≠ x₁. Subtract y-values over the matching difference in x-values.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=_kS5tgxXQ0I%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'math-g12-sequences-arithmetic-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Patterns, Sequences and Series',
    front:'Write the general term of an arithmetic sequence.',
    back:'Tₙ = a + (n − 1)d, where a is the first term and d is the constant difference.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=_kS5tgxXQ0I%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'science-g12-mechanics-incline-001', grade:12, subjectId:'physical-science', subject:'Physical Sciences', topic:'Mechanics',
    front:'For a block on a frictionless incline at angle θ, what is the component of weight perpendicular to the plane?',
    back:'mg cos θ. The parallel component is mg sin θ. Choose axes perpendicular and parallel to the surface.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=6y_u-yjj97c%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'science-g12-mechanics-momentum-001', grade:12, subjectId:'physical-science', subject:'Physical Sciences', topic:'Mechanics',
    front:'Define linear momentum and state its SI unit.',
    back:'p = mv: mass multiplied by velocity. SI unit: kg·m·s⁻¹.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=6y_u-yjj97c%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'science-g12-electricity-ohm-001', grade:12, subjectId:'physical-science', subject:'Physical Sciences', topic:'Electricity and Magnetism',
    front:'State Ohm’s law for an ohmic conductor.',
    back:'V = IR, provided the physical conditions (especially temperature) remain constant.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=6y_u-yjj97c%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'science-g12-waves-speed-001', grade:12, subjectId:'physical-science', subject:'Physical Sciences', topic:'Waves, Sound and Light',
    front:'Write the wave-speed relationship using frequency and wavelength.',
    back:'v = fλ. Speed is frequency multiplied by wavelength; use m·s⁻¹ when f is in hertz and λ in metres.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=6y_u-yjj97c%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'science-g12-chemical-change-exothermic-001', grade:12, subjectId:'physical-science', subject:'Physical Sciences', topic:'Chemical Change',
    front:'What happens to energy in an exothermic reaction?',
    back:'Energy is released to the surroundings. For the system, ΔH is negative.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=6y_u-yjj97c%3D&mid=10755&portalid=0&tabid=3205',
  },
  {
    id:'science-g12-chemical-change-stoichiometry-001', grade:12, subjectId:'physical-science', subject:'Physical Sciences', topic:'Stoichiometry',
    front:'How do you calculate the amount of substance n from mass m and molar mass M?',
    back:'n = m ÷ M. Ensure mass is in grams and molar mass in g·mol⁻¹ to obtain moles.',
    sourceLabel:'ExamForge original revision card', provenance,
    curriculumSourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=6y_u-yjj97c%3D&mid=10755&portalid=0&tabid=3205',
  },
]

export function dueRevisionCards(
  reviews: Record<string, FlashcardReview>,
  subjectId: string,
  today = new Date().toLocaleDateString('en-CA'),
) {
  return REVISION_FLASHCARDS.filter(card =>
    card.subjectId === subjectId && (!reviews[card.id] || reviews[card.id].dueAt <= today),
  )
}

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy'
export type FlashcardReview = {
  flashcardId: string
  repetitions: number
  intervalDays: number
  easeFactor: number
  dueAt: string
  lastReviewedAt: string
  rating: FlashcardRating
}

export function scheduleFlashcardReview(
  flashcardId: string,
  previous: FlashcardReview | undefined,
  rating: FlashcardRating,
  now = new Date(),
): FlashcardReview {
  const oldEase = previous?.easeFactor ?? 2.5
  const oldInterval = previous?.intervalDays ?? 0
  const oldRepetitions = previous?.repetitions ?? 0
  let easeFactor = oldEase
  let repetitions = oldRepetitions
  let intervalDays = oldInterval

  if (rating === 'again') {
    repetitions = 0
    intervalDays = 0
    easeFactor = Math.max(1.3, oldEase - 0.2)
  } else if (rating === 'hard') {
    repetitions = oldRepetitions + 1
    intervalDays = Math.max(1, Math.ceil(Math.max(1, oldInterval) * 1.2))
    easeFactor = Math.max(1.3, oldEase - 0.15)
  } else if (rating === 'good') {
    repetitions = oldRepetitions + 1
    intervalDays = oldRepetitions === 0 ? 1 : oldRepetitions === 1 ? 3 : Math.max(1, Math.ceil(oldInterval * oldEase))
  } else {
    repetitions = oldRepetitions + 1
    intervalDays = oldRepetitions === 0 ? 3 : oldRepetitions === 1 ? 5 : Math.max(1, Math.ceil(oldInterval * oldEase * 1.3))
    easeFactor = oldEase + 0.15
  }
  const nextDue = new Date(now)
  nextDue.setDate(nextDue.getDate() + intervalDays)
  return {
    flashcardId, repetitions, intervalDays, easeFactor: Math.round(easeFactor * 100) / 100,
    dueAt: nextDue.toLocaleDateString('en-CA'), lastReviewedAt: now.toISOString(), rating,
  }
}
