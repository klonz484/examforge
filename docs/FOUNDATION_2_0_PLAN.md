# ExamForge — Project Roadmap 2.0

**Status:** Approved working roadmap  
**Project:** ExamForge  
**Repository:** `klonz484/examforge`  
**Roadmap branch:** `foundation/examforge-foundation-2`  
**Last updated:** 7 November 2026

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

**Finish Phase 0, then implement Phase 1 on `foundation/examforge-foundation-2`.**

The next engineering session should:
1. Refresh the current repository state: `main`, this branch, old feature branch, open PRs, and latest workflow runs.
2. Compare the old subject feature branch with current `main`.
3. Identify the smallest safe set of catalogue, onboarding, persistence, dashboard, and test changes to port.
4. Fix known test selector ambiguity and any newly discovered failures.
5. Implement and verify Phase 1 incrementally, keeping all production systems untouched.
6. Report exactly what changed, what passed, what remains, and the next concrete action.

**Do not start Phase 2 by pretending sample questions are production-ready.** First finish the learner foundation, then build the complete learning loop using properly sourced and labelled content.


## 10. Roadmap progress log — 7 November 2026

### Phase 0 — Foundation stabilisation: COMPLETE (foundation branch only)

Verified exit evidence:
- Foundation branch is based on the latest reviewed `main` baseline `259df190812ad9d47405d3402b90998fafbd2fc3`; comparison reports 27 commits ahead and 0 behind.
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
