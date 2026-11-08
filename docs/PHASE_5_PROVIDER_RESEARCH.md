# ExamForge Phase 5 — OpenAI and Tesseract research

**Research date:** 8 November 2026  
**Repository:** `klonz484/examforge`  
**Approval scope:** Research only. No provider activation, API key, paid request, live learner data, production secret, or production service change is authorised.

## 1. Owner decisions recorded

- AI provider direction: OpenAI API.
- OCR direction: Tesseract OCR.
- Proposed monthly ceiling: R500 (hard ceiling; not permission to spend).
- Current permission: research only.
- Separate explicit approval is required before sandbox provider credentials or requests, any paid service, live learner data, production credentials, or production changes.

## 2. Research recommendation

**Provisional architecture:** run Tesseract 5 locally in the existing trusted extraction service/container to convert scanned pages to text; keep the existing bounded PDF extraction path for selectable text; pass only a minimal, redacted, learner-approved text excerpt to a server-side OpenAI Responses API adapter; validate structured output against the existing question-draft schema and current subject/grade/topic allowlist; keep every draft pending human review. Do not upload original learner files to OpenAI as the default design.

This is a design recommendation only. The current extraction function and AI draft function must be inspected in a later implementation-authorised run before code changes. Do not add a Tesseract binary or OpenAI SDK until runtime/container compatibility and dependency provenance are verified.

## 3. OpenAI model and cost research

OpenAI's current model catalogue describes GPT-6 Luna (`gpt-6-luna`) as the efficient model for focused, high-volume workloads and lists Responses API and Structured Outputs support. The published standard text-token rates are USD $0.10 per million input tokens and $0.50 per million output tokens. GPT-6.1 Terra is a higher-cost alternative at $1/$5 per million tokens. The model choice must still be evaluated on representative South African Grade 10–12 Mathematics and Physical Sciences question-generation samples before activation.

At an indicative 8 November 2026 reference rate of approximately R16.48/USD, R500 is approximately USD $30.34 before card conversion spreads, tax, or other charges. Example GPT-6 Luna text-only usage:
- 1,000 requests × 4,000 input tokens × $0.10/1M = $0.40.
- 1,000 requests × 1,000 output tokens × $0.50/1M = $0.50.
- Estimated model-token total = $0.90 (about R14.83 at that indicative rate), excluding retries, safety checks, any image/audio input, infrastructure, taxes and exchange-rate movement.

This example is not a forecast or a spending approval. Enforce a stricter internal monthly cap below R500, using a ZAR ledger and a conservative exchange-rate buffer. Provider dashboard budgets/alerts are supplementary, not the only control. Reserve funds for unexpected usage; reject new requests before the cap; fail closed if usage accounting is unavailable. The current five-request/day quota is not itself a monthly spend cap.

Official references:
- Models: https://developers.openai.com/api/docs/models
- GPT-6 Luna: https://developers.openai.com/api/docs/models/gpt-6-luna
- Pricing: https://developers.openai.com/api/docs/pricing
- Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Data controls: https://developers.openai.com/api/docs/guides/your-data
- Under-18 guidance: https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance

## 4. Data protection and learner safety findings

- OpenAI states API content is not used to train/improve models by default unless the customer opts in. This does **not** mean zero retention: default abuse-monitoring logs may contain prompts/responses and may be retained for up to 30 days.
- The Responses API has application-state retention behaviour that depends on `store`, endpoint features and account data controls. `store: false` is a useful minimisation measure, but it does not by itself eliminate default abuse-monitoring retention. Confirm eligibility and exact contractual controls before sending personal data.
- OpenAI documents Zero Data Retention as an approval/configuration-dependent control. Do not assume the ExamForge account qualifies or that all endpoints/features are eligible.
- OpenAI's under-18 guidance requires additional age-appropriate disclosures, safety filtering, monitoring/escalation, and appropriate age assurance. It says personal data of children under 13 or the applicable digital age of consent should not be processed without Zero Data Retention first being implemented.
- South Africa's POPIA treats children's personal information specially. Section 35 includes prior consent of a competent person among the general authorisations. Section 57(1)(d) and the Information Regulator's guidance indicate prior authorisation may be required for transfer of children's or special personal information to a foreign country without an adequate level of protection. This research is not legal advice and does not determine whether a particular OpenAI contract/transfer mechanism is adequate.
- OpenAI's published data-residency information describes supported regions such as the US and Europe; South Africa is not listed as an available processing region in the reviewed material. A regional endpoint must not be described as South African residency.
- Before any real learner content is transmitted, obtain a POPIA assessment by a qualified South African privacy professional, determine age/competent-person consent handling, review the DPA and subprocessor list, confirm the exact processing/retention locations and lawful transfer mechanism, and document data-subject notices/rights and deletion procedures.

## 5. Tesseract OCR research

Tesseract 5 is an open-source OCR engine under Apache License 2.0, with an API and language data for 100+ languages and 35+ scripts. It can run locally in a controlled server/container, so OCR itself need not send the original scan to a cloud OCR vendor.

Important limits:
- OCR quality depends on scan resolution, skew, contrast, handwriting, mathematical notation, tables, diagrams and selected traineddata.
- Do not assume ordinary OCR preserves equations, superscripts, fractions, diagrams or multi-column exam layouts correctly.
- OCR output must carry provenance and a quality status; never invent a numeric confidence score without calibration.
- Retain source-page references and allow learner correction/preview before question generation.
- Benchmark English and Afrikaans first, then assess isiZulu/isiXhosa and other requested languages against actual Grade 10–12 source material before claiming support.
- Apply strict file/page/pixel/time/memory limits, malware-safe file handling, temporary-file cleanup, and no public access to the OCR worker.

Official references:
- Tesseract manual: https://github.com/tesseract-ocr/tessdoc
- Tesseract language data: https://github.com/tesseract-ocr/tessdata
- Apache 2.0: https://www.apache.org/licenses/LICENSE-2.0

## 6. Proposed safeguards before any implementation/activation

1. Keep `VITE_AI_STUDY_ENABLED=false` and the server-side provider disabled by default.
2. Use server-side secrets only; never expose API keys in the browser, repository, logs, or client bundle.
3. Do not send original files, names, email addresses, school identifiers, account IDs, or unrelated learner data to OpenAI.
4. Require explicit per-upload AI processing consent after age-appropriate disclosure; design competent-person consent for minors, subject to legal review.
5. Use foreground Responses API requests only, with `store: false` where supported; avoid persistent conversations, file/vector stores, background mode, and third-party tools unless separately reviewed.
6. Use Structured Outputs plus independent server validation, exact evidence excerpt checks, supported subject/topic allowlists, provenance, duplicate detection and mandatory human review.
7. Build a transactional ZAR cost ledger, hard monthly global ceiling below R500 (with FX/tax buffer), per-user/day quotas, maximum input/output tokens, request timeouts, idempotency, concurrency-safe reservations and fail-closed behaviour.
8. Configure provider project budget/alerts and reconcile actual provider usage against the internal ledger; alert well before the hard cap.
9. Run local Tesseract tests with synthetic/non-personal files only. OCR failure or low quality must not silently generate questions.
10. Add evaluations for mathematical correctness, answer/explanation consistency, curriculum alignment, source-grounding, bias, age-appropriateness and prompt injection in uploaded notes.

## 7. Current blockers and exact next approvals

**No implementation or provider call is authorised by the current research-only scope.** Before moving from research to implementation, the owner must explicitly approve:
- A non-production sandbox integration build and whether a small amount of test spend is permitted (or require mocked OpenAI responses only).
- Whether the R500 ceiling includes tax/card FX fees and the desired internal stop threshold.
- Privacy/legal review outcome, including minors and cross-border transfers.
- The precise OpenAI data-control configuration available to the account (including ZDR eligibility) and the approved DPA/subprocessor terms.

Until then: no credentials, no paid calls, no OCR deployment, no live learner data, and no production changes.

## 8. Status

**Phase 5: RESEARCH COMPLETE / IMPLEMENTATION NOT AUTHORISED.** Provider activation, OCR integration, end-to-end quality validation and operational cost controls remain incomplete.  
**Phase 6: NOT STARTED TO COMPLETION.** Physical-device accessibility, independent security review, legal/privacy review, hosted backup restoration, offline/network validation, monitoring and launch operations remain outstanding.
