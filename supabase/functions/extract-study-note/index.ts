import { createClient } from "npm:@supabase/supabase-js@2"
import { extractText, getDocumentProxy } from "npm:unpdf@2.1.0"
import {
  cleanExtractedText,
  hasPdfMagicBytes,
  hasUsableStudyText,
  isAllowedNoteMimeType,
  isOwnedNoteStoragePath,
  MAX_EXTRACTED_TEXT_CHARS,
  MAX_NOTE_BYTES,
  MAX_PDF_PAGES,
} from "../_shared/document-validation.ts"
import { runTesseractOcr, type TesseractOcrResult } from "../_shared/tesseract-ocr.ts"

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Vary": "Origin",
}

function response(status: number, body: unknown, origin: string | null) {
  const allowed = new Set([
    "https://klonz484.github.io",
    "http://127.0.0.1:4173",
    "http://localhost:5173",
    ...(Deno.env.get("AI_ALLOWED_ORIGINS") ?? "").split(",").map(value => value.trim()).filter(Boolean),
  ])
  const headers = new Headers(corsHeaders)
  headers.set("Content-Type", "application/json")
  if (origin && allowed.has(origin)) headers.set("Access-Control-Allow-Origin", origin)
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers })
}

function uuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("PDF extraction exceeded the time limit.")), milliseconds)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}


async function runConfiguredOcr(bytes: Uint8Array, mimeType: string): Promise<TesseractOcrResult | null> {
  // Disabled by default. Non-production activation requires an explicit local
  // flag and a private worker endpoint/token; no hosted OCR vendor is used.
  if (Deno.env.get("OCR_WORKER_ENABLED") !== "true") return null
  const endpoint = Deno.env.get("OCR_WORKER_URL")
  const token = Deno.env.get("OCR_WORKER_TOKEN")
  if (!endpoint || !token) throw new Error("The private non-production OCR worker is not configured.")
  return runTesseractOcr(bytes, mimeType, endpoint, token)
}

function buildOcrReviewText(result: TesseractOcrResult): string {
  const sections = [result.text]
  if (result.equationText && result.equationText !== result.text) {
    sections.push("[Equation OCR — best effort, verify every symbol]\n" + result.equationText)
  }
  return cleanExtractedText(sections.join("\n\n"), MAX_EXTRACTED_TEXT_CHARS)
}

Deno.serve(async request => {
  const origin = request.headers.get("Origin")
  if (request.method === "OPTIONS") return response(204, null, origin)
  if (request.method !== "POST") return response(405, { error: "Method not allowed." }, origin)

  const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!bearer) return response(401, { error: "Sign in before extracting a private note." }, origin)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return response(503, { error: "Private document extraction is not configured securely." }, origin)
  }

  const learnerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { data: userData, error: authError } = await learnerClient.auth.getUser(bearer)
  const learner = userData.user
  if (authError || !learner) return response(401, { error: "Your sign-in session is invalid. Sign in again." }, origin)

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return response(400, { error: "Request body must be valid JSON." }, origin) }
  if (!uuid(body.noteId)) return response(400, { error: "A valid note identifier is required." }, origin)

  const { data: note, error: noteError } = await learnerClient.from("note_uploads")
    .select("id,user_id,storage_path,mime_type,size_bytes,processing_status,extracted_text,extraction_metadata")
    .eq("id", body.noteId)
    .eq("user_id", learner.id)
    .maybeSingle()

  if (noteError) {
    console.error("Private note lookup failed:", noteError.message)
    return response(503, { error: "Your private note could not be checked. Please retry later." }, origin)
  }
  if (!note) return response(404, { error: "That private note was not found in your account." }, origin)

  if (!isOwnedNoteStoragePath(learner.id, String(note.storage_path))) {
    return response(403, { error: "The note storage path does not belong to your account." }, origin)
  }
  if (!isAllowedNoteMimeType(String(note.mime_type)) || Number(note.size_bytes) < 1 || Number(note.size_bytes) > MAX_NOTE_BYTES) {
    return response(415, { error: "This file type or size is not supported for private extraction." }, origin)
  }

  if (note.processing_status === "ready" && typeof note.extracted_text === "string") {
    return response(200, {
      status: "ready",
      noteId: note.id,
      extractedText: note.extracted_text,
      textChars: note.extracted_text.length,
      metadata: note.extraction_metadata,
    }, origin)
  }

  // Image OCR and scanned-PDF OCR must not be silently sent to an unapproved
  // third-party service. They remain private and explicitly require an OCR path.
  if (String(note.mime_type) !== "application/pdf") {
    try {
      const { data: imageFile, error: imageDownloadError } = await adminClient.storage
        .from("student-notes")
        .download(String(note.storage_path))
      if (imageDownloadError || !imageFile) throw new Error("Private image download failed.")
      const imageBytes = new Uint8Array(await imageFile.arrayBuffer())
      if (imageBytes.byteLength < 1 || imageBytes.byteLength > MAX_NOTE_BYTES) throw new Error("The image size is outside the allowed range.")
      const ocr = await runConfiguredOcr(imageBytes, String(note.mime_type))
      if (!ocr) {
        const metadata = { kind: "image", requiresOcr: true, qualityStatus: "ocr-disabled", confidenceStatus: "not-assessed" }
        await adminClient.from("note_uploads").update({
          processing_status: "low_confidence", extraction_confidence: null, extracted_text: null,
          extraction_error: "Image OCR is disabled. No external OCR provider was called.", extraction_metadata: metadata,
        }).eq("id", note.id).eq("user_id", learner.id)
        return response(422, { status: "low_confidence", metadata, error: "This image is stored privately, but non-production OCR is disabled. No external OCR service was called." }, origin)
      }
      const extractedText = buildOcrReviewText(ocr)
      const usable = hasUsableStudyText(ocr.text)
      const metadata = {
        kind: "image", parser: "tesseract", pages: ocr.pageCount, languages: ocr.languages,
        textChars: extractedText.length, requiresOcr: false, equationStatus: ocr.equationStatus,
        equationReviewRequired: true, qualityStatus: usable ? "ocr-text-extracted" : "ocr-insufficient-text",
        confidenceStatus: "not-calibrated",
      }
      const { error: saveError } = await adminClient.from("note_uploads").update({
        processing_status: usable ? "ready" : "low_confidence", extraction_confidence: null,
        extracted_text: extractedText, extraction_metadata: metadata,
        extracted_at: new Date().toISOString(),
        extraction_error: usable ? null : "OCR did not produce enough usable study text. Review the image and try a clearer scan.",
      }).eq("id", note.id).eq("user_id", learner.id)
      if (saveError) throw new Error("OCR text could not be saved to the private note.")
      return response(usable ? 200 : 422, {
        status: usable ? "ready" : "low_confidence", noteId: note.id, extractedText,
        textChars: extractedText.length, metadata,
        ...(usable ? {} : { error: "OCR did not produce enough usable study text. Review the image and try a clearer scan." }),
      }, origin)
    } catch (error) {
      console.error("Private image OCR failed:", error instanceof Error ? error.message : "unknown OCR error")
      await adminClient.from("note_uploads").update({
        processing_status: "failed", extraction_confidence: null, extracted_text: null,
        extraction_error: "The image could not be safely processed by the private OCR worker.",
        extraction_metadata: { kind: "image", qualityStatus: "ocr-failed", confidenceStatus: "not-assessed" },
      }).eq("id", note.id).eq("user_id", learner.id)
      return response(422, { status: "failed", error: "The image could not be safely processed. Check the file and try again." }, origin)
    }
  }

  const { data: claim, error: claimError } = await adminClient.from("note_uploads")
    .update({
      processing_status: "processing",
      extraction_error: null,
      extraction_metadata: { kind: "pdf", parser: "unpdf@2.1.0" },
    })
    .eq("id", note.id)
    .eq("user_id", learner.id)
    .in("processing_status", ["queued", "failed", "low_confidence"])
    .select("id")
    .maybeSingle()

  if (claimError) {
    console.error("Private note claim failed:", claimError.message)
    return response(503, { error: "The document could not be queued safely. Please retry later." }, origin)
  }
  if (!claim) return response(409, { error: "This note is already being processed. Refresh its status before retrying." }, origin)

  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | null = null
  try {
    const { data: file, error: downloadError } = await adminClient.storage
      .from("student-notes")
      .download(String(note.storage_path))
    if (downloadError || !file) throw new Error("Private note download failed.")
    if (file.size < 1 || file.size > MAX_NOTE_BYTES) throw new Error("The document size is outside the allowed range.")

    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!hasPdfMagicBytes(bytes)) throw new Error("The uploaded file does not have a valid PDF signature.")

    pdf = await getDocumentProxy(bytes, { maxImageSize: 16_777_216 })
    if (!Number.isInteger(pdf.numPages) || pdf.numPages < 1 || pdf.numPages > MAX_PDF_PAGES) {
      throw new Error(`The PDF must contain between 1 and ${MAX_PDF_PAGES} pages.`)
    }

    const extraction = await withTimeout(extractText(pdf, { mergePages: true }), 15_000)
    const fullText = typeof extraction.text === "string" ? extraction.text : extraction.text.join("\n")
    const extractedText = cleanExtractedText(fullText, MAX_EXTRACTED_TEXT_CHARS)

    if (!hasUsableStudyText(extractedText)) {
      const ocr = await runConfiguredOcr(bytes, "application/pdf")
      if (ocr) {
        const ocrText = buildOcrReviewText(ocr)
        const usableOcrText = hasUsableStudyText(ocr.text)
        const ocrMetadata = {
          kind: "pdf", parser: "tesseract", pages: ocr.pageCount, languages: ocr.languages,
          textChars: ocrText.length, requiresOcr: false, equationStatus: ocr.equationStatus,
          equationReviewRequired: true, qualityStatus: usableOcrText ? "ocr-text-extracted" : "ocr-insufficient-text",
          confidenceStatus: "not-calibrated",
        }
        const { error: ocrSaveError } = await adminClient.from("note_uploads").update({
          processing_status: usableOcrText ? "ready" : "low_confidence", extraction_confidence: null,
          extracted_text: ocrText, extraction_metadata: ocrMetadata,
          extracted_at: new Date().toISOString(),
          extraction_error: usableOcrText ? null : "OCR did not produce enough usable study text. Review the scanned PDF.",
        }).eq("id", note.id).eq("user_id", learner.id)
        if (ocrSaveError) throw new Error("OCR text could not be saved to the private note.")
        return response(usableOcrText ? 200 : 422, {
          status: usableOcrText ? "ready" : "low_confidence", noteId: note.id, extractedText: ocrText,
          textChars: ocrText.length, metadata: ocrMetadata,
          ...(usableOcrText ? {} : { error: "OCR did not produce enough usable study text. Review the scanned PDF." }),
        }, origin)
      }
      const metadata = {
        kind: "pdf",
        parser: "unpdf@2.1.0",
        pages: extraction.totalPages,
        textChars: extractedText.length,
        requiresOcr: true,
        qualityStatus: "insufficient-selectable-text",
        confidenceStatus: "not-calibrated",
      }
      await adminClient.from("note_uploads").update({
        processing_status: "low_confidence",
        extraction_confidence: null,
        extracted_text: extractedText,
        extraction_metadata: metadata,
        extracted_at: new Date().toISOString(),
        extraction_error: "No useful selectable text was found. This may be a scanned PDF; OCR is not enabled.",
      }).eq("id", note.id).eq("user_id", learner.id)
      return response(422, {
        status: "low_confidence",
        textChars: extractedText.length,
        metadata,
        error: "The PDF did not contain enough selectable text. It may be scanned; OCR is not enabled and no external OCR service was called.",
      }, origin)
    }

    const metadata = {
      kind: "pdf",
      parser: "unpdf@2.1.0",
      pages: extraction.totalPages,
      textChars: extractedText.length,
      truncated: fullText.length > MAX_EXTRACTED_TEXT_CHARS,
      requiresOcr: false,
      qualityStatus: "usable-selectable-text",
      confidenceStatus: "not-calibrated",
    }
    const { error: saveError } = await adminClient.from("note_uploads").update({
      processing_status: "ready",
      extraction_confidence: null,
      extracted_text: extractedText,
      extraction_metadata: metadata,
      extracted_at: new Date().toISOString(),
      extraction_error: null,
    }).eq("id", note.id).eq("user_id", learner.id)

    if (saveError) {
      console.error("Private note extraction result could not be saved:", saveError.message)
      return response(500, { error: "Text was extracted but could not be saved to your private note." }, origin)
    }

    return response(200, {
      status: "ready",
      noteId: note.id,
      extractedText,
      textChars: extractedText.length,
      metadata,
    }, origin)
  } catch (error) {
    const safeMessage = error instanceof Error ? error.message : "Document extraction failed."
    console.error("Private PDF extraction failed:", safeMessage)
    await adminClient.from("note_uploads").update({
      processing_status: "failed",
      extracted_text: null,
      extraction_error: "The PDF could not be safely extracted. Check the file and try again.",
      extraction_metadata: { kind: "pdf", qualityStatus: "extraction-failed", confidenceStatus: "not-assessed" },
    }).eq("id", note.id).eq("user_id", learner.id)
    return response(422, { status: "failed", error: "The PDF could not be safely extracted. Check the file and try again." }, origin)
  } finally {
    if (pdf) {
      try { await pdf.destroy() } catch { /* parser resource cleanup is best-effort */ }
    }
  }
})
