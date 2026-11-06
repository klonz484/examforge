# Unlimited learner subject selection

## Approved product behavior

- Learners may select every subject they study; ExamForge does not impose the NSC school-registration package limit.
- Grade filters help discovery, but CAPS-index-only offerings remain discoverable and visibly marked as needing school/curriculum confirmation.
- A learner chooses a starting subject during onboarding and can change the active subject from the dashboard at any time.
- Recommendations are suggestions, not forced rotations.
- The seven dashboard subject cards remain a presentation layout decision and do not cap the underlying learner subject library.

## Data compatibility

- `profiles.primary_subject` remains the legacy active/primary subject field.
- Existing `Physical Science` and `Mathematics` values are preserved.
- Migration `002_learner_subjects.sql` creates a separate `learner_subjects` relation with a unique `(user_id, subject_id)` key.
- Existing profile subjects are backfilled before new subject selections are written.
- RLS policies scope select, insert, update and delete to `auth.uid() = user_id`.
- The migration removes only the old two-value check constraint on `profiles.primary_subject`; it does not rename or delete the column or any existing profile rows.

## Question-bank guard

At this milestone, only Mathematics and Physical Science have seed question banks. Selecting another subject is allowed and persists as a learner subject, but the Rewind action is intentionally disabled for that subject with a clear message. ExamForge must not silently serve Physical Science questions as another subject's practice.

## Verification and rollout

- Feature CI runs the production build, catalogue integrity checks, migration safety assertions, and mobile browser tests.
- Supabase integration tests additionally verify that multiple subjects persist for one account and are invisible/immutable to another account.
- The SQL migration is committed but has **not** been applied to the connected Supabase project.
- Do not merge to `main` or deploy until the migration has been reviewed and applied in the intended Supabase environment and the Supabase integration tests pass.
