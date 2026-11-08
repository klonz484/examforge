# ExamForge — Public Launch Readiness Audit

**Status:** Engineering preparation only. Not a launch approval.

## Evidence available in the foundation branch

- React/TypeScript production build is part of the isolated verification workflow.
- Browser verification covers Chromium, Firefox and WebKit.
- Responsive learner flows, keyboard theme toggle, session recovery, question feedback, review tools and curriculum discovery have automated browser coverage.
- Database migrations for learner subjects, recoverable sessions, spaced repetition and AI usage have disposable PostgreSQL tests.
- CI starts a disposable local Supabase project to apply migrations, provision test accounts and run authenticated browser tests.
- No production deployment step exists in the foundation verification workflow.

## Required before public release

| Area | Required validation | Current state |
|---|---|---|
| Accessibility | Full keyboard and focus review, axe checks, NVDA/VoiceOver/TalkBack and physical Android screen-reader testing, text scaling and contrast | Automated and some keyboard checks exist; physical Android screen-reader test remains manual |
| POPIA/privacy | Data inventory, lawful basis, guardian/minor considerations, privacy notice, consent, retention/deletion, subject access and vendor processor review | Not legally reviewed or signed off |
| Security | Auth/session, RLS, storage path isolation, file validation, Edge Function auth, abuse/rate limits, dependency and penetration review | SQL RLS and local auth tests exist; independent security review/penetration test not done |
| Backups | Configure hosted Supabase backup/PITR appropriate to plan, document recovery point/time objectives, perform real restore drill | No hosted backup policy or restore drill performed |
| Reliability | Error monitoring, alerting, incident response, support process, status communications and rollback procedure | Operational service configuration not completed |
| Offline/PWA | Installability, cache policy, offline study, sync conflict policy, queue recovery and Android browser coverage under poor connectivity | Basic PWA/local session recovery exists; comprehensive offline/conflict tests incomplete |
| Performance | Real Android low/mid-range device, cold start, bundle, route and constrained-network testing | CI build only; field performance audit not completed |
| Content | Current DBE source verification, question correctness review, paper link checks, content licensing/provenance and curriculum coverage | Selected Grade 10–12 Math/Physical Sciences topic maps and archive index links; content coverage is partial |
| AI | Provider due diligence, DPIA, secrets, quotas, spend controls, Edge Function deploy and quality evaluation | Secure server-side scaffold and CI quota tests; provider disabled, OCR not implemented |
| Release | PR review, migration rehearsal, backup confirmation, staging smoke test, production approval and post-deploy checks | PR remains open/unmerged; production untouched |

## Hard release boundaries

- Do not merge the foundation PR, migrate the connected live Supabase project, deploy GitHub Pages, publish packages or incur provider costs without explicit approval.
- Do not claim DBE endorsement or certification.
- Do not describe catalogue presence as complete study content.
- Do not present automated axe/browser checks as a substitute for manual assistive-technology testing.
- Do not enable AI provider calls until vendor/privacy/cost checks and owner configuration are complete.
