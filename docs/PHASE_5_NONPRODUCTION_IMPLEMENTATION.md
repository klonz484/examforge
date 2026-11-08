# ExamForge Phase 5 — Non-production implementation

**Status:** In progress — non-production implementation authorised by the project owner on 9 November 2026.

## Explicit scope

Approved work is limited to development and automated verification using synthetic documents and deterministic mocked AI responses.

- AI direction remains OpenAI, but the real provider is not called.
- OCR direction is Tesseract, run in an isolated self-hosted worker.
- No paid services, API spending, provider credentials, production secrets, live learner data, production migration, deployment, or main-branch merge are authorised.
- The R500/month figure is a ceiling, not spending permission.
- The real provider must remain disabled in both browser and server configuration.

## Implementation architecture

1. Existing selectable-text PDF extraction remains the preferred no-OCR path.
2. A private Tesseract worker handles synthetic PDF/JPEG/PNG test files. PDF pages are rendered locally with Poppler and processed with Tesseract English trained data.
3. The worker requires a high-entropy bearer token, accepts bounded binary uploads, limits PDFs to 30 pages, enforces a processing timeout, removes temporary files, and returns text plus page metadata.
4. OCR confidence is explicitly `not-calibrated`; no numeric confidence is invented.
5. A server-side adapter validates the worker endpoint and response. It permits HTTP only for loopback development and requires HTTPS otherwise.
6. A deterministic mock question provider produces synthetic JSON. The existing independent question validator must still validate its structure and evidence. The mock is not a curriculum or answer-quality evaluation.

## Local worker

Build and run only in an isolated development environment:

```sh
docker build -t examforge-tesseract-worker tools/tesseract-worker
TESSERACT_WORKER_TOKEN="$(openssl rand -hex 32)" docker run --rm -p 127.0.0.1:8787:8787 -e TESSERACT_WORKER_TOKEN="$TESSERACT_WORKER_TOKEN" examforge-tesseract-worker
```

The worker exposes `GET /health` and authenticated `POST /ocr`. It accepts `application/pdf`, `image/jpeg`, and `image/png`. WebP remains unsupported by this worker until conversion and test coverage are added.

## Remaining implementation tasks

- Wire the guarded OCR adapter into the non-production extraction flow without enabling it in production.
- Add synthetic PDF/image fixtures and integration tests against the isolated worker.
- Add mock-provider tests and malformed-output/prompt-injection cases.
- Verify worker authentication, MIME/size/page/time limits, temporary-file cleanup and output bounds.
- Verify the real OpenAI provider path remains unreachable in the mock configuration.
- Update the security runbook and record exact CI evidence.

## Release gate

This branch is not production-ready. Do not merge it, deploy Edge Functions, run live Supabase migrations, configure provider/OCR production secrets, or process real learner documents. Each requires a later explicit approval.
