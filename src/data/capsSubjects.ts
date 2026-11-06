/**
 * ExamForge South African CAPS FET subject catalogue.
 *
 * Source: Department of Basic Education, CAPS for the Further Education
 * and Training Phase (Grades 10–12).
 * https://www.education.gov.za/Curriculum/NCSGradesR12/CAPSFET/tabid/570/Default.aspx
 *
 * This is catalogue metadata only. It does not claim that a learner is
 * registered for a subject at school, nor does it publish curriculum content.
 */

export type CapsGrade = 10 | 11 | 12
export type CapsSubjectCategory =
  | 'languages'
  | 'mathematics'
  | 'sciences'
  | 'commerce'
  | 'technology'
  | 'engineering'
  | 'humanities'
  | 'arts'
  | 'services'
  | 'compulsory'

export type CapsLanguageLevel =
  | 'Home Language'
  | 'First Additional Language'
  | 'Second Additional Language'

export interface CapsSubject {
  /** Stable identifier for application/database relationships. */
  id: string
  /** Learner-facing display name. */
  name: string
  category: CapsSubjectCategory
  grades: readonly CapsGrade[]
  /** Present for language offerings. */
  languageLevel?: CapsLanguageLevel
  /** Official or commonly used aliases; never use these as database IDs. */
  aliases?: readonly string[]
  /** Existing MVP subject label retained for backward compatibility. */
  legacyNames?: readonly string[]
}

const FET_GRADES = [10, 11, 12] as const satisfies readonly CapsGrade[]

function subject(
  id: string,
  name: string,
  category: CapsSubjectCategory,
  extra: Partial<Pick<CapsSubject, 'aliases' | 'legacyNames'>> = {},
): CapsSubject {
  return { id, name, category, grades: FET_GRADES, ...extra }
}

const OFFICIAL_LANGUAGES = [
  'Afrikaans',
  'English',
  'IsiNdebele',
  'IsiXhosa',
  'IsiZulu',
  'Sepedi',
  'Sesotho',
  'Setswana',
  'Siswati',
  'Tshivenda',
  'itsonga',
] as const

const LANGUAGE_OFFERINGS: CapsSubject[] = OFFICIAL_LANGUAGES.flatMap((language) => {
  const displayLanguage = language === 'itsonga' ? 'itsonga' : language
  return ([
    { level: 'Home Language', code: 'hl' },
    { level: 'First Additional Language', code: 'fal' },
  ] as const).map(({ level, code }) => ({
    id: `language-${language.toLowerCase()}-${code}`,
    name: `${displayLanguage} ${level}`,
    category: 'languages' as const,
    grades: FET_GRADES,
    languageLevel: level,
  }))
})

const SECOND_ADDITIONAL_LANGUAGES = [
  'Afrikaans',
  'English',
  'French',
  'IsiNdebele',
  'IsiXhosa',
  'IsiZulu',
  'Mandarin',
  'Sepedi',
  'Sesotho',
  'Setswana',
  'Siswati',
  'Tshivenda',
  'itsonga',
] as const

const SECOND_ADDITIONAL_OFFERINGS: CapsSubject[] = SECOND_ADDITIONAL_LANGUAGES.map((language) => ({
  id: `language-${language.toLowerCase()}-sal`,
  name: `${language} Second Additional Language`,
  category: 'languages',
  grades: FET_GRADES,
  languageLevel: 'Second Additional Language',
}))

/**
 * Broad official FET CAPS subject catalogue. Grade offerings are initially
 * represented as Grades 10–12; any subject-specific exceptions or pathways
 * must be validated against the relevant current CAPS/assessment policy
 * before enabling its learning content.
 */
export const CAPS_SUBJECTS: readonly CapsSubject[] = [
  ...LANGUAGE_OFFERINGS,
  ...SECOND_ADDITIONAL_OFFERINGS,

  subject('accounting', 'Accounting', 'commerce'),
  subject('agricultural-management-practices', 'Agricultural Management Practices', 'sciences'),
  subject('agricultural-sciences', 'Agricultural Sciences', 'sciences', { aliases: ['Agricultural Science'] }),
  subject('agricultural-technology', 'Agricultural Technology', 'technology'),
  subject('business-studies', 'Business Studies', 'commerce'),
  subject('civil-technology', 'Civil Technology', 'engineering'),
  subject('computer-applications-technology', 'Computer Applications Technology', 'technology', { aliases: ['CAT'] }),
  subject('consumer-studies', 'Consumer Studies', 'services'),
  subject('dance-studies', 'Dance Studies', 'arts'),
  subject('design-studies', 'Design Studies', 'arts', { aliases: ['Design'] }),
  subject('dramatic-arts', 'Dramatic Arts', 'arts'),
  subject('economics', 'Economics', 'commerce'),
  subject('electrical-technology', 'Electrical Technology', 'engineering'),
  subject('engineering-graphics-and-design', 'Engineering Graphics and Design', 'engineering', { aliases: ['EGD', 'EGS'] }),
  subject('equine-studies', 'Equine Studies', 'services'),
  subject('geography', 'Geography', 'humanities'),
  subject('history', 'History', 'humanities'),
  subject('hospitality-studies', 'Hospitality Studies', 'services'),
  subject('information-technology', 'Information Technology', 'technology', { aliases: ['IT'] }),
  subject('life-orientation', 'Life Orientation', 'compulsory'),
  subject('life-sciences', 'Life Sciences', 'sciences'),
  subject('marine-sciences', 'Marine Sciences', 'sciences', { aliases: ['Marine Science'] }),
  subject('maritime-economics', 'Maritime Economics', 'commerce'),
  subject('mathematical-literacy', 'Mathematical Literacy', 'mathematics', { aliases: ['Maths Literacy', 'Math Lit'] }),
  subject('mathematics', 'Mathematics', 'mathematics', { aliases: ['Maths'] }),
  subject('mechanical-technology', 'Mechanical Technology', 'engineering'),
  subject('music', 'Music', 'arts'),
  subject('nautical-science', 'Nautical Science', 'technology'),
  subject('physical-science', 'Physical Science', 'sciences', {
    aliases: ['Physical Sciences', 'Physics and Chemistry'],
    legacyNames: ['Physical Science'],
  }),
  subject('religion-studies', 'Religion Studies', 'humanities'),
  subject('sport-and-exercise-science', 'Sport and Exercise Science', 'services'),
  subject('technical-mathematics', 'Technical Mathematics', 'mathematics'),
  subject('technical-sciences', 'Technical Sciences', 'sciences', { aliases: ['Technical Science'] }),
  subject('tourism', 'Tourism', 'services'),
  subject('visual-arts', 'Visual Arts', 'arts'),

  // The DBE also lists technical specialisation offerings separately.
  subject('technical-civil-technology', 'Technical: Civil Technology', 'engineering', { aliases: ['Civil Technology (specialisation)'] }),
  subject('technical-electrical-technology', 'Technical: Electrical Technology', 'engineering', { aliases: ['Electrical Technology (specialisation)'] }),
  subject('technical-mechanical-technology', 'Technical: Mechanical Technology', 'engineering', { aliases: ['Mechanical Technology (specialisation)'] }),
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
  const source = grade ? getCapsSubjectsForGrade(grade) : [...CAPS_SUBJECTS]
  if (!normalized) return source
  return source.filter((item) =>
    [item.name, ...(item.aliases ?? [])].some((value) =>
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
