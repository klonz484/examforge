# ExamForge Phase 5 — Non-production implementation

**Status:** Non-production implementation in progress. The project owner explicitly authorised mocked OpenAI responses and synthetic documents on 9 November 2026.

## Approval boundary

Approved:
- Deterministic mocked AI responses and synthetic study material only.
- Tesseract OCR worker development and synthetic PDF/image testing.
- Automated validation, security and reliability tests on feature branches and disposable CI infrastructure.

Not approved:
- Real OpenAI requests, provider credentials or any paid service.
- Real learner documents, student accounts or live learner data.
- Production OCR activation, provider activation, live Supabase migrations, production secrets, deployment, merge to `main`, or release.
- The R500 monthly ceiling is not spending permission.

## OCR implementation

- Selectable-text PDFs continue through the existing private unpdf path.
- Scanned PDFs and JPEG/PNG files can use the private Tesseract worker only when `OCR_WORKER_ENABLED=true` and a private `OCR_WORKER_URL` and `OCR_WORKER_TOKEN` are configured in an isolated non-production environment.
- The packaged Tesseract language models are English (`eng`) and Afrikaans (`afr`). The adapter and worker reject language codes outside the approved allowlist.
- The worker enforces a 10 MiB upload limit, 30-page PDF limit, MIME/signature validation, bearer authentication, a 20-second processing deadline, 8,000-character output cap and temporary-file cleanup.
- Poppler renders PDFs; ImageMagick normalises image pages before OCR.
- A second Tesseract pass uses a page-segmentation mode suited to simple printed formula lines and returns separate `equationText` with a best-effort status. This is not symbolic mathematics, LaTeX reconstruction, or a correctness guarantee. Fractions, matrices, diagrams, superscripts/subscripts, handwriting and complex notation must be manually checked. Confidence remains `not-calibrated`.
- OCR is not enabled in CI's Supabase Edge Function environment. The synthetic worker smoke test directly starts the isolated local worker and never contacts Supabase or a third-party OCR provider.

## Mock AI implementation

- `mock-ai-provider.ts` generates deterministic, explicitly synthetic JSON and performs no network calls.
- The independent validator checks JSON object shape, prompt and explanation bounds, four distinct options, answer-index range, confidence range, and exact evidence inclusion in source text.
- The validator rejects instruction-like output that attempts to override system/developer instructions or reveal secrets.
- Synthetic prompt-injection tests place malicious instructions in source text and verify the mock does not copy them into learner-facing question/explanation fields.
- Malformed JSON, null/non-object payloads, invalid indexes, invalid confidence, duplicate options, unsupported evidence and instruction-like output are tested.
- Mock tests do not establish the quality, safety or correctness of a real language model.

## Proving real OpenAI calls are disabled

CI runs the local Supabase Edge Functions with:
- `AI_STUDY_ENABLED=false`
- no `AI_STUDY_API_KEY`, `AI_STUDY_ENDPOINT`, or `AI_STUDY_MODEL`
- no `OPENAI_API_KEY`
- `OCR_WORKER_ENABLED=false`
- no OCR worker URL or token

A runtime test posts to `generate-study-question` and requires HTTP 503 with the server-side disabled message. The Edge Function checks the kill switch before provider configuration, authentication-dependent work, or its provider `fetch`. No network call to OpenAI is made.

## Verification gates

CI must pass:
1. Synthetic Tesseract smoke tests for authentication, MIME/signature rejection, file-size rejection, English/Afrikaans traineddata, and simple printed equation extraction.
2. Mock AI validation tests for normal, malformed and prompt-injection cases.
3. Runtime proof that AI provider calls are disabled and provider credentials are absent.
4. Disposable PostgreSQL migration/RLS and backup-restore tests.
5. Disposable local Supabase Edge Function tests with provider and OCR switches off.
6. TypeScript/production build, bundle budget and full Playwright suite.

## Phase 5 exit-criteria assessment

| Roadmap exit criterion | Non-production evidence | Status |
|---|---|---|
| Secrets and uploaded files handled securely | Private storage/RLS, authenticated owner checks, bounded extraction, private OCR worker authentication, no provider keys in browser, disabled CI switches | Implemented; requires independent security/privacy review before release |
| Generated content validated, labelled and reviewable | Deterministic mock, strict schema/evidence checks, unsafe-output rejection, pending review/provenance in existing server path | Mock path verifiable; real provider quality not verified |
| AI failures do not corrupt learner data or block ordinary study | Disabled-provider response, failure paths, pending-only drafts, ordinary practice independent of AI | Requires passing full CI and provider-failure integration evidence |
| Usage and cost controls operational | Atomic five-request daily quota and RLS tests; CI proves no provider credential or network call | Request quota verified; real provider spend limits, alerts and token-cost monitoring are not active |

## Remaining approval-only items

Phase 5 cannot be declared production-complete under the current non-production approval. Before any later activation, the owner must separately approve:
- OpenAI vendor terms, DPA, training-use policy, retention, processing region and subprocessors.
- POPIA/privacy assessment and learner/minor safeguards.
- Exact data categories sent to the provider and OCR processing boundaries.
- Hard provider spend limits, token-level accounting, alerts and gateway rate limits.
- Non-production provider integration and quality evaluation with synthetic data.
- Any production secrets, production OCR enablement, live migrations or deployment.

No production approval is being requested by this implementation. PR #4 remains a draft and must not be merged.
