# ExamForge CAPS / NSC subject verification

Status: research baseline — not a complete subject-by-subject approval.

## Product rules

- Standard NSC package: exactly seven subjects.
- Required four: two official languages (one Home Language and one First Additional Language; one must be the school's language of learning and teaching), Mathematics or Mathematical Literacy, and Life Orientation.
- Select at least three eligible Group B subjects.
- Keep the selected package stable for ordinary study use. Do not describe it as legally unchangeable.
- DBE subject-choice guidance says learners may change two optional subjects in Grades 10 and 11, and one optional subject in Grade 12. Any ExamForge change flow must reflect the applicable approval/registration process and must not silently rewrite a learner's registered school subjects.
- Subject choice is also constrained by what the learner's school offers and by further-study/career prerequisites.

## Primary DBE sources checked

1. DBE, Subject Choice and Career Pathing:
   https://www.education.gov.za/Informationfor/Learners/SubjectChoiceandCareerPathing.aspx
   Supports the seven-subject NSC structure, four compulsory subjects, three optional subjects, maximum two additional languages, and the published subject-change allowances.
2. DBE, National Policy pertaining to the Programme and Promotion Requirements of the NCS Grades R–12:
   https://www.education.gov.za/Portals/0/Documents/Policies/NATIONAL%20POLICY%20PERTAINING%20TO%20THE%20PROGRAMME%20AND%20PROMOTION%20REQUIREMENTS%20OF%20THE%20NCS.pdf
   Use Chapter 6, paragraphs 27–28 and Annexure B for programme requirements, pathway distinctions, provisos, and approved subject groups. Check amendments before treating this copy as the latest consolidated policy.
3. DBE, CAPS FET subject documents:
   https://www.education.gov.za/Curriculum/NCSGradesR12/CAPSFET/tabid/570/Default.aspx
   Use the actual subject-specific CAPS documents and current amendments; the landing page alone is not proof that a subject is available at every school.
4. DBE, FET ATP mediation presentations:
   https://www.education.gov.za/Curriculum/NationalCurriculumStatementsGradesR-12/2023ATPMediationFET/tabid/3231/ItemId/29893/Default.aspx
   Lists selected grade-specific ATP content subjects and a separate Grades 10–12 group. This is a useful cross-check, not a complete approved-subject register.

## Verification rules before a subject is marked selectable

For every subject record, capture:
- stable subject ID and official display name;
- approved policy group / pathway eligibility;
- language level and language-group constraints, where relevant;
- grade or phase evidence from current policy/CAPS/assessment material;
- source URL, document title, publication/amendment date, and exact page/paragraph/table;
- verification status: verified, conditional, or unresolved;
- whether it can count toward one of the three optional Group B choices.

Do not infer that a subject is offered at a learner's school merely because it appears in a national DBE list. The learner/school must confirm actual availability.

## Known catalogue defect to resolve

The current `src/data/capsSubjects.ts` uses a shared `FET_GRADES = [10, 11, 12]` for every subject. That is a blanket assumption, not evidence. Replace it only after each entry is reconciled against current DBE policy and source material. Do not mark all entries verified based solely on the general CAPS FET landing page.

## Important pathway distinction

The standard package described in the product brief is the Academic/General pathway: Mathematics or Mathematical Literacy. The DBE policy has separate technical-pathway provisions, including Technical Mathematics. Do not mix pathway rules into the standard package without an explicit, separately validated pathway design.

## Release gate

Do not merge or deploy the new onboarding until:
- catalogue records have evidence and unresolved entries are excluded or visibly flagged;
- the seven-subject validator enforces the correct language and subject rules;
- subject selections persist to the authenticated learner profile;
- daily study selection is independent of the permanent package;
- the permitted subject-change workflow is explicit;
- unit / end-to-end tests pass for Grades 10, 11, and 12;
- the mobile onboarding flow is checked on the deployed Pages site.
