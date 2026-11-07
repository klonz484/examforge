# ExamForge Foundation 2.0

## Purpose

Consolidate the application foundation before expanding learning content and AI capabilities. This work is additive and must not alter the live production database or deploy to GitHub Pages until its acceptance checks pass.

## Protected product decisions

- Tonight's 20 remains the primary dashboard action.
- Preserve exactly seven permanent subject-card positions on the dashboard.
- Add an expandable **All subjects** area that exposes the learner's complete subject library without a seven-subject cap.
- The seven positions are a presentation choice, not a registration or study limit.
- Learners may choose any enrolled subject for any daily session. Recommendations are optional and never lock subject choice.
- Keep the dark theme as the default and preserve the accessible shared UI components already merged to `main`.

## Branch and integration strategy

- Start from the current `main` commit.
- Do not merge the diverged `feat/verified-seven-subject-package` branch wholesale.
- Port the CAPS catalogue, multi-subject onboarding, learner-subject persistence, and tests as reviewed changes.
- Preserve the shared UI adoption and its consumer tests.
- Keep production `main`, GitHub Pages, and the live Supabase project unchanged until verification and explicit release approval.

## Work sequence

1. **Repository baseline:** record the current production commit, inspect dependency/lockfile consistency, CI workflows, UI library adoption, and outstanding pull requests.
2. **Subject system integration:** reconcile the CAPS catalogue and onboarding implementation with the current shared UI. Keep legacy Mathematics and Physical Sciences profile data readable.
3. **Dashboard library presentation:** show up to seven permanent subject cards, with a clear expandable All subjects section for every additional enrolled subject. Ensure keyboard, screen-reader, and mobile behaviour.
4. **Persistence and security:** validate learner-subject reads/writes, legacy profile compatibility, per-user isolation, failed-save handling, and daily subject switching.
5. **Progress data integrity:** document and test which progress values are local/demo versus server-backed. Do not present demo mastery as verified learner progress.
6. **Verification:** run production build, unit/catalogue tests, browser tests, Supabase integration tests, RLS isolation tests, and migration tests against a disposable/staging database.
7. **Release review:** prepare a pull request with evidence, rollback notes, and outstanding limitations. Do not merge or deploy automatically.

## Acceptance criteria

- The development branch is based on the latest `main`.
- Shared accessible UI components and their tests remain intact.
- Existing learners retain their current profile and study history.
- A learner can enrol in any number of supported/discoverable subjects; catalogue status clearly distinguishes verified grade availability from index-only listings.
- Dashboard keeps seven stable subject-card positions and exposes the complete library through expandable All subjects.
- Any enrolled subject can be selected for today's session without forced rotation or lockout.
- Subject choices persist across reload and sign-in.
- A learner cannot read, insert, update, or delete another learner's subject rows.
- Failed profile or subject saves never produce a success state.
- Database migration is tested outside production before application.
- All required checks pass before merge; production deployment remains a separate release decision.

## Known boundaries at start

The production README currently identifies demo/sample question and paper content, demo mastery values, incomplete AI/OCR processing, incomplete offline sync, and outstanding privacy, POPIA, backup, monitoring, and accessibility work. Foundation 2.0 must preserve these disclosures and must not imply that catalogue inclusion means a complete course or verified learning content exists.
