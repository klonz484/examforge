# ExamForge privacy and data inventory

**Status:** Technical inventory for owner/legal review. This is not a privacy notice, legal opinion, POPIA compliance certificate or consent record.

**Last reviewed:** 8 November 2026  
**Scope:** Current foundation-branch implementation. Verify against the deployed Supabase project before release.

## Data categories currently represented in the application

| Data category | Examples/fields | Purpose | Storage/location |
|---|---|---|---|
| Account identity | Supabase Auth user ID, email and authentication metadata | Sign-in, account ownership and recovery | Supabase Auth |
| Learner profile | Grade, exam date, legacy primary subject, weak-topic selections and preferences | Personalise study planning and preserve learner setup | `profiles` table; account-scoped browser state for offline/guest use |
| Subject enrolment | Stable subject IDs selected by the learner | Build the learner's subject library and restrict study content | `learner_subjects` table |
| Study sessions | Subject, state, timestamps, duration, score, question count and recoverable session state | Resume and record Tonight's 20 | `study_sessions` table |
| Question attempts | Stable question ID, topic, selected response, correctness, grade/subject context and attempt time | Accuracy, progress trends and mistake review | `question_attempts` table |
| Review scheduling | Question ID, next-review time, interval, repetitions and last grade | Spaced repetition | `flashcard_reviews` table |
| Uploaded notes | Original filename, MIME type, size, storage path, processing status, extraction metadata and extracted text | Private learner note storage and selectable-text PDF extraction | `note_uploads` table and private `student-notes` Storage bucket |
| AI draft records | Draft prompt/options, answer, explanation, evidence, provenance and learner review status | Private draft review only; not automatically added to Tonight's 20 | `generated_questions` table |
| AI usage counters | Request count and input/output character counts per learner/day | Quota and abuse/cost controls | `ai_usage_daily` table |
| Local/offline state | Guest setup, selected subjects, active session/answers, pending offline sync and display preferences | Continue study when disconnected and restore browser state | Browser storage, scoped by learner where an account is known |

## Data flow and third parties

- Supabase provides authentication, Postgres data, private object storage and Edge Function execution for the configured project.
- The DBE is linked as the source host for official paper/memo archive indexes. ExamForge does not re-host those DBE PDFs.
- No AI provider or OCR vendor is configured. The server-side `AI_STUDY_ENABLED` kill switch remains false; the browser flag `VITE_AI_STUDY_ENABLED` also defaults false. No paid AI/OCR request is made by the current CI workflow.
- Text-based PDF extraction runs in the authenticated Supabase Edge Function. Scanned PDFs and image uploads remain private and are marked as requiring OCR; no external OCR service is called.
- The current dependency manifest contains no advertising or analytics SDK. Re-check dependencies and any future integrations before release.

## Technical controls present in the foundation branch

- Row-level security and owner policies for learner-owned rows, with disposable two-/three-account tests.
- Private Storage bucket with owner-path checks, allowed MIME types, size bounds and authenticated extraction.
- Edge Functions validate learner identity and ownership before using the server-only service-role credential.
- AI provider calls are blocked unless the separate server-side kill switch is explicitly enabled; provider secrets are never frontend variables.
- Local verification uses synthetic learner accounts and disposable Supabase/PostgreSQL. It does not use real student records.
- No production migration, merge or deployment is part of the foundation verification workflow.

## Privacy/security gaps requiring owner or legal review

- Lawful basis, purpose limitation, learner/minor and guardian considerations have not been legally assessed.
- A public privacy notice and in-product notice/consent flow have not been approved.
- Retention periods and deletion schedules for accounts, attempts, notes, extracted text, storage objects and generated drafts are not finalised.
- Self-service data export and account deletion workflows are not complete.
- Privacy contact/complaint channel and subject-access request handling are not configured.
- Supabase project region, hosting terms, subprocessors and cross-border transfer position must be verified in the project dashboard and contract.
- The selected AI/OCR vendor, DPA, retention, training-use policy, processing region and spend controls remain unapproved; providers stay disabled.
- Independent penetration testing, deployed-project security review and incident-response exercise remain outstanding.

## Required owner/legal decisions before public release

1. Confirm the Supabase plan, region, data-processing terms and subprocessors.
2. Approve lawful basis, learner/minor/guardian approach, privacy notice and consent requirements with qualified South African privacy/legal review.
3. Approve retention, deletion, data export, access-request and breach-notification procedures.
4. Decide whether any AI/OCR provider may process learner notes; if not, keep the kill switch false.
5. Approve an operational privacy contact and support process.

Do not treat this inventory as proof of POPIA compliance. Reconcile it with the live configuration and legal advice before launch.
