# ExamForge launch operations runbook

**Status:** Release preparation only. No production deployment is authorised by this runbook.

## Release gate

A release owner must confirm every item before any merge or deployment:

- [ ] Product owner approves the exact commit and PR.
- [ ] Foundation workflow and shared UI workflow pass on the exact commit to release.
- [ ] Database migrations have been reviewed for additive/backward-compatible behaviour and rehearsed on disposable Supabase.
- [ ] Hosted database and Storage backups are available; a restore drill has been completed and signed off.
- [ ] RLS, Storage, Auth, Edge Function and dependency security review is complete.
- [ ] Physical Android Chrome/TalkBack and keyboard/screen-reader checks are recorded.
- [ ] Privacy notice, consent, retention/deletion and learner/minor requirements have qualified South African privacy/legal sign-off.
- [ ] DBE content provenance, licences and question correctness have been reviewed.
- [ ] AI/OCR remains disabled unless the owner separately approves vendor, privacy, DPA, retention, region, hard spend limit and test plan.
- [ ] Monitoring, alerting, support contact, incident response and rollback owner are assigned.
- [ ] Release notes and known limitations are ready.

## Deployment sequence (only after explicit approval)

1. Freeze the candidate commit and verify PR checks on that exact SHA.
2. Confirm a current database and Storage backup; record backup time and restore point.
3. Review and apply only approved additive migrations through the documented deployment path.
4. Deploy the approved frontend and Edge Functions; configure only approved secrets through the platform secret manager.
5. Run smoke checks for sign-in, onboarding, subject selection, Tonight's 20, answer persistence, progress, notes and offline reload.
6. Check error rates, auth/storage errors and application health during the agreed observation window.
7. Record release SHA, migration version, deployment time, operator and verification results.

## Incident response

| Severity | Example | Initial response |
|---|---|---|
| Critical | Cross-account data exposure, RLS bypass, leaked service key, destructive data loss | Stop affected feature/traffic, disable AI provider, preserve logs, notify the owner immediately, rotate/revoke exposed credentials and begin incident/legal assessment |
| High | Sign-in failure, widespread session loss, Storage access failure, failed migration | Pause further rollout, capture errors and affected version, use the approved rollback/recovery plan |
| Medium | One subject/topic broken, repeated UI error, offline sync backlog | Record reproduction, protect learner work, disable only the affected feature if needed, ship a tested fix |
| Low | Copy/layout defect with safe workaround | Log and schedule a reviewable fix |

Do not delete logs or learner records during incident triage. Do not send learner content to an unapproved third party while diagnosing.

## Rollback and recovery

- Frontend rollback: revert the deployed Pages source to the last known-good approved commit using the repository's documented release process. Verify the previous app still works with the current database schema.
- Database rollback: prefer a forward corrective migration. Do not blindly drop columns/tables or run destructive down migrations after learner data exists.
- If database restoration is necessary, restore to a new isolated project first, validate Auth/RLS/Storage/Edge Functions, and obtain explicit owner approval before any cutover. See `docs/BACKUP_RESTORE_RUNBOOK.md`.
- Re-enable a disabled AI/OCR feature only after the owner-approved gate is revalidated; never use a provider fallback silently.
- Record incident timeline, affected versions/data, recovery point, user impact, root cause and preventive tests.

## Current operational gaps

Monitoring/alerting provider, support/privacy contact, RPO/RTO, incident owner, release owner, status page and legal sign-off are not configured. These are owner decisions and must not be invented by CI.
