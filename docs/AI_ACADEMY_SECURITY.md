# ExamForge AI Academy — Security and Operations Design

**Status:** Server-side draft-generation scaffold implemented; provider disabled until project-owner configuration and privacy review.

## Architecture

The browser calls the Supabase Edge Function `generate-study-question` using the learner's authenticated Supabase session. The function validates the token with Supabase Auth, validates the request, verifies that the subject is enrolled, reserves a daily usage slot, invokes an HTTPS AI endpoint with server-only credentials, validates the returned MCQ structure, records usage, and inserts the result under the learner's account.

The service-role key and provider credential are read only from Edge Function environment secrets. They must never be placed in `VITE_*` variables, browser bundles, repository files, client logs, or issue comments.

## Controls in the current implementation

- Learner authentication is required and the token is validated server-side.
- Requested subject must be present in the learner's `learner_subjects` enrolment.
- Grade is restricted to 10–12; subject ID, subject name and topic are length/format checked.
- Source text is restricted to 100–8,000 characters.
- Daily quota reservation is atomic and keyed by the learner's Africa/Johannesburg local date; default limit is five requests per learner per day.
- Quota and character counts are stored in `ai_usage_daily`; learners can read only their own usage row and cannot write quota state directly.
- Provider endpoint must use HTTPS and all provider secrets are server-side.
- The model is instructed to return one JSON MCQ with exactly four distinct options, answer index, explanation and confidence.
- Server validation rejects invalid prompts, options, answer indices, explanations and confidence values.
- Generated records are written with `review_status = 'pending'`, source label, model name and explicit AI provenance.
- The answer is returned only to the authenticated owner for preview/review; it is not inserted automatically into Tonight's 20.
- Failed provider requests do not mutate existing learner sessions, attempts or notes.
- The Edge Function requires the server-only `AI_STUDY_ENABLED=true` kill switch before it can read provider configuration or make a provider request. It returns 503 by default; the browser's `VITE_AI_STUDY_ENABLED` flag only controls UI visibility and is not a security boundary.
- The local verification workflow explicitly sets `AI_STUDY_ENABLED=false` and provides no provider secrets; authenticated tests assert the server refuses drafting.
- Provider requests have a 20-second timeout. No provider API calls are made in this repository workflow.

## Required Edge Function secrets

Configure only through Supabase Edge Function secrets after a privacy, vendor and cost review:

- `AI_STUDY_ENABLED`: server-side kill switch; leave `false` or unset until all approval gates below are complete. This must be set to `true` separately from the browser flag.
- `AI_STUDY_ENDPOINT`: HTTPS endpoint compatible with the implemented chat-completions request/response shape.
- `AI_STUDY_API_KEY`: provider credential.
- `AI_STUDY_MODEL`: approved model identifier.
- `AI_ALLOWED_ORIGINS`: optional comma-separated explicit additional browser origins; default origin allowlist is deliberately narrow.

Supabase's standard `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided to the Edge Function runtime. Never expose the service-role key to the client.

## Before turning on a provider

1. Select a provider and verify its data-processing agreement, retention settings, regional processing, subprocessors, training-use policy and deletion path.
2. Complete a POPIA privacy assessment/DPIA appropriate to learners, including minors, uploaded notes and third-party transfer.
3. Set provider-side hard spend limits and alerting; review the five-request daily app quota and char counters for abuse/cost suitability.
4. Deploy migrations and Edge Function to a non-production target first, then execute authenticated, unauthorized, quota-exhaustion, malformed-output, provider-timeout and account-isolation tests.
5. Confirm rate limits at gateway/provider level as well as the database quota; the current quota controls count requests, not token spend.
6. Add model-output quality review and operational monitoring. The confidence value is model-reported, not calibrated scientific confidence.
7. Keep AI drafts clearly distinguishable from official DBE content. Learner approval is a review decision, not DBE endorsement or guaranteed correctness.

## Current limitations

- Provider activation is server-side disabled by default; no provider secrets are configured and no paid provider request has been made.
- Text-based PDF extraction uses `unpdf` in the authenticated Edge Function. Scanned PDFs and images remain private and are marked as requiring OCR; no external OCR provider is called. OCR remains disabled pending privacy/vendor/cost approval.
- Extraction quality is reported as a heuristic status, not a calibrated confidence probability.
- Only multiple-choice draft generation is implemented.
- Approved AI drafts remain in the private generated-question library; they are not yet merged into the trusted curated question bank or Tonight's 20.
- Usage char counts are recorded after provider completion; quota reservation is atomic before the provider call. Token-level spend is not tracked.
- Automated tests validate database quota accounting and isolation; Edge Function runtime/provider integration still requires deployment to a disposable local/preview Supabase Edge Runtime and fake/mock provider.
