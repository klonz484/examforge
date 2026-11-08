export type RoadmapSubjectId = 'mathematics' | 'physical-science'

export type CapsRoadmap = {
  id: string
  grade: 10 | 11 | 12
  subjectId: RoadmapSubjectId
  subjectName: 'Mathematics' | 'Physical Sciences'
  topics: string[]
  sourceTitle: string
  sourceUrl: string
  sourceProgram: '2023/24 FET Annual Teaching Plan'
  sourceStatus: 'retained-with-circular-s19-2025-exclusions'
  sourceVerifiedAt: '2026-11-08'
  note: string
}

// Summarised topic headings only; the official ATP remains the authoritative
// source for weekly pacing, skills, assessment and any later amendments.
export const CAPS_ROADMAPS: CapsRoadmap[] = [
  {
    id:'math-g10-atp-2023-24', grade:10, subjectId:'mathematics', subjectName:'Mathematics',
    topics:[
      'Algebraic expressions',
      'Exponents, equations and inequalities',
      'Trigonometry',
      'Euclidean Geometry',
      'Analytical Geometry',
      'Functions, including trigonometric functions',
      'Statistics',
      'Probability',
      'Finance and growth',
      'Measurement',
      'Number patterns',
    ],
    sourceTitle:'DBE Mathematics Grade 10 Annual Teaching Plan (2023/24)',
    sourceUrl:'https://www.education.gov.za/Portals/0/Documents/Recovery%20plan%20page/2023%20ATPs/FET%20Content%20Subjects/Grade%2010/1.580%20ATP%202023-24%20Gr%2010%20Maths%20final.pdf?ver=2022-12-22-114024-037',
    sourceProgram:'2023/24 FET Annual Teaching Plan',
    sourceStatus:'retained-with-circular-s19-2025-exclusions', sourceVerifiedAt:'2026-11-08',
    note:'Topic headings are grouped for revision discovery; refer to the DBE ATP for term sequencing, depth and formal assessment requirements.',
  },
  {
    id:'science-g10-atp-2023-24', grade:10, subjectId:'physical-science', subjectName:'Physical Sciences',
    topics:[
      'Waves, sound and light',
      'Electrostatics',
      'Electric circuits',
      'Electromagnetic radiation',
      'Matter and materials: the atom, periodic table and chemical bonding',
      'States of matter and the kinetic molecular theory',
      'Chemical change',
      'Representing chemical change and quantitative aspects',
      'Mechanics and motion foundations',
    ],
    sourceTitle:'DBE Physical Sciences Grade 10 Annual Teaching Plan (2023/24)',
    sourceUrl:'https://www.education.gov.za/Portals/0/Documents/Recovery%20plan%20page/2023%20ATPs/FET%20Content%20Subjects/Grade%2010/1.520%20ATP%202023-24%20Gr%2010%20Phys%20Sci%20final.pdf?ver=2022-12-22-114024-427',
    sourceProgram:'2023/24 FET Annual Teaching Plan',
    sourceStatus:'retained-with-circular-s19-2025-exclusions', sourceVerifiedAt:'2026-11-08',
    note:'Topic headings are grouped for revision discovery; refer to the DBE ATP for term sequencing, required practical work and assessment.',
  },
  {
    id:'math-g11-atp-2023-24', grade:11, subjectId:'mathematics', subjectName:'Mathematics',
    topics:[
      'Exponents and surds',
      'Equations and inequalities',
      'Quadratic equations, inequalities and nature of roots',
      'Trigonometry: reduction formulae and general solutions',
      'Functions and graphs',
      'Number patterns, sequences and series',
      'Euclidean Geometry',
      'Analytical Geometry',
      'Statistics and probability',
      'Finance and growth',
    ],
    sourceTitle:'DBE Mathematics Grade 11 Annual Teaching Plan (2023/24)',
    sourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=d9piy_Yst2E%3D&mid=10752&portalid=0&tabid=3205',
    sourceProgram:'2023/24 FET Annual Teaching Plan',
    sourceStatus:'retained-with-circular-s19-2025-exclusions', sourceVerifiedAt:'2026-11-08',
    note:'Topic headings are grouped for revision discovery; the ATP PDF controls the weekly sequence and skills.',
  },
  {
    id:'science-g11-atp-2023-24', grade:11, subjectId:'physical-science', subjectName:'Physical Sciences',
    topics:[
      'Mechanics: vectors in two dimensions and Newton’s laws',
      'Newton’s universal law of gravitation',
      'Electrostatics',
      'Electric circuits and magnetism',
      'Waves, sound and light',
      'Matter and materials',
      'Chemical change and stoichiometry',
      'Energy and chemical change',
      'Organic chemistry and intermolecular forces',
    ],
    sourceTitle:'DBE Physical Sciences Grade 11 Annual Teaching Plan (2023/24)',
    sourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=HofhdeKXMCM%3D&mid=10752&portalid=0&tabid=3205',
    sourceProgram:'2023/24 FET Annual Teaching Plan',
    sourceStatus:'retained-with-circular-s19-2025-exclusions', sourceVerifiedAt:'2026-11-08',
    note:'Topic headings are grouped for revision discovery; the ATP PDF controls the weekly sequence, practical work and assessment.',
  },
  {
    id:'math-g12-atp-2023-24', grade:12, subjectId:'mathematics', subjectName:'Mathematics',
    topics:[
      'Patterns, sequences and series',
      'Functions, graphs and inverse functions',
      'Exponential and logarithmic functions',
      'Trigonometry: compound angles, identities and equations',
      'Analytical Geometry',
      'Euclidean Geometry',
      'Differential Calculus',
      'Probability',
      'Finance and growth',
      'Statistics',
    ],
    sourceTitle:'DBE Mathematics Grade 12 Annual Teaching Plan (2023/24)',
    sourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=_kS5tgxXQ0I%3D&mid=10755&portalid=0&tabid=3205',
    sourceProgram:'2023/24 FET Annual Teaching Plan',
    sourceStatus:'retained-with-circular-s19-2025-exclusions', sourceVerifiedAt:'2026-11-08',
    note:'Topic headings are grouped for revision discovery; use the ATP and current examination guideline for the official scope and weighting.',
  },
  {
    id:'science-g12-atp-2023-24', grade:12, subjectId:'physical-science', subjectName:'Physical Sciences',
    topics:[
      'Mechanics: momentum and impulse, vertical projectile motion, work, energy and power',
      'Waves, sound and light: Doppler Effect',
      'Electricity and magnetism: electric circuits and electrodynamics',
      'Matter and materials: optical phenomena and properties of materials',
      'Chemical change: rates of reaction and chemical equilibrium',
      'Acids and bases',
      'Representing chemical change and stoichiometry',
      'Organic molecules and intermolecular forces',
    ],
    sourceTitle:'DBE Physical Sciences Grade 12 Annual Teaching Plan (2023/24)',
    sourceUrl:'https://www.education.gov.za/LinkClick.aspx?fileticket=6y_u-yjj97c%3D&mid=10755&portalid=0&tabid=3205',
    sourceProgram:'2023/24 FET Annual Teaching Plan',
    sourceStatus:'retained-with-circular-s19-2025-exclusions', sourceVerifiedAt:'2026-11-08',
    note:'Term 4 topic/mark groupings are summarised from the ATP; Grade 11 prerequisite content is explicitly identified in the source.',
  },
]

export function findCapsRoadmap(grade: number, subjectId: string) {
  return CAPS_ROADMAPS.find(item => item.grade === grade && item.subjectId === subjectId) ?? null
}
