# ExamForge backup and restore runbook

**Status:** Disposable restore drill is automated in CI. No hosted/live Supabase backup or restore has been performed.  
**Safety:** Never test restoration by overwriting the connected live project. Use a separate, owner-approved destination.

## What must be backed up

1. Postgres database: schemas, tables, rows, indexes, functions, triggers, policies and migration history.
2. Supabase Storage objects: the `student-notes` bucket and any future buckets.
3. Configuration needed to rebuild the service: Edge Function source/version, Auth redirect/provider settings, bucket settings, extensions, Realtime settings and environment-secret *names* (never secret values in this repository).
4. Operational records: current migration commit, deployed app commit, restore date, project region and approved recovery objectives.

**Important Supabase boundary:** Database backups do not include Storage API objects. A database restore alone does not recover uploaded notes or other stored files. Restore Storage objects separately and verify their owner paths and bucket policies. See the official [Supabase Database Backups guide](https://supabase.com/docs/guides/platform/backups) and [Restore to a New Project guide](https://supabase.com/docs/guides/platform/clone-project).

## Before release: owner checklist

- [ ] Confirm the connected project's Supabase plan. Daily automated backups are plan-dependent; Free projects should not be assumed to have dashboard daily backups.
- [ ] Confirm the project's region and the available backup retention window in Database → Backups.
- [ ] Decide and document recovery point objective (RPO) and recovery time objective (RTO). Do not assume a target without owner approval.
- [ ] Decide whether PITR is necessary and review its additional cost before enabling it.
- [ ] Confirm a separate, access-controlled destination for database dumps and Storage objects.
- [ ] Define who may initiate restoration and who approves a production cutover.
- [ ] Record the exact migration commit and Edge Function versions for the release.

## Safe hosted restore drill

1. Obtain explicit owner approval for the restore target and any costs. A Supabase "Restore to a New Project" operation is a separate project and may incur plan/compute costs; do not initiate it without approval.
2. Select a backup from before the chosen test point. Restore to a **new isolated project**, never over the live source.
3. Record the new project's region, database version, restore point and completion time.
4. Restore Storage bucket configuration and objects separately. Verify checksums/counts and confirm private access rules.
5. Reapply/review Edge Functions, Auth redirect URLs/provider settings, Realtime configuration, extensions and secrets in the new project. Secret values must be entered through the dashboard/secret manager, never committed.
6. Verify schema and migration history, row counts, indexes, RLS enabled state and policy definitions.
7. Run authenticated two-account tests: each account sees only its own profile, subjects, sessions, attempts, notes, files, review schedule and AI usage.
8. Smoke-test sign-in, session recovery, note download/extraction, offline sync and the main Tonight's 20 journey.
9. Record actual RPO/RTO, issues and sign-off. Keep the source project untouched.

## Local/disposable restore drill

The foundation CI workflow uses a disposable PostgreSQL 16 database. It runs `pg_dump` in custom format, restores into a separate disposable database, then verifies required tables, RLS state and policies. This is a repeatable schema/permission restore check, **not** proof that hosted Supabase Auth, Storage objects, secrets, Edge Functions or a live project can be restored.

## Recovery cautions

- Supabase's database backup does not include Storage objects; maintain a separate object backup.
- Restoring to a new project requires manual review/reconfiguration of Storage objects/settings, Edge Functions, Auth settings/API keys, Realtime and extensions. Consult the current official Supabase restore guide before the drill.
- Restoring an older database over a live project can discard newer transactions. Do not do it as a test.
- Do not put database dumps, learner files, passwords, service-role keys or provider credentials in GitHub.
- After any approved restore, rotate/review credentials and verify RLS before reconnecting the app.
