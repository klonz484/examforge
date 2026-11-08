# ExamForge AI Academy — Security and Operations Design

**Status:** Non-production OCR integration and mocked AI validation are under verification. Live OpenAI activation remains disabled and requires separate owner approval.

## Current architecture

The learner uploads supported files into the private student-notes storage bucket under their own user-ID folder. Row-level security (RLS) restricts storage and note-row access to that learner. The extract-study-note Edge Function validates the bearer token, note ownership, storage path, MIME type, stored size and PDF signature before using the server-side service role to read the object and persist extraction results.

Selectable-text PDFs are processed with unpdf. When the explicit `OCR_WORKER_ENABLED=true` server flag is set in an isolated non-production environment, scanned PDFs and JPEG/PNG images can be sent to a private, self-hosted Tesseract worker. The worker supports English and Afrikaans traineddata, 10 MB inputs, 30-page PDFs, a 20-second total processing deadline, temporary-file cleanup and bounded text output. It performs a separate best-effort pass for simple printed linear equations. Equation OCR is not symbolic mathematics, does not guarantee correct superscripts/fractions/diagrams, and must be checked by the learner. OCR confidence remains uncalibrated.

The browser can call generate-study-question only with an authenticated learner session. The function checks subject enrolment and validates the subject/grade/topic against the supported Grade 10–12 Mathematics and Physical Sciences starter-practice map before any provider request. If a provider is later approved and configured, the function will use server-only secrets, validate the model output and store a pending, provenance-labelled draft for learner review.

## Controls currently implemented

- The student-notes bucket is private, limited to JPEG, PNG, WebP and PDF, and capped at 10 MB per object.
- Storage object paths must begin with the authenticated learner ID. Note rows are owner-scoped by RLS.
- The extraction function checks authentication, note ownership, path ownership, MIME type, file size, PDF magic bytes, page count and extraction time.
- Selectable-text PDF extraction remains private and bounded. The opt-in OCR adapter targets only the private worker, requires HTTPS outside loopback, uses a bearer token, allowlists configured language packs and validates the worker response. CI keeps `OCR_WORKER_ENABLED=false`; no learner document is processed in CI. English and Afrikaans are covered by synthetic OCR tests. Simple printed formula text is returned as best-effort supplementary text, not as a verified mathematical expression.
- Extraction metadata reports qualityStatus and confidenceStatus. The numeric extraction_confidence column remains null because no calibrated numeric extraction-confidence model is used.
- AI provider credentials and the Supabase service-role key are read only from Edge Function environment secrets. They must never be placed in VITE variables, browser bundles, repository files, client logs or issue comments.
- The AI Edge Function requires learner authentication, verifies the selected subject is enrolled, and restricts metadata to supported subject/grade/topic combinations that have actual starter practice content.
- Source text is limited to 100–8,000 characters. If a private note ID is supplied, the function reads extracted text from the authenticated learner's own ready note row rather than trusting browser-supplied replacement text.
- The model is instructed to treat source text as untrusted reference data, use only supported facts, avoid DBE endorsement claims and return one structured MCQ with four distinct options, answer index, explanation, evidence excerpt and model-estimated confidence.
- Server validation checks the question structure and requires the evidence excerpt to occur verbatim in the source text.
- Generated drafts retain explicit AI provenance and start in pending review status. Approval/rejection is saved by the learner; approved drafts do not automatically enter Tonight's 20.
- Atomic daily request reservation is limited to five requests per learner by default and keyed to the Africa/Johannesburg date. Usage rows are readable only by their owner; quota writes are service-role-only.
- The UI feature flag VITE_AI_STUDY_ENABLED defaults to false. The Edge Function checks AI_STUDY_ENABLED before reading provider configuration or making a network request. CI sets it to false, omits provider credentials, and asserts the endpoint returns 503.
- Ordinary practice, session persistence, progress and review do not depend on the AI provider.

## Current environment configuration

The frontend flag is:

- VITE_AI_STUDY_ENABLED=false — a non-secret UI gate. It must remain false until the project owner explicitly approves provider activation.

The separate server-only kill switch is:

- AI_STUDY_ENABLED=false — the Edge Function refuses all provider requests unless this is explicitly set to true after privacy, vendor and cost approval. A frontend build flag cannot override this server-side control.

If and only if privacy, vendor and cost review is approved, configure these as Supabase Edge Function secrets, never frontend variables:

- AI_STUDY_ENDPOINT — approved HTTPS endpoint compatible with the implemented request/response contract.
- AI_STUDY_API_KEY — provider credential.
- AI_STUDY_MODEL — approved model identifier.
- AI_ALLOWED_ORIGINS — optional comma-separated additional browser origins, reviewed explicitly.

Supabase provides SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to the Edge Function runtime. The service-role key must never be exposed to the client.

## Before turning on OCR or an AI provider

1. Select the OCR/AI vendors and review data-processing agreements, retention, processing region, subprocessors, training-use policy and deletion path.
2. Complete a POPIA privacy assessment appropriate to learners and minors, including uploaded notes and any third-party transfer.
3. Approve the exact data categories sent to each provider. Do not send images, scanned PDFs or learner notes until this review is complete.
4. Set provider-side hard spend limits, alerts and gateway-level rate limits. The current database quota counts requests and characters, not token-level spend.
5. Configure secrets only in a non-production Supabase Edge Function environment after owner approval.
6. Run authenticated, unauthorized, quota-exhaustion, malformed-output, timeout, low-confidence extraction, account-isolation and provider-failure tests against disposable data.
7. Review model-output correctness, evidence support and age/grade suitability. Model-reported confidence is uncalibrated and is not a correctness guarantee.
8. Keep every generated item clearly distinguishable from official DBE material. Learner approval is not DBE endorsement or a guarantee of correctness.
9. Keep the UI feature flag false until the server-side provider configuration and the full non-production verification both pass.

## Current limitations

- AI_STUDY_ENABLED is false in local verification and defaults to disabled when absent. No AI provider secrets are configured; no paid provider request has been made.
- OCR is implemented behind an explicit server-side opt-in and uses a private self-hosted Tesseract worker; CI leaves it disabled. The currently packaged language models are English and Afrikaans. Other languages require a separately packaged and tested traineddata model. Simple printed linear formula extraction is best-effort only; complex mathematical notation and handwritten equations are not guaranteed.
- Extraction quality is represented by explicit status metadata, not a calibrated numeric confidence score.
- Automatic classification of arbitrary extracted text is not active. The current allowlist validates learner-selected subject/grade/topic metadata against the starter practice map; it does not prove that arbitrary source text belongs to that topic.
- Only multiple-choice question drafts are scaffolded. Worked-example generation, revision plans and a grounded conversational study assistant are not active.
- Real OpenAI provider integration and model-quality evaluation remain unverified because the provider is intentionally disabled. Mocked responses validate parsing, evidence, malformed payload rejection and prompt-injection resistance, not actual model quality.
- The daily quota is atomic, but token-level spend accounting and provider/gateway rate limits still require vendor-side configuration.
- Approved drafts remain in the private generated-question library; they are not automatically merged into the trusted curated question bank or Tonight's 20.

## Release boundary

This document describes a development-branch design. No production Edge Function deployment, live Supabase migration, provider secret configuration, OCR vendor connection, paid request, GitHub Pages deployment or main merge is authorised by this work. Each requires separate explicit approval.
