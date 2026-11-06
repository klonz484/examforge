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


## Source reconciliation update — 6 November 2026

### Confirmed NSC registration guidance

The DBE subject-choice page states that the NSC package comprises seven subjects: four compulsory (two official languages, one Home Language and one First Additional Language; Mathematics or Mathematical Literacy; and Life Orientation) plus three optional subjects selected from the approved list of 25. It states that no more than two additional languages may be selected and describes permitted optional-subject changes during Grades 10–12.

This is registration guidance only. ExamForge subject-library selection remains unlimited.

### Language catalogue reconciliation

The current DBE CAPS FET index separately lists:
- Home Language: Afrikaans, English, isiNdebele, isiXhosa, isiZulu, Sepedi, Sesotho, Setswana, siSwati, Tshivenda and Xitsonga.
- First Additional Language: the same 11 listed languages.
- Second Additional Language: the same 11 languages plus French and Mandarin.

The DBE 2023–2024 FET ATP page additionally lists South African Sign Language in its Grade 10, Grade 11 and Grade 12 Home Language sections. It also shows it in some additional-language ATP sections, but those entries must be reconciled with the dedicated SASL policy and actual assessment arrangements before offering them as ordinary language choices. For the current catalogue, include South African Sign Language at Home Language level only and mark it as a specialist offering pending full policy review.

The ATP index lists language offerings separately for Grades 10, 11 and 12. This supports FET grade coverage at the plan-index level; it does not guarantee that a particular school offers a particular language.

### Content-subject and pathway findings

The DBE CAPS FET index includes broad subject headings such as Civil Technology, Electrical Technology and Mechanical Technology. The FET ATP index exposes more specific pathways, including:
- Mechanical Technology: Automotive, Fitting and Machining, and Welding and Metalworks.
- Electrical Technology: Digital Electronics, Electronics, and Power Systems.
- Civil Technology: Civil Services and Construction.
- Woodworking as a distinct ATP listing.
- Music: Jazz, WAM and IAM.

The existing catalogue currently represents some of these only as broad umbrella subjects and incorrectly treats all catalogue entries as having identical grade availability. Do not use the broad CAPS index as proof that each pathway is available at every school or grade. Model umbrella subject and pathway separately when the learner-facing selection is finalised.

The DBE 2023–2024 ATP index is a useful grade-specific implementation reference, but its publication is not proof that no newer ATP or circular supersedes it. Recheck current DBE circulars and the relevant subject ATP before publishing topic roadmaps.

### Current implementation decision

- Keep the existing broad CAPS index as a discoverability catalogue, but label subject availability as "check with your school" where pathway or school delivery is material.
- Add a distinct NSC registration guide layer (four compulsory + three optional) rather than limiting the learner's ExamForge study library.
- Do not expose all catalogue entries as fully supported learning courses until grade-specific ATP, CAPS topics, assessment guidance and source rights have been checked.
- Preserve the existing Mathematics and Physical Science IDs. Display label should be "Physical Sciences" in curriculum-facing UI, with "Physical Science" retained as a legacy alias.
- Add South African Sign Language Home Language as a specialist language catalogue entry; do not imply ordinary availability across schools.
