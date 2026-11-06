/**
 * ExamForge South African CAPS FET discovery catalogue.
 *
 * Primary references:
 * - DBE 2023/24 FET ATP index (retained for 2026 with exclusions):
 *   https://www.education.gov.za/Curriculum/NationalCurriculumStatementsGradesR-12/2023ATPsFET.aspx
 * - DBE CAPS FET index:
 *   https://www.education.gov.za/Curriculum/NCSGradesR12/CAPSFET/tabid/570/Default.aspx
 * - DBE National Circulars (including S19 of 2025 and S9 of 2025):
 *   https://www.education.gov.za/Curriculum/NationalCirculars.aspx
 *
 * ATP-listed means the subject/level appears in the DBE's published grade ATP
 * index. It does not guarantee that an individual school offers it.
 * CAPS-index-only entries are discoverable but are not represented as
 * confirmed current ATP offerings. No topic roadmap should be enabled until
 * the applicable current CAPS/ATP/exam guidance is separately checked.
 */

export type CapsGrade = 10 | 11 | 12
export type CapsSubjectCategory =
  | 'languages' | 'mathematics' | 'sciences' | 'commerce' | 'technology'
  | 'engineering' | 'humanities' | 'arts' | 'services' | 'compulsory'

export type CapsLanguageLevel =
  | 'Home Language'
  | 'First Additional Language'
  | 'Second Additional Language'

export type CatalogueStatus =
  | 'atp-listed'
  | 'specialist-atp'
  | 'caps-index-only'
  | 'pathway-parent'

export interface CapsSubject {
  /** Stable identifier for application/database relationships. */
  id: string
  name: string
  category: CapsSubjectCategory
  /** Grades in which the DBE ATP index lists this offering. */
  grades: readonly CapsGrade[]
  languageLevel?: CapsLanguageLevel
  status: CatalogueStatus
  /** Used to group technical/music pathway offerings under a parent. */
  pathwayGroup?: string
  aliases?: readonly string[]
  /** Existing MVP identifiers/labels retained for backward compatibility. */
  legacyNames?: readonly string[]
}

const FET_GRADES = [10, 11, 12] as const satisfies readonly CapsGrade[]
const NO_GRADE_CLAIM: readonly CapsGrade[] = []

function subject(
  id: string,
  name: string,
  category: CapsSubjectCategory,
  extra: Partial<Pick<CapsSubject, 'aliases' | 'legacyNames' | 'pathwayGroup' | 'status' | 'grades'>> = {},
): CapsSubject {
  return {
    id, name, category, grades: FET_GRADES, status: 'atp-listed', ...extra,
  }
}

const LANGUAGES = [
  ['afrikaans', 'Afrikaans'],
  ['english', 'English'],
  ['isindebele', 'isiNdebele'],
  ['isixhosa', 'isiXhosa'],
  ['isizulu', 'isiZulu'],
  ['sepedi', 'Sepedi'],
  ['sesotho', 'Sesotho'],
  ['setswana', 'Setswana'],
  ['siswati', 'siSwati'],
  ['tshivenda', 'Tshivenda'],
  ['itsonga', 'Xitsonga'],
] as const

const languageOffering = (
  id: string,
  language: string,
  level: CapsLanguageLevel,
  grades: readonly CapsGrade[],
  status: CatalogueStatus = 'atp-listed',
): CapsSubject => ({
  id, name: `${language} ${level}`, category: 'languages',
  languageLevel: level, grades, status,
})

const LANGUAGE_OFFERINGS: CapsSubject[] = LANGUAGES.flatMap(([id, label]) => [
  languageOffering(`language-${id}-hl`, label, 'Home Language', FET_GRADES),
  languageOffering(`language-${id}-fal`, label, 'First Additional Language', FET_GRADES),
  languageOffering(`language-${id}-sal`, label, 'Second Additional Language', FET_GRADES),
])

// The DBE ATP index lists South African Sign Language at Home Language level
// for all three FET grades. Grade 11 ATP index also lists it under SAL.
LANGUAGE_OFFERINGS.push(
  languageOffering('language-south-african-sign-language-hl', 'South African Sign Language', 'Home Language', FET_GRADES, 'specialist-atp'),
  languageOffering('language-south-african-sign-language-sal', 'South African Sign Language', 'Second Additional Language', [11], 'specialist-atp'),
)

// French and Mandarin appear in the CAPS FET language index as SAL, but are
// not listed in the current ATP index tables reviewed here. Keep discoverable
// without implying grade-specific ATP delivery.
LANGUAGE_OFFERINGS.push(
  languageOffering('language-french-sal', 'French', 'Second Additional Language', NO_GRADE_CLAIM, 'caps-index-only'),
  languageOffering('language-mandarin-sal', 'Mandarin', 'Second Additional Language', NO_GRADE_CLAIM, 'caps-index-only'),
)

const CONTENT_SUBJECTS: CapsSubject[] = [
  subject('accounting', 'Accounting', 'commerce'),
  subject('agricultural-management-practices', 'Agricultural Management Practices', 'sciences'),
  subject('agricultural-sciences', 'Agricultural Sciences', 'sciences', { aliases: ['Agricultural Science'] }),
  subject('agricultural-technology', 'Agricultural Technology', 'technology'),
  subject('business-studies', 'Business Studies', 'commerce'),
  subject('computer-applications-technology', 'Computer Applications Technology', 'technology', { status: 'caps-index-only', grades: NO_GRADE_CLAIM, aliases: ['CAT'] }),
  subject('consumer-studies', 'Consumer Studies', 'services'),
  subject('dance-studies', 'Dance Studies', 'arts'),
  subject('design-studies', 'Design', 'arts', { aliases: ['Design Studies'] }),
  subject('dramatic-arts', 'Dramatic Arts', 'arts'),
  subject('economics', 'Economics', 'commerce'),
  subject('engineering-graphics-and-design', 'Engineering Graphics and Design', 'engineering', { aliases: ['EGD', 'EGS'] }),
  subject('geography', 'Geography', 'humanities'),
  subject('history', 'History', 'humanities'),
  subject('hospitality-studies', 'Hospitality Studies', 'services'),
  subject('information-technology', 'Information Technology', 'technology', { status: 'caps-index-only', grades: NO_GRADE_CLAIM, aliases: ['IT'] }),
  subject('life-orientation', 'Life Orientation', 'compulsory'),
  subject('life-sciences', 'Life Sciences', 'sciences'),
  subject('mathematical-literacy', 'Mathematical Literacy', 'mathematics', { aliases: ['Maths Literacy', 'Math Lit'] }),
  subject('mathematics', 'Mathematics', 'mathematics', { aliases: ['Maths'] }),
  subject('physical-science', 'Physical Sciences', 'sciences', {
    aliases: ['Physical Science', 'Physics and Chemistry'],
    legacyNames: ['Physical Science'],
  }),
  subject('religion-studies', 'Religion Studies', 'humanities'),
  subject('technical-mathematics', 'Technical Mathematics', 'mathematics'),
  subject('technical-sciences', 'Technical Sciences', 'sciences', { aliases: ['Technical Science'] }),
  subject('tourism', 'Tourism', 'services'),
  subject('visual-arts', 'Visual Arts', 'arts'),

  // ATP-listed technical and creative pathways; retain umbrella IDs as
  // non-selectable discovery parents to avoid falsely implying one course.
  subject('mechanical-technology', 'Mechanical Technology', 'engineering', {
    status: 'pathway-parent', grades: NO_GRADE_CLAIM,
  }),
  subject('mechanical-technology-automotive', 'Mechanical Technology: Automotive', 'engineering', { pathwayGroup: 'mechanical-technology' }),
  subject('mechanical-technology-fitting-machining', 'Mechanical Technology: Fitting and Machining', 'engineering', { pathwayGroup: 'mechanical-technology' }),
  subject('mechanical-technology-welding-metalworks', 'Mechanical Technology: Welding and Metalworks', 'engineering', { pathwayGroup: 'mechanical-technology' }),
  subject('electrical-technology', 'Electrical Technology', 'engineering', {
    status: 'pathway-parent', grades: NO_GRADE_CLAIM,
  }),
  subject('electrical-technology-digital-electronics', 'Electrical Technology: Digital Electronics', 'engineering', { pathwayGroup: 'electrical-technology' }),
  subject('electrical-technology-electronics', 'Electrical Technology: Electronics', 'engineering', { pathwayGroup: 'electrical-technology' }),
  subject('electrical-technology-power-systems', 'Electrical Technology: Power Systems', 'engineering', { pathwayGroup: 'electrical-technology' }),
  subject('civil-technology', 'Civil Technology', 'engineering', {
    status: 'pathway-parent', grades: NO_GRADE_CLAIM,
  }),
  subject('civil-technology-civil-services', 'Civil Technology: Civil Services', 'engineering', { pathwayGroup: 'civil-technology' }),
  subject('civil-technology-construction', 'Construction', 'engineering', { pathwayGroup: 'civil-technology' }),
  subject('woodworking', 'Woodworking', 'engineering'),

  subject('music', 'Music', 'arts', { status: 'pathway-parent', grades: NO_GRADE_CLAIM }),
  subject('music-jazz', 'Music: Jazz', 'arts', { pathwayGroup: 'music' }),
  subject('music-wam', 'Music: Western Art Music (WAM)', 'arts', { pathwayGroup: 'music' }),
  subject('music-iam', 'Music: Indigenous African Music (IAM)', 'arts', { pathwayGroup: 'music' }),

  // CAPS FET index listings retained for discovery. Their grade-specific ATP
  // delivery was not established by the ATP tables reviewed.
  subject('equine-studies', 'Equine Studies', 'services', { status: 'caps-index-only', grades: NO_GRADE_CLAIM }),
  subject('marine-sciences', 'Marine Sciences', 'sciences', { status: 'caps-index-only', grades: NO_GRADE_CLAIM, aliases: ['Marine Science'] }),
  subject('maritime-economics', 'Maritime Economics', 'commerce', { status: 'caps-index-only', grades: NO_GRADE_CLAIM }),
  subject('nautical-science', 'Nautical Science', 'technology', { status: 'caps-index-only', grades: NO_GRADE_CLAIM }),
  subject('sport-and-exercise-science', 'Sport and Exercise Science', 'services', { status: 'caps-index-only', grades: NO_GRADE_CLAIM }),
]

export const CAPS_SUBJECTS: readonly CapsSubject[] = [
  ...LANGUAGE_OFFERINGS,
  ...CONTENT_SUBJECTS,
] as const

export const CAPS_SUBJECT_CATEGORIES: readonly {
  id: CapsSubjectCategory
  label: string
}[] = [
  { id: 'languages', label: 'Languages' },
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'sciences', label: 'Natural and applied sciences' },
  { id: 'commerce', label: 'Commerce and economics' },
  { id: 'technology', label: 'Technology and computing' },
  { id: 'engineering', label: 'Engineering and technical subjects' },
  { id: 'humanities', label: 'Humanities and social sciences' },
  { id: 'arts', label: 'Creative and performing arts' },
  { id: 'services', label: 'Services and applied subjects' },
  { id: 'compulsory', label: 'Compulsory development' },
]

export function getCapsSubjectsForGrade(grade: CapsGrade): CapsSubject[] {
  return CAPS_SUBJECTS.filter((item) => item.grades.includes(grade))
}

export function searchCapsSubjects(query: string, grade?: CapsGrade): CapsSubject[] {
  const normalized = query.trim().toLocaleLowerCase()
  const source = grade
    ? CAPS_SUBJECTS.filter((item) => item.grades.includes(grade) || item.status === 'caps-index-only')
    : [...CAPS_SUBJECTS]
  if (!normalized) return source
  return source.filter((item) =>
    [item.name, ...(item.aliases ?? []), ...(item.legacyNames ?? [])].some((value) =>
      value.toLocaleLowerCase().includes(normalized),
    ),
  )
}

export function getCapsSubjectsByCategory(
  grade: CapsGrade,
): Record<CapsSubjectCategory, CapsSubject[]> {
  return CAPS_SUBJECT_CATEGORIES.reduce(
    (groups, category) => {
      groups[category.id] = getCapsSubjectsForGrade(grade).filter(
        (item) => item.category === category.id,
      )
      return groups
    },
    {} as Record<CapsSubjectCategory, CapsSubject[]>,
  )
}
