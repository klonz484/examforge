# Foundation 2.0 — Branch Reconciliation Audit

**Date:** 7 November 2026  
**Repository:** `klonz484/examforge`  
**Working branch:** `foundation/examforge-foundation-2`  
**Purpose:** Record the actual repository baseline and risks before porting the earlier subject-catalogue implementation.

## 1. Verified repository baseline

- Production `main` is at `259df190812ad9d47405d3402b90998fafbd2fc3`.
- `main` includes merged PR #2, adopting shared accessible UI components.
- The shared UI verification workflow on the latest main commit completed successfully: run [42354496623](https://github.com/klonz484/examforge/actions/runs/42354496623).
- The GitHub Pages deployment workflow on the latest main commit completed successfully: run [42354496490](https://github.com/klonz484/examforge/actions/runs/42354496490).
- The package lockfile was synchronised in the shared UI PR history; the current main verification workflow uses `npm ci`.
- PR #1, “Add reuse-first engineering and contribution workflow”, was still open at audit time. Its current checks and review status must be checked before any merge decision.
- The foundation branch is based directly on current `main`, with no commits behind it. It contains the roadmap documentation and this isolated verification workflow; no subject feature implementation is yet confirmed as ported.
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
