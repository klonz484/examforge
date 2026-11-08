# ExamForge — Public Launch Readiness Audit

**Status:** Engineering preparation only. Not a launch approval. Current verification applies to the isolated foundation branch, not production.

## Current development evidence

- Foundation branch is based on production main baseline 259df190812ad9d47405d3402b90998fafbd2fc3 and remains unmerged.
- [Foundation run #332](https://github.com/klonz484/examforge/actions/runs/42505206691) passed with 108 tests and no skips. It used disposable local Supabase containers, local test accounts and local Edge Functions; authenticated session recovery and offline answer sync executed.
- [Foundation run #351](https://github.com/klonz484/examforge/actions/runs/42506065508) passed with 114 tests and no skips. It includes private PDF extraction, low-confidence scanned/image handling, metadata allowlisting, AI-provider-disabled behaviour and the disabled learner UI.
- The shared UI adoption check [run #184](https://github.com/klonz484/examforge/actions/runs/42506065474) passed.
- Disposable PostgreSQL tests cover learner-subject RLS, recoverable sessions/answer writes, flashcard scheduling and AI quota accounting.
- Browser checks run across Chromium, Firefox and WebKit. Automated semantic/keyboard coverage does not replace physical-device assistive-technology testing.
- No production deployment step exists in the foundation verification workflow.

## Required before public release

| Area | Required validation | Current state |
|---|---|---|
| Accessibility | Full keyboard/focus review, screen-reader and TalkBack, contrast, reduced motion, text scaling and physical Android assistive-technology testing | Automated browser and some keyboard checks exist; physical Android testing remains manual |
| POPIA/privacy | Data inventory, lawful basis, learner/minor and guardian considerations, privacy notice, consent, retention/deletion, access requests and vendor processor review | Not legally reviewed or signed off |
| Security | Auth/session, RLS, storage path isolation, file validation, Edge Function auth, abuse/rate limits, dependency and penetration review | Disposable SQL/RLS, two-account, storage and local Edge Function tests pass; independent security/penetration review remains |
| Backups | Hosted Supabase backup/PITR configuration, recovery point/time objectives and real restore drill | No hosted backup policy or restore drill performed |
| Reliability | Error monitoring, alerting, incident response, support process, status communications and rollback procedure | Operational service configuration not completed |
| Offline/PWA | Installability, cache policy, offline study, sync conflicts, queue recovery and Android browser testing under poor connectivity | Local session recovery and offline answer-queue sync pass; broader conflict/constrained-network testing remains |
| Performance | Real low/mid-range Android device, cold start, bundle, route and constrained-network checks | CI build only; field performance audit not completed |
| Content | Current DBE source verification, question correctness review, paper link checks, licensing/provenance and curriculum coverage | Grade 10–12 Mathematics/Physical Sciences maps and practice sets; eight DBE archive-index links checked. Links open official index pages, not re-hosted direct PDFs. Broader subject coverage and independent content review remain |
| AI | Provider due diligence, DPIA, secrets, OCR vendor, quotas, spend controls, Edge Function deployment and quality evaluation | Selectable-text PDF extraction; private Tesseract worker and mocked AI validation added on a non-production branch. CI must prove OCR stays disabled and AI endpoint returns 503 without credentials. Real provider quality, legal/vendor review and spend monitoring remain unverified |
| Release | PR review, migration rehearsal, backup confirmation, staging smoke test, production approval and post-deploy checks | PR #3 remains draft/open/unmerged; no production merge, live migration or Pages deployment |

## AI-specific activation gate

Before enabling AI or OCR, the project owner must approve the provider/vendor, data-processing terms, retention, processing region, subprocessors, POPIA/privacy assessment, hard spend limits and operational monitoring. The frontend flag VITE_AI_STUDY_ENABLED remains false and Edge Function provider secrets remain absent. The current metadata allowlist validates learner-selected topic context; automatic classification of arbitrary extracted text is not active.

## Hard release boundaries

- Do not merge the foundation PR, migrate the connected live Supabase project, deploy GitHub Pages, publish packages, configure production secrets or incur provider costs without explicit approval.
- Do not create a temporary Supabase preview branch or use real student data for verification.
- Do not claim DBE endorsement or certification.
- Do not describe catalogue presence as complete study content.
- Do not present automated axe/browser checks as a substitute for manual assistive-technology testing.
- Do not enable AI/OCR until the owner completes privacy, vendor and cost approval and the non-production integration is verified.
