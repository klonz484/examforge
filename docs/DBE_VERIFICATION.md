# DBE verification notes — FET subject catalogue and seven-subject package

Status: source review started; this is not yet a complete grade-by-grade or school-offering verification.

Last checked: 6 November 2026

## Official sources reviewed

1. DBE, CAPS for the Further Education and Training phase (Grades 10–12): https://www.education.gov.za/Curriculum/NCSGradesR12/CAPSFET/tabid/570/Default.aspx
2. DBE, Subject Choice and Career Pathing: https://www.education.gov.za/Informationfor/Learners/SubjectChoiceandCareerPathing.aspx
3. DBE, Regulations pertaining to the National Curriculum Statement Grades R–12 (2021): https://www.education.gov.za/LinkClick.aspx?fileticket=eaGB4NP18nw%3D&mid=4018&portalid=0&tabid=419
4. DBE, Promotion requirements for Grades 10–12: https://www.education.gov.za/Curriculum/NationalCurriculumStatementsGradesR-12/PromotionrequirementsforGrade10-12.aspx

## Findings that are supported by the sources

- The NSC subject package is seven subjects: two official languages (one Home Language and one First Additional Language), Mathematics or Mathematical Literacy, Life Orientation, and three approved optional subjects.
- The DBE subject-choice page describes 25 approved optional subjects and says a maximum of two additional languages may be selected.
- The DBE CAPS FET index lists the FET CAPS subject documents. Its non-language list includes Accounting, Agricultural Management Practices, Agricultural Science, Agricultural Technology, Business Studies, Civil Technology, Computer Applications Technology, Consumer Studies, Dance Studies, Design Studies, Dramatic Arts, Economics, Electrical Technology, Engineering Graphics and Design, Equine Studies, Geography, Hospitality Studies, Information Technology, Life Orientation, Life Sciences, Marine Sciences, Maritime Economics, Mathematical Literacy, Mathematics, Mechanical Technology, Music, Nautical Science, Physical Sciences, Religion Studies, Sport and Exercise Science, Technical Mathematics, Technical Sciences, Technical: Civil Technology, Technical: Electrical Technology, Technical: Mechanical Technology, Tourism and Visual Arts.
- The DBE FET index separately lists language CAPS documents for Afrikaans, English, French, isiNdebele, isiXhosa, isiZulu, Mandarin, Sepedi, Sesotho, Setswana, siSwati, Tshivenda and Xitsonga. This index alone does not prove that every language is available at every language level or at every school.
- The regulations impose special conditions on some subjects. For example, Sport and Exercise Science has institution and co-subject requirements; technical subjects and specialised offerings must not be treated as universally available.
- The DBE promotion page confirms promotion is based on completion of assessment requirements in not fewer than seven subjects.

## Critical product distinction

ExamForge is a study and revision tool, not a school registration system. A learner may add any number of subjects to their personal study library and freely choose a different subject for each daily study session. These product actions must not be blocked by NSC subject-registration rules.

The NSC seven-subject package, approved combinations, language-level requirements, subject availability at the learner's school, and regulated subject-change rules should be presented as guidance about the learner's official school registration—not as limits on what they may study inside ExamForge.

The dashboard's seven permanent subject-card positions are a presentation requirement. They must not cap the learner's study library. The implementation should preserve access to additional selected subjects (for example through a scrollable or expandable "All subjects" area) while retaining the seven permanent cards.

## Catalogue implementation rules

- Do not assign every subject to Grades 10, 11 and 12 merely because the CAPS index is labelled FET. Grade-specific ATPs, assessment guidelines and current amendments must be checked before enabling topic content.
- Keep the CAPS subject index separate from the smaller approved NSC optional-subject set.
- Keep language name and language level as separate fields. Do not infer that a language is valid at Home Language, First Additional Language and Second Additional Language levels from the index alone.
- Mark institution-restricted, pathway-specific or school-dependent subjects as conditional and explain the condition.
- Preserve legacy subject identifiers and existing learner data during database migration.
- Use official CAPS documents as curriculum references. Do not describe third-party notes, papers or generated questions as "DBE-certified" unless DBE explicitly certifies that material.

## Open verification work

- Extract the full current approved optional-subject list and reconcile it with the 25-subject statement.
- Verify each language-level combination and its grade availability.
- Verify each subject's actual grade offering, current amendments and any subject-combination restrictions.
- Identify school-dependent/specialised subjects and represent their availability honestly.
- Build source-backed subject metadata and tests before wiring onboarding or running a Supabase migration.
