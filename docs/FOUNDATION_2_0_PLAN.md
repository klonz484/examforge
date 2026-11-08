# ExamForge — Project Roadmap 2.0

**Status:** Approved working roadmap  
**Project:** ExamForge  
**Repository:** `klonz484/examforge`  
**Roadmap branch:** `foundation/examforge-foundation-2`  
**Last updated:** 8 November 2026

This document is the current roadmap for the project. It supersedes the earlier phase ordering as the active plan, but does **not** erase previous work. Earlier implementation, decisions, branches, test results, and research remain project history and reference material. They must be inspected and reused selectively where appropriate.

---

## 1. Product direction

ExamForge is a mobile-first South African Grade 10–12 learning platform, with an initial focus on Mathematics and Physical Sciences and a path toward broader CAPS coverage.

**Core promise:** “Tonight’s 20. Stop starting from zero every night.”

The central product loop is a short, focused daily study session that helps a learner choose what to work on, practise real curriculum-aligned material, understand mistakes, save progress, and know what to improve next.

ExamForge is not intended to become just a notes repository, generic quiz app, or tutor marketplace.

## 2. Locked product decisions

These are approved requirements, not open design suggestions:

- Tonight’s 20 remains the primary dashboard action and core daily habit.
- Keep exactly seven permanent subject-card positions on the dashboard.
- Provide an expandable **All subjects** area for the learner's complete subject library.
- Seven cards are a visual layout choice, never an enrolment or study limit.
- Learners may select any number of subjects during onboarding.
- Learners can choose any enrolled subject for each daily session and change that choice freely. Recommendations are optional; no forced rotation, lockout, or arbitrary switching limit.
- Preserve existing learner data, profile compatibility, and stable Mathematics / Physical Sciences identifiers.
- Dark theme remains the default; offer a usable light theme.
- Keep the experience mobile-first, accessible, and practical on Android.
- Catalogue inclusion, grade-specific ATP coverage, and actual learning-content availability must be represented as distinct statuses.
- A feature is not complete merely because its screen or button exists: data flow, persistence, permissions, error handling, mobile behaviour, accessibility, and tests must work.
- Never represent sample/demo questions, papers, or mastery values as verified real learner progress.
- Keep production protected. No live database migration, merge to production, or deployment without successful verification and explicit release approval.

## 3. Roadmap at a glance

| Phase | Outcome | Priority |
|---|---|---|
| 0. Foundation stabilisation | A clean, safe, testable development baseline | First |
| 1. Complete learner experience | Reliable onboarding, subject library, dashboard, persistence | Next |
| 2. Complete Tonight's 20 learning loop | A learner can complete a meaningful, saved study session | **Key product milestone** |
| 3. Curriculum and exam library | Verified CAPS roadmaps, past papers, memos, topic practice | After core loop |
| 4. Progress intelligence | Trustworthy mastery and useful next-step recommendations | After real data exists |
| 5. AI Academy | Secure AI-assisted learning, document understanding and question generation | After foundations |
| 6. Public launch readiness | Accessibility, privacy, security, offline, reliability and operations | Before public launch |

The project should not get trapped in infrastructure work. Phase 0 is necessary, but Phase 2 is the key proof that ExamForge delivers its core value.

---

## 4. Detailed phases and exit criteria

### Phase 0 — Stabilise the foundation

**Goal:** Reconcile previous work into a clean development baseline without destabilising production.

Work:
1. Record the current production `main` commit and inspect current branches, pull requests, workflows, dependency files, lockfile, and shared UI components.
2. Keep the shared accessible UI adoption intact.
3. Do not merge the heavily diverged `feat/verified-seven-subject-package` branch wholesale. Compare and selectively port only reviewed, relevant changes.
4. Repair flaky or ambiguous tests; establish a reliable verification workflow that does not deploy.
5. Confirm the lockfile accurately represents declared dependencies and CI uses reproducible installation.
6. Document current production behaviour, known demo limitations, and rollback expectations.

Exit criteria:
- Development work is based on the latest reviewed `main` baseline.
- Build and automated checks pass consistently.
- Shared UI components and their tests remain intact.
- Feature verification cannot accidentally deploy to production.
- A clear branch/PR integration plan exists.

### Phase 1 — Complete the learner experience

**Goal:** Make subject selection, the dashboard, and learner preferences genuinely usable and persistent.

Work:
1. Integrate the verified CAPS subject catalogue and its stable subject identifiers.
2. Support selecting any number of subjects in onboarding.
3. Preserve legacy Mathematics and Physical Sciences profile compatibility.
4. Add a per-learner subject enrolment model using additive database changes; do not break existing profile constraints or history.
5. Build the seven permanent dashboard subject-card positions and expandable **All subjects** library.
6. Make daily subject choice unrestricted among the learner's enrolled subjects.
7. Ensure subject selections survive reloads and sign-in and remain isolated between accounts.
8. Correct onboarding save behaviour: never show success until all required writes have been confirmed; handle partial failure safely.
9. Verify keyboard navigation, screen-reader labels, mobile layout, text sizing, and theme behaviour.

Exit criteria:
- A learner can select and retain any number of subjects.
- The seven-card dashboard and expandable full library work on mobile and desktop.
- Daily subject switching is unrestricted.
- Data is account-isolated and legacy learners remain compatible.
- Failed saves show honest errors and do not falsely report success.
- Migration and RLS tests pass against a disposable/staging database before any production migration is considered.

### Phase 2 — Complete the Tonight's 20 learning loop

**Goal:** Deliver one complete, meaningful study session from start to finish. This is the most important product milestone.

Expected learner journey:
1. Open Tonight's 20.
2. Choose any enrolled subject.
3. Choose or receive a relevant topic/activity recommendation.
4. Work through real, curriculum-aligned questions or a clearly labelled learning activity.
5. Submit answers and receive correct marking, explanations, and correction guidance.
6. Capture mistakes for later review.
7. Save the session, answers, outcomes, and duration.
8. See a useful summary and a sensible next action.

Work:
- Define the session state model, including start, in-progress, submitted, completed, abandoned, and recoverable states where appropriate.
- Use real question content with source, grade, subject, topic, and provenance metadata; label any temporary sample content clearly.
- Implement answer validation and marking appropriate to each question type.
- Provide explanations that teach, not merely reveal the answer.
- Persist attempts and completed sessions to the signed-in learner's account.
- Ensure interrupted sessions and network failures do not silently lose work.
- Make the mistake notebook a usable part of the session loop, even if advanced review tools come later.
- Keep the 20-minute target motivating rather than punitive; do not punish learners for taking longer.

Exit criteria:
- A learner can complete a session end-to-end on a phone.
- Questions, marking, explanations, attempts, and session records are real and correctly linked.
- Reloads, sign-out/sign-in, and recoverable network errors behave safely.
- A completed session contributes to trustworthy progress data.
- Automated tests cover the critical journey and account isolation.

### Phase 3 — Curriculum and exam library

**Goal:** Build a dependable curriculum map and exam-practice library.

Work:
- Create CAPS roadmaps by grade, subject, topic, and relevant curriculum structure.
- Build a provenance-checked catalogue of official DBE past papers and memos.
- Link papers and questions to subject, grade, topic, year, and source where known.
- Add topic-level practice sets and revision pathways.
- Add flashcards and spaced-repetition review.
- Expand the mistake notebook into searchable, filterable review.
- Clearly mark gaps where a CAPS listing exists but grade-specific ATP mapping or actual learning content is not verified.

Exit criteria:
- Curriculum mappings are traceable to authoritative sources.
- Paper and memo links are checked and labelled with source/year.
- Learners can find and practise by grade, subject, and topic.
- Unsupported or unverified areas are clearly disclosed.

### Phase 4 — Progress intelligence

**Goal:** Turn actual learner activity into accurate, understandable progress and recommendations.

Work:
- Calculate topic and subject progress from persisted attempts and sessions.
- Track strengths, recurring errors, and weak topics.
- Show study history and trends over time.
- Distinguish activity completion from demonstrated mastery.
- Generate next-step recommendations based on evidence, while preserving learner choice.
- Explain why a recommendation is being made.

Exit criteria:
- Progress indicators are derived from real, attributable learner data.
- No demo values are presented as measured mastery.
- Recommendations are understandable and can always be overridden by the learner.

### Phase 5 — AI Academy

**Goal:** Add secure AI capabilities that improve learning rather than becoming an unreliable shortcut.

Work:
- Implement server-side AI calls; never expose provider secrets in frontend code.
- Add secure notes/document upload processing, OCR/text extraction, and extraction-confidence reporting.
- Classify extracted content against CAPS subject/grade/topic metadata.
- Generate questions, worked examples, explanations, and revision plans with validation.
- Let learners inspect and correct extracted content before relying on it.
- Add quotas, abuse controls, cost monitoring, rate limits, and failure handling.
- Keep AI outputs distinguishable from official DBE source material.
- Add a study assistant grounded in the learner's selected subject, topic, and available source content.

Exit criteria:
- Secrets and uploaded files are handled securely.
- Generated content is validated, labelled, and reviewable.
- AI failures do not corrupt learner data or block ordinary study.
- Usage and cost controls are operational.

### Phase 6 — Public launch readiness

**Goal:** Make the product safe, accessible, dependable, and supportable for real learners.

Work:
- Complete manual and automated accessibility checks: keyboard, screen reader, focus, contrast, reduced motion, and mobile assistive technology.
- Review POPIA obligations, privacy notices, consent, retention, deletion, and access controls.
- Perform security review of authentication, RLS, storage, upload validation, and server-side endpoints.
- Implement backup and recovery procedures and test them.
- Improve offline/PWA behaviour and conflict-safe sync.
- Add monitoring, error reporting, performance checks, and operational documentation.
- Test across common Android devices, browsers, and constrained network conditions.
- Prepare support, incident, and rollback procedures.
- Review licensing and provenance for all learning materials.

Exit criteria:
- No unresolved critical security or privacy issues.
- Accessibility issues are tested and prioritised with documented outcomes.
- Backup/restore and release rollback are proven.
- Performance and reliability are acceptable on target mobile devices.
- Public-facing claims match actual product capability.

---

## 5. Curriculum catalogue integrity rules

Use explicit statuses and never collapse these concepts:

- `atp-listed`: subject appears in the relevant ATP source reviewed.
- `specialist-atp`: specialist subject/pathway with a specific ATP source or scope.
- `caps-index-only`: visible in a CAPS index, but grade-specific ATP coverage is not established by the reviewed source.
- `pathway-parent`: grouping entry that requires a learner to select a specific child pathway.

Important research context retained:
- The DBE NSC school subject package rules describe school registration (four compulsory plus three optional subjects); they do not impose a seven-subject limit on ExamForge's personal learning library.
- The DBE 2023/24 FET ATP index and Circular S19 of 2025 were reviewed in relation to 2026 applicability and exclusions. CAT and IT require careful treatment because the earlier ATP index does not establish current updated ATP coverage for them.
- Technical Technology and Music pathways must be represented as specific child options where appropriate, not as if each parent heading were a complete subject.
- Language levels (HL/FAL/SAL) are distinct learning offerings; do not infer level from a learner's home language.
- Do not claim DBE certification or endorsement for third-party content without evidence.
- Verify current source documents before expanding claims about grade/subject coverage.

Research references:
- DBE FET ATP index: https://www.education.gov.za/Curriculum/NationalCurriculumStatementsGradesR-12/2023ATPsFET.aspx
- DBE Circular S19 2025: https://www.education.gov.za/LinkClick.aspx?fileticket=fqHc5ZnT_q4%3D&mid=10757&portalid=0&tabid=3209
- DBE National Circulars: https://www.education.gov.za/Curriculum/NationalCirculars.aspx
- DBE CAPS FET index: https://www.education.gov.za/Curriculum/NCSGradesR12/CAPSFET/tabid/570/Default.aspx

---

## 6. Engineering, data, and release safeguards

- Keep changes on feature branches and use pull requests for integration.
- Do not merge the old diverged subject feature branch wholesale.
- Keep migrations additive and backward-compatible wherever possible.
- Test migrations and RLS on disposable/staging data first.
- Verify per-user isolation for every learner-owned table and storage path.
- Keep AI provider keys and privileged Supabase credentials server-side.
- Use reproducible dependency installation and keep lockfiles in sync.
- Separate feature verification from deployment workflows.
- Require build, unit, integration, browser, accessibility, and security checks appropriate to the change.
- Record known limitations and test evidence in pull requests.
- Production merge, live migration, and deployment are separate release decisions requiring explicit approval.
- Do not fabricate completion, test success, source provenance, or product capability.

## 7. Shared development ecosystem closeout rule

Every completed software project should leave the shared development ecosystem better than it found it. At suitable milestones and project closeout:
- Identify genuinely reusable components, layouts, templates, utilities, design patterns, documentation, dependency decisions, and tests.
- Extract only assets that are project-independent and generalisable.
- Document usage, dependencies, licensing/provenance, compatibility, accessibility, performance, and test status.
- Add or update automated tests and examples.
- Version and changelog reusable assets.
- Avoid extracting ExamForge-specific product logic into shared packages.

---

## 8. Existing project progress and reference history

This section preserves previous work as progress/reference. It is not a claim that every item is already integrated into the current production branch.

### Product and infrastructure progress previously established
- ExamForge product direction and PRD v1.0 were established, with Tonight's 20 as the central daily habit.
- Public GitHub repository `klonz484/examforge` was created and used for development.
- Supabase project was created and connected to the application configuration.
- Existing schema includes profiles, generated questions, note uploads, question attempts, and study sessions; a private `student-notes` storage bucket exists.
- Existing profile RLS policies were inspected for own-row insert/select/update.
- GitHub Actions and Pages deployment were brought through successful build/deploy runs in earlier work.
- A previous Playwright verification run passed sign-in, profile persistence, and cross-account isolation checks. A later run also passed 13 of 14 tests; its remaining failure was an ambiguous Playwright selector matching both a selected-subject removal control and a catalogue item. That run must be treated as failed, not as a full pass.
- Shared accessible UI components were adopted through merged PR #2.
- PR #1, concerning the reuse-first engineering workflow, was previously reported open; verify its current status before acting.

### Subject catalogue and onboarding work on the earlier feature branch
Earlier work on `feat/verified-seven-subject-package` included:
- A CAPS catalogue with stable IDs and grade-aware discovery helpers.
- Language levels and specialist pathways represented separately.
- Distinct ATP-listed, specialist ATP, CAPS-index-only, and pathway-parent statuses.
- Multi-subject onboarding and learner-subject persistence work.
- An additive `002_learner_subjects.sql` migration proposal.
- Catalogue and browser tests, plus DBE verification/test-plan documentation.
- Tests at one earlier commit passed 8/8 catalogue tests. Later verification had a selector ambiguity and one test failure; do not assume the latest branch state is green.
- The branch became substantially diverged from `main` (previously reported as 50 commits ahead and 42 behind). It must be inspected and selectively reconciled, not merged wholesale.

### Foundation 2.0 branch progress
- Branch `foundation/examforge-foundation-2` was created from `main`.
- This roadmap document was initially committed as `docs/FOUNDATION_2_0_PLAN.md` at commit `56eb0db7cda2e9a94c28475dc853836abf8c93bc`.
- The initial document established production protection, selective porting, seven dashboard positions, expandable All subjects, and acceptance criteria.
- The current document expands that initial foundation plan into the full product roadmap and retains its safeguards.
- At the time this roadmap was written, the new branch had the plan document but no confirmed feature implementation ported yet. Inspect the live branch before assuming otherwise.

### Known limitations previously identified
- Question bank and past-paper catalogue contained sample/demo content.
- Mastery/progress values were partly demo/local and must not be presented as verified progress.
- Notes upload storage existed, but a complete secure OCR/AI processing pipeline was not established.
- Mistake notebook and flashcard/spaced-repetition functionality were not complete.
- Progress calculations were not yet fully rebuilt from persisted attempts and session data.
- Offline sync, privacy/POPIA, backup, monitoring, and full accessibility validation remained work items.
- Onboarding save logic previously risked reporting success before Supabase writes were confirmed.
- Existing `profiles.primary_subject` constraint supported the legacy Mathematics/Physical Sciences values; prefer a separate learner-subject relation rather than breaking that contract without a reviewed migration.

---

## 9. Immediate next action

**Pause at the Phase 5 provider/OCR approval boundary.** Resume provider/OCR work only after the project owner approves the privacy, vendor and cost review and decides whether OCR is in scope. Phase 6 also requires owner-provided physical Android testing and approved backup/restore/operational access.

Phases 0–4 are complete on the isolated foundation branch. Phase 5 provider-independent work is implemented and verified, but OCR and AI provider activation remain disabled pending project-owner privacy, vendor and cost approval. Phase 6 remains open for manual Android accessibility, POPIA/privacy and independent security review, a real backup/restore drill, broader offline/performance testing and operational readiness.

Do not create a temporary Supabase preview branch or use student data for verification. CI uses disposable local Supabase containers and local test accounts only. No live Supabase migration, production merge, Pages deployment, provider call, package publication or cost is authorised.


## 10. Roadmap progress log — 7 November 2026

### Phase 0 — Foundation stabilisation: COMPLETE (foundation branch only)

Verified exit evidence:
- Foundation branch remains based on the reviewed `main` baseline `259df190812ad9d47405d3402b90998fafbd2fc3`; the current comparison reports 213 commits ahead and 0 behind. Latest code-verified head before this progress-documentation update is `6709e144d0b2be3c0e68f2063b4e6bcc6f52b3ee`.
- Current verified head before this documentation update: `2839d012901713f5a87471e81b1c66a06129fce6`.
- [Foundation verification run #22](https://github.com/klonz484/examforge/actions/runs/42393214592) completed successfully: `npm ci`, TypeScript/production build, Chromium/Firefox/WebKit installation, and full Playwright browser/integration suite all passed.
- Shared accessible UI tests remain intact in the passing suite.
- The isolated foundation workflow has read-only repository permissions and no deployment or live Supabase migration steps.
- Branch audit documents the selective integration/PR plan and explicitly excludes wholesale merge of the diverged legacy feature branch.

The earlier failed browser run was corrected and is retained in history; completion is based on the later full successful run, not on partial checks. No merge to `main`, Pages deployment, or live Supabase change occurred.

### Phase 1 — Complete the learner experience: NEXT

Proceed with the approved Phase 1 exit criteria. First priority is to review the current onboarding and subject-selection save/hydration flow, then design the additive `learner_subjects` persistence and account-isolation strategy. Preserve the legacy `profiles.primary_subject` contract. Prepare migration and RLS tests for a disposable/staging database; do not apply them to the connected live Supabase project without explicit approval. Ensure save success is only shown after confirmed persistence, and preserve guest-to-account and existing-account behaviour.

**Phase completion notification:** Phase 0 is now recorded as complete on this development branch. This is not production release approval.


## 11. Phase 1 exit review — 8 November 2026

### Phase 1 — Complete the learner experience: COMPLETE on the foundation branch

The Phase 1 implementation and documented exit criteria have been verified on the isolated development branch. This is not production release approval.

**Delivered**
- Reviewed CAPS subject catalogue with stable identifiers and explicit `atp-listed`, `specialist-atp`, `caps-index-only`, and `pathway-parent` distinctions.
- Unlimited subject selection in onboarding, preserving legacy Mathematics / Physical Sciences profile compatibility.
- Exactly seven permanent dashboard subject-card positions plus expandable **All subjects** library.
- Unrestricted daily subject choice among enrolled subjects.
- Additive `learner_subjects` migration with legacy backfill, own-account RLS policies, and a transactional onboarding RPC; legacy `profiles.primary_subject` contract retained.
- Account-scoped browser persistence, guest-to-new-account preservation, existing-account hydration without overwriting established selections, and explicit save failure handling.
- Automated coverage for catalogue integrity, onboarding, dashboard, daily selection, keyboard-operable theme selection, persistence across reload, and learner data isolation.

**Verification evidence**
- [PR #3 verification run 42445416667](https://github.com/klonz484/examforge/actions/runs/42445416667) completed successfully on head `ef4894e181fa1215e6df95e77118629fb2807f29`.
- The isolated workflow ran the learner-subject migration/RLS checks against a disposable PostgreSQL 16 service container; that step passed.
- TypeScript/production build passed.
- Playwright: **54 passed, 4 skipped**. The four skipped tests require explicitly configured disposable Supabase staging credentials; they were not run against the live project. Existing account-isolation coverage in the suite passed.
- The test suite includes Chromium, Firefox, and WebKit projects; the successful run completed.
- Earlier failed runs are retained as history and are not used as completion evidence.

**Limitations and release boundary**
- The migration has only been exercised in disposable CI PostgreSQL. It has **not** been applied to the connected live Supabase project.
- No merge to `main`, GitHub Pages deployment, or live database change has occurred. PR #3 remains open for review; production integration is a separate approval.
- Full manual assistive-technology validation (including physical Android screen-reader testing) remains part of Phase 6 launch readiness; automated semantic/keyboard checks are not a substitute for that manual audit.
- Four optional staging-Supabase E2E tests remain skipped until a disposable staging project is explicitly configured. Do not run destructive test-account workflows against production.

**Phase 1 status: COMPLETE on the foundation branch.** The next implementation phase is Phase 2 — Complete the Tonight's 20 learning loop.


## 12. Phase 2 implementation and verification update — 8 November 2026

### Tonight's 20 learning loop — implementation delivered; final exit gate pending

**Implemented on `foundation/examforge-foundation-2`:**
- Added a structured, stable-ID starter question bank for Grade 12 Mathematics and Physical Sciences. Every question records grade, subject ID, topic, answer, explanation, source label and provenance. The content is explicitly labelled **ExamForge original practice** and **not an official DBE question or past-paper extract**.
- Replaced the former short Rewind flow with a 20-minute focus target. Learners may finish earlier; the timer does not force them to remain in the session.
- Added answer marking and immediate explanations, plus a completion summary.
- Added save-and-exit, local recovery snapshots, resume after reload, and explicit abandon behaviour.
- Added account-owned cloud session creation, atomic answer/attempt persistence, and completion RPCs. Attempts link to stable question IDs and session positions; repeated answer writes are idempotent.
- Added an additive session migration preserving the legacy completed-session timestamp default and existing historical rows. It adds session status/state, grade/subject/source metadata, question-attempt links, own-account update RLS and invoker RPCs.
- Added a persistent mistake notebook sourced from recorded incorrect attempts. Progress is labelled **accuracy**, not mastery.
- Corrected subject resolution so unsupported enrolled subjects cannot accidentally receive another subject's question bank; unsupported content is explicitly disclosed.
- Restored guest learner setup, session history and attempts after reload.

**Automated verification evidence**
- [Foundation verification run 42447976494](https://github.com/klonz484/examforge/actions/runs/42447976494) passed on head `ad8e3470667a975adea413251cc4c57969b803dc`.
- Disposable PostgreSQL 16 learner-subject migration/RLS test passed.
- Disposable PostgreSQL 16 recoverable-session/answer RPC test passed, including idempotent answer replay, completion persistence and cross-account read/write isolation.
- TypeScript and production build passed.
- Playwright across Chromium, Firefox and WebKit: **63 passed, 7 skipped**.
- The browser journey verifies start, answer, explanation, save/exit, reload, resume, completion, and saved mistake review.
- The separate guarded Supabase end-to-end tests, including cloud sign-out/sign-in recovery, were skipped because an explicitly designated disposable Supabase staging environment and credentials are not configured. Their presence in the suite is not counted as executed verification.

**Known content and release limits**
- The Phase 2 starter bank initially supported Grade 12 Mathematics and Physical Sciences. Phase 3 expanded original practice coverage to Grade 10–12 Mathematics and Physical Sciences. Other catalogue subjects remain unavailable rather than receiving mismatched questions.
- All current question-bank items are original ExamForge practice, not official DBE past-paper extracts. Phase 3 now links to DBE archive index pages; individual PDFs remain DBE-hosted and are not re-hosted or ingested.
- Migration `003_recoverable_study_sessions.sql` has passed disposable CI PostgreSQL testing only. It has not been applied to the connected live Supabase project.
- PR #3 remains open and unmerged. No main merge, GitHub Pages deployment or live database write occurred.

**Final Phase 2 exit-gate closure — 8 November 2026**

- [Foundation verification run #332](https://github.com/klonz484/examforge/actions/runs/42505206691) completed successfully on head 072b20d4644742a4ec0dd2157ef8b4a58f40ad87.
- CI started a disposable local Supabase stack, applied the migrations, created three local test accounts, served the Edge Functions without AI provider secrets, and ran authenticated browser/integration tests.
- The guarded cloud-auth sign-out/sign-in recovery and offline answer-queue sync test executed against this disposable local stack. It was not skipped.
- Playwright: **108 passed, 0 skipped** across the configured Chromium, Firefox and WebKit projects. TypeScript/production build and all disposable PostgreSQL/RLS suites passed.
- This used no temporary Supabase preview branch, no real student accounts/data, and no connected live Supabase project.

**Phase 2 status: COMPLETE on the foundation branch only.** PR #3 remains open and unmerged. No production migration, merge or deployment occurred. Proceed to Phase 3.

## 13. Phase 3 completion evidence — 8 November 2026

### Phase 3 — Curriculum and exam library: COMPLETE on the foundation branch

**Delivered**
- Six grade/subject CAPS roadmaps: Grade 10, 11 and 12 Mathematics and Physical Sciences, with DBE ATP source metadata and explicit source/status distinctions.
- Eight official DBE archive-index entries covering Mathematics and Physical Sciences for November 2024, May/June 2025, November 2025 and May/June 2026. The catalogue records year, grade, subject, paper/memo counts, source authority, verification date and access notes. The links open DBE archive index pages; ExamForge does not re-host the PDFs.
- Topic-level original practice sets for all six grade/subject combinations, with stable question IDs, answers, explanations and explicit non-DBE provenance.
- Searchable mistake notebook, reveal-and-correct flashcards and persisted spaced-repetition scheduling through the learner-owned review RPC.
- Catalogue-only and unverified subject areas remain visible with their distinct statuses rather than being represented as complete study content.

**Verification**
- [Foundation verification run #332](https://github.com/klonz484/examforge/actions/runs/42505206691) passed: curriculum-library, practice-content, subject catalogue and spaced-review browser tests ran within the full suite.
- DBE FET ATP index and the 2024–2026 DBE archive index pages were checked on 8 November 2026. The ATP index lists the relevant Grade 10–12 Mathematics and Physical Sciences offerings; the archive pages expose the relevant paper/memo sections.
- Phase 3 is complete for the currently implemented Grade 10–12 Mathematics and Physical Sciences scope. It is not a claim of full CAPS coverage across every catalogue subject or a DBE endorsement.

**Source references**
- DBE FET ATP index: https://www.education.gov.za/Curriculum/NationalCurriculumStatementsGradesR-12/2023ATPsFET.aspx
- DBE Circular S19 2025: https://www.education.gov.za/LinkClick.aspx?fileticket=fqHc5ZnT_q4%3D&mid=10757&portalid=0&tabid=3209
- DBE 2024 NSC archive: https://www.education.gov.za/Curriculum/NationalSeniorCertificate%28NSC%29Examinations/2024NovemberNSCExamPapers.aspx
- DBE 2025 November archive: https://www.education.gov.za/Curriculum/NationalSeniorCertificate%28NSC%29Examinations/2025NovemberNSCExamPapers.aspx
- DBE 2025 May/June archive: https://www.education.gov.za/Curriculum/NationalSeniorCertificate%28NSC%29Examinations/2025MayJuneExamPapers.aspx
- DBE 2026 May/June archive: https://www.education.gov.za/Curriculum/NationalSeniorCertificate%28NSC%29Examinations/2026MayJuneExamPapers.aspx

## 14. Phase 4 completion evidence — 8 November 2026

### Phase 4 — Progress intelligence: COMPLETE on the foundation branch

**Delivered**
- Topic accuracy, recent/previous seven-day trends and optional next-focus recommendations derive from saved question attempts and session records.
- Attempt attribution uses stable question IDs, subject IDs and grade context; legacy rows with recoverable context are resolved and unknown/mismatched context is not presented as measured progress.
- Empty and small samples are explicitly marked as insufficient evidence. Recommendations are withheld until the sample threshold is met.
- Activity completion is separated from answer accuracy; the UI does not label a small sample as mastery.
- Learners can override recommendations and retain control of their next study topic.

**Verification**
- [Foundation verification run #332](https://github.com/klonz484/examforge/actions/runs/42505206691): progress-intelligence unit/browser tests passed; the authenticated local Supabase integration test saved a real attempt, read it back under the same account, calculated the expected small-sample result, and verified another account saw no attempt data.
- Empty, small-sample and context-scoping cases passed within the 108-test verification run.

**Phase 4 status: COMPLETE on the foundation branch only.**

## 15. Phase 5 implementation status — 8 November 2026

### Phase 5 — AI Academy: provider-independent implementation advanced; approval gate remains open

**Delivered and verified**
- Private student-notes storage retains per-user path isolation, allowed MIME types and 10 MB limits. The extraction Edge Function validates the authenticated owner, note row, storage path, file size and PDF signature.
- Text-based PDFs are extracted with unpdf, with page/time/text bounds. Scanned PDFs and image uploads are marked low_confidence; no external OCR provider is called.
- Extraction metadata now reports qualityStatus and confidenceStatus. The numeric extraction_confidence remains null because no calibrated confidence model is used; no score is fabricated.
- AI draft generation is server-side, requires learner authentication and subject enrolment, validates output structure and a verbatim evidence excerpt, preserves AI provenance, and keeps drafts pending human review.
- The Edge Function now allowlists only supported Grade 10–12 Mathematics and Physical Sciences starter-practice subject/grade/topic combinations. This prevents arbitrary or mismatched metadata; it does not claim automatic classification of source text.
- Atomic five-request daily quota and usage-accounting/RLS controls are covered by disposable PostgreSQL tests.
- The learner UI feature flag VITE_AI_STUDY_ENABLED defaults to false. The provider is also disabled server-side because no AI provider secrets are configured.

**Verification**
- [Foundation verification run #351](https://github.com/klonz484/examforge/actions/runs/42506065508) passed on head 6709e144d0b2be3c0e68f2063b4e6bcc6f52b3ee: **114 passed, 0 skipped**. This includes PDF extraction, scanned-PDF/image low-confidence handling, private-storage account isolation, AI-provider-disabled response, metadata allowlist tests, and the disabled learner UI.
- The shared UI adoption check [run #184](https://github.com/klonz484/examforge/actions/runs/42506065474) also passed.

**Not complete / approval boundary**
- OCR for images and scanned PDFs is not implemented. No OCR vendor or service has been selected.
- No AI provider is configured or activated; no provider API call or cost has occurred.
- Automatic classification of arbitrary extracted text is not active. Current validation confirms learner-selected metadata belongs to a supported practice map; content classification/quality evaluation requires an approved provider or a separately reviewed deterministic approach.
- The extraction quality status is not a calibrated numeric confidence score.
- Before activation, the project owner must approve the provider/OCR vendor, data-processing terms, POPIA/privacy assessment, retention/region/subprocessor terms, hard spend limits and operational monitoring. Only then may credentials be configured in a non-production Edge Function environment and provider integration be tested.

**Phase 5 status: PARTIAL — provider/OCR approval gate open.** Ordinary study remains usable without AI.

## 16. Phase 6 launch-readiness blockers — 8 November 2026

Phase 6 is not complete. The following work requires physical-device access, owner/legal decisions or live operational configuration:

- Manual keyboard, screen-reader/TalkBack, focus, contrast and text-scaling validation on physical Android devices.
- POPIA/privacy review covering learner/minor data, lawful basis, notices, consent, retention, deletion and vendor processing.
- Independent security review/penetration testing and review of deployed authentication/RLS/storage/Edge Function configuration.
- Hosted Supabase backup policy and a real restore drill with owner-approved access to the connected service.
- Full offline/conflict recovery and constrained-network testing on target Android browsers.
- Real-device performance, monitoring/alerting, incident/support and rollback operations.
- Final content licensing/provenance and public-facing claims review.

Do not access or change the connected live Supabase project, GitHub Pages, main, production secrets or paid services to complete these tasks without separate explicit approval. The project remains a development-branch implementation, not a public-launch approval.



## 17. PR #3 merge and latest verification — 8 November 2026

- The project owner explicitly approved merging PR #3. It was squash-merged after [Foundation verification #373](https://github.com/klonz484/examforge/actions/runs/42526602544) and [Shared UI verification #201](https://github.com/klonz484/examforge/actions/runs/42526602555) both passed on head `67eb0d05073b23ef4320ad7b1042f547b17786ec`.
- The offline PWA reload test was hardened to assert stable onboarding content after the offline reload.
- Merge commit: [`8faa2caf49b12556ba62cba6e4f075301842b69f`](https://github.com/klonz484/examforge/commit/8faa2caf49b12556ba62cba6e4f075301842b69f). [PR #3](https://github.com/klonz484/examforge/pull/3) is merged; older statements in this roadmap saying it remains open/unmerged are superseded by this entry.
- The merge did not deploy GitHub Pages, apply live Supabase migrations, configure production secrets or activate paid AI/OCR providers.
- The foundation branch is one commit behind the newly updated `main` after squash merge. Reconcile ancestry before creating another integration PR; do not duplicate the already merged implementation.
- Phases 0–4 remain complete. Phase 5 remains partial at the owner approval boundary. Phase 6 remains incomplete.
