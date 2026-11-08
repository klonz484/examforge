# Foundation 2.0 — Branch Reconciliation Audit

**Date:** 8 November 2026  
**Repository:** `klonz484/examforge`  
**Working branch:** `foundation/examforge-foundation-2`  
**Purpose:** Record the actual repository baseline and risks before porting the earlier subject-catalogue implementation.

## 1. Verified repository baseline

- Production `main` is at `259df190812ad9d47405d3402b90998fafbd2fc3`.
- `main` includes merged PR #2, adopting shared accessible UI components.
- The shared UI verification workflow on the latest main commit completed successfully: run [42354496623](https://github.com/klonz484/examforge/actions/runs/42354496623).
- The GitHub Pages deployment workflow on the latest main commit completed successfully: run [42354496490](https://github.com/klonz484/examforge/actions/runs/42354496490).
- The package lockfile was synchronised in the shared UI PR history; the current main verification workflow uses `npm ci`.
- PR #1, “Add reuse-first engineering and contribution workflow”, remains open and unmerged as of 8 November 2026. It is separate from PR #3 and was not changed in this run.
- The foundation branch remains based on main commit `259df190812ad9d47405d3402b90998fafbd2fc3`; the current comparison is 213 commits ahead and 0 behind. Current head is `6709e144d0b2be3c0e68f2063b4e6bcc6f52b3ee`. The branch now contains the Phase 0–5 implementation; Phases 0–4 are complete on this branch and Phase 5 remains gated for provider/OCR approval.
- The old `feat/verified-seven-subject-package` branch is substantially diverged: 50 commits ahead and 42 behind `main`. It must not be merged wholesale.

## 2. Verification workflow added

Added `.github/workflows/verify-foundation.yml` on this branch.

It:
- Runs on pushes to `foundation/**`, relevant pull requests targeting `main`, and manual dispatch.
- Uses Node 22 and locked dependency installation (`npm ci`).
- Runs the TypeScript/production build.
- Installs Chromium, Firefox, and WebKit and runs the Playwright suite.
- Uses read-only repository permissions.
- Does not deploy to GitHub Pages or modify Supabase.

Initial run: [42389573231](https://github.com/klonz484/examforge/actions/runs/42389573231). It was queued/in progress at the time of this audit; do not treat it as passed until its final conclusion is successful.

## 3. Candidate work found on the old subject branch

The old branch contains useful, selectively reusable work:
- `src/data/capsSubjects.ts`: stable subject IDs, language levels, specialist/pathway representation, grade-aware ATP status and aliases.
- `src/App.tsx`: unlimited subject selection, a learner subject list, daily subject selector, and a failed-save message rather than a false success state.
- `supabase/migrations/002_learner_subjects.sql`: a learner-subject relation with RLS policies and legacy profile backfill.
- Catalogue, browser, and migration-related tests.
- DBE source-verification and implementation notes.

The old branch also contains demo/sample question and paper content. These must not be promoted as verified curriculum content.

## 4. Risks requiring correction or explicit design before porting

### 4.1 Profile migration and compatibility
The candidate migration drops `profiles_primary_subject_check`. This may be necessary if `profiles.primary_subject` is to store any selected subject, but it is a schema-contract change and must not be accepted casually. First inspect the actual constraint definition and every code path that reads/writes `primary_subject`. Prefer keeping the legacy column's established meaning and storing the full learner library in `learner_subjects`; if the product requires a different primary-subject contract, document and test the exact replacement constraint before migration.

### 4.2 Non-atomic onboarding writes
The candidate client code writes the profile first, then upserts learner subjects, then reads and deletes stale rows. These are separate requests, not one database transaction. It correctly avoids showing success when subject sync fails, but a partial profile save can remain. Evaluate a transactional database function or another safe reconciliation design; never claim atomicity unless implemented and tested.

### 4.3 RLS verification is not yet sufficient
The candidate migration test checks SQL text for policy fragments. That is useful static validation, but it does not prove PostgreSQL enforces account isolation. Add real integration tests against a disposable/staging Supabase database for select, insert, update, and delete across two test accounts. Never run these destructive tests against production learner data.

### 4.4 Dashboard requirement needs direct implementation proof
The onboarding catalogue and selected-subject chips are not proof that the dashboard has exactly seven permanent subject-card positions plus an expandable **All subjects** area. Verify the actual dashboard markup and add focused mobile/keyboard/accessibility tests for this requirement before calling it complete.

### 4.5 Subject support and content integrity
The catalogue's status distinctions are valuable and should be retained. However, an ATP listing or CAPS index entry is not a complete learning course. Preserve the distinction between catalogue discovery, grade-specific curriculum evidence, and actual available question/lesson content.

### 4.6 Test baseline
A previous old-branch run passed 13 of 14 tests; the remaining test failure was an ambiguous Playwright selector matching both a selected-subject removal chip and a catalogue item. Scope selectors to the catalogue region or use exact accessible names. The old branch's historical green runs do not establish that its current head is green.

## 5. Safe selective-port sequence

1. Complete the new foundation workflow run and fix any baseline failures on this branch.
2. Inspect the exact production profile constraint, schema, RLS, and current onboarding/profile sync implementation.
3. Port the CAPS catalogue as a self-contained change, preserving stable IDs and explicit catalogue statuses; run unit/catalogue tests.
4. Port the onboarding subject selection separately, adapting it to the shared UI components on `main`.
5. Implement the dashboard's seven fixed positions and expandable **All subjects** area with responsive and accessibility tests.
6. Design and review learner-subject persistence and migration, including legacy backfill, transactional behaviour, and real two-account RLS tests.
7. Verify daily subject switching and reload/sign-in persistence.
8. Open a focused pull request with test evidence, migration review, rollback notes, and limitations.

## 6. Production protection

This audit and workflow change only the feature branch. No production database migration, merge to `main`, or deployment is authorised by this work. Those remain separate release decisions requiring successful checks and explicit approval.


## 7. Selective catalogue port — 7 November 2026

The first isolated product-code port is now committed on this branch:

- `src/data/capsSubjects.ts` now carries the richer catalogue metadata from the reviewed earlier branch: `atp-listed`, `specialist-atp`, `caps-index-only`, and `pathway-parent`.
- Grade filtering returns only offerings with a grade-specific ATP listing; CAPS-index-only entries remain searchable without falsely claiming grade availability.
- Language level and specialist SASL offerings are represented explicitly.
- Technical Technology and Music umbrella subjects are separated from their child pathways.
- Legacy Mathematics and Physical Science IDs/names remain available for compatibility.
- Added `tests/e2e/capsSubjects.spec.ts` to cover unique/stable IDs, grade filtering, index-only discoverability, specialist language metadata, pathway grouping, category grouping, and search aliases.

This is catalogue metadata and test coverage only. It does not yet wire the catalogue into onboarding or the dashboard, and it does not create learner-subject database records.

Verification run for this port: [42390251372](https://github.com/klonz484/examforge/actions/runs/42390251372). The workflow was still running at the time this note was added; its result must be checked before treating the catalogue port as verified.


## 8. Phase 0 exit review — 7 November 2026

Phase 0 (Foundation stabilisation) has met its documented exit criteria on the foundation branch. Evidence:

- Branch comparison against main: foundation/examforge-foundation-2 is currently 213 commits ahead and 0 behind; merge base remains production baseline `259df190812ad9d47405d3402b90998fafbd2fc3`. No production merge was performed.
- Latest head: `2839d012901713f5a87471e81b1c66a06129fce6` (`test: clear existing topic selections safely`).
- Full isolated verification: [run 42393214592](https://github.com/klonz484/examforge/actions/runs/42393214592) completed successfully. Locked dependency installation (`npm ci`), TypeScript/production build, Playwright browser installation (Chromium, Firefox, WebKit), and the complete browser/integration suite all passed.
- The four selector/setup failures in earlier run 42392328332 were corrected through focused test commits; the later complete run above is the evidence used for this exit review.
- Shared UI tests remain part of the full passing Playwright suite.
- `.github/workflows/verify-foundation.yml` is read-only, has no Pages deployment step, and does not apply Supabase migrations. It runs separately from production deployment.
- Selective-port and integration plan is documented in section 5 above. The heavily diverged legacy feature branch remains excluded from wholesale merge.
- Open PR #1 (reuse-first contribution workflow) remains separate and unmerged; no action on it is required to complete this foundation-branch baseline. Review/merge decisions remain separate from this work.

**Phase 0 status: COMPLETE on the foundation branch.** This does not mean the feature branch is merged or deployed. Manual accessibility validation, staging database/RLS tests, and production release checks remain assigned to later phases and their explicit exit criteria.


## 9. Phase 1 completion evidence — 8 November 2026

Phase 1 has met its automated exit criteria on `foundation/examforge-foundation-2`; this is not production release approval.

- Implementation is proposed in [PR #3](https://github.com/klonz484/examforge/pull/3), still open and unmerged.
- Successful full verification: [run 42445416667](https://github.com/klonz484/examforge/actions/runs/42445416667), head `ef4894e181fa1215e6df95e77118629fb2807f29`.
- Disposable PostgreSQL 16 migration/RLS integration step passed.
- TypeScript and production build passed.
- Playwright suite passed **54 tests** with **4 skipped**. Skips are guarded tests requiring explicitly configured disposable Supabase staging credentials; no live Supabase credentials or data were used.
- Verified deliverables include the CAPS catalogue/status distinctions, unlimited onboarding subject selection, seven fixed dashboard slots and expandable All subjects, unrestricted daily selection, additive learner-subject schema/backfill/RLS/transactional RPC, account-scoped persistence and guest-to-new-account handling, and theme keyboard/reload coverage.
- Manual physical Android screen-reader/assistive-technology audit remains for Phase 6.
- The migration is not applied to live Supabase. No production merge or Pages deployment occurred.

**Phase 1: COMPLETE on the foundation branch only.** Proceed with Phase 2 on a later run; retain PR #3 open for review and do not merge without explicit approval.


## 10. Phase 2 implementation and verification — 8 November 2026

Phase 2 implementation has been delivered on the foundation branch. The final exit gate remains open because the guarded cloud-auth round-trip test was skipped without a disposable Supabase staging environment.

- Question bank: stable Grade 12 Mathematics/Physical Sciences IDs; topic, grade, subject, correct answer, explanation and explicit original-practice provenance; not represented as official DBE content.
- Learning loop: 20-minute focus target, question selection, marking, explanations, session summary, save/exit, resume after reload, and abandon.
- Persistence: additive `003_recoverable_study_sessions.sql`; account-owned sessions; atomic answer/attempt RPC; idempotent session-position answer writes; completion RPC; RLS and cross-account isolation.
- Progress: saved attempts feed accuracy and a persistent mistake notebook; accuracy is not called mastery.
- Subject integrity: unsupported subject selections do not fall back to another subject's questions.
- Guest state: setup, sessions and attempts restore after reload.

**Evidence:** [verification run 42447976494](https://github.com/klonz484/examforge/actions/runs/42447976494), head `ad8e3470667a975adea413251cc4c57969b803dc`. Both disposable PostgreSQL 16 SQL suites passed; TypeScript/build passed; Playwright passed **63** with **7 skipped** across Chromium, Firefox and WebKit.

**Historical gate closure:** The earlier run above skipped the guarded cloud-auth tests. This was later resolved without creating a Supabase preview branch or touching live Supabase.

- [Foundation verification run #332](https://github.com/klonz484/examforge/actions/runs/42505206691) passed on head 072b20d4644742a4ec0dd2157ef8b4a58f40ad87.
- CI created disposable local Supabase containers, applied migrations, created three local accounts, served Edge Functions without provider secrets, and ran authenticated browser/integration tests.
- The sign-out/sign-in session recovery and offline answer-queue sync checks executed; Playwright reported **108 passed, 0 skipped**.
- No real learner data or connected live Supabase project was used.

**Phase 2: COMPLETE on the foundation branch only.** PR #3 remains open and unmerged; no production migration, merge or deployment occurred.

**Content boundary:** Grade 12 Mathematics and Physical Sciences only are currently populated. Questions are original ExamForge practice, not official DBE questions. Broader grade/subject coverage and official paper ingestion remain later roadmap work.

No live Supabase migration, main merge or Pages deployment occurred. PR #3 remains open.

## 11. Phase 3 and Phase 4 exit evidence — 8 November 2026

### Phase 3 — Curriculum and exam library: COMPLETE on the foundation branch

- Six DBE-sourced grade/subject roadmaps cover Grade 10–12 Mathematics and Physical Sciences. ATP source and catalogue status distinctions are retained.
- Eight official DBE archive-index entries cover Mathematics and Physical Sciences for November 2024, May/June 2025, November 2025 and May/June 2026. The cards label year/source and link to the DBE index pages; individual PDFs remain hosted by DBE.
- Original topic practice sets exist for all six grade/subject combinations with stable IDs, answer keys, explanations and explicit ExamForge provenance.
- Mistake notebook search, correction cards and persisted spaced-repetition scheduling are implemented.
- Unsupported catalogue-only subjects are not presented as complete courses.
- Curriculum/practice/spaced-review tests passed in [run #332](https://github.com/klonz484/examforge/actions/runs/42505206691). DBE ATP/archive index pages were checked on 8 November 2026.

### Phase 4 — Progress intelligence: COMPLETE on the foundation branch

- Topic accuracy, trends and next-focus recommendations derive from saved attempts and session records with subject/grade/question context.
- Empty/small samples are shown as insufficient evidence; accuracy is not described as mastery; learner recommendations remain optional and overridable.
- The disposable local Supabase E2E test saved an attempt, read it back under the same learner, checked expected small-sample output and confirmed another account could not read it.
- Progress unit/browser/integration tests passed in [run #332](https://github.com/klonz484/examforge/actions/runs/42505206691).

## 12. Phase 5 implementation and approval boundary — 8 November 2026

**Provider-independent work delivered**
- Private note storage and owner/path/file validation.
- Selectable-text PDF extraction using unpdf, with size/page/time/text bounds.
- Scanned PDFs and image uploads are marked low-confidence; no external OCR service is called.
- Extraction metadata records quality and confidence status; numeric confidence remains null because no calibrated score is available.
- AI question drafts are server-side, evidence-checked, provenance-labelled and pending human review.
- Subject/grade/topic metadata is allowlisted to the actual Grade 10–12 Mathematics and Physical Sciences starter practice map.
- Atomic five-per-day request quota and usage-accounting/RLS tests pass.
- The UI feature flag defaults to disabled; the Edge Function returns a safe disabled response when provider secrets are absent.

**Verification:** [Foundation run #351](https://github.com/klonz484/examforge/actions/runs/42506065508) passed on head 6709e144d0b2be3c0e68f2063b4e6bcc6f52b3ee: **114 passed, 0 skipped**. This includes private PDF extraction, scanned/image low-confidence paths, account isolation, provider-disabled handling, metadata allowlist checks and the disabled UI. Shared UI check [run #184](https://github.com/klonz484/examforge/actions/runs/42506065474) passed.

**Still blocked:** OCR for images/scanned PDFs, automatic classification of arbitrary extracted text, and AI provider activation. The owner must approve privacy/POPIA, vendor/data-processing terms, retention/region/subprocessors, hard spend limits and monitoring before any provider secrets or OCR service are configured. No provider call or cost has occurred.

**Phase 5 status: PARTIAL — owner approval gate open.**

## 13. Phase 6 launch-readiness boundary

Manual physical Android accessibility/screen-reader testing, POPIA/legal review, independent security/penetration review, hosted backup/restore drill, full offline/conflict testing, target-device performance, monitoring/support/incident/rollback operations and final content licensing review remain incomplete.

These require owner/legal/device access or approved live-service configuration. Do not merge PR #3, apply live migrations, deploy Pages, configure production secrets or incur provider costs without separate explicit approval. PR #3 remains draft, open and unmerged.

