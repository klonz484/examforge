import { MAX_EXTRACTED_TEXT_CHARS, MAX_NOTE_BYTES, cleanExtractedText } from "./document-validation.ts"

export type TesseractOcrResult = {
  text: string
  pageCount: number
  engine: "tesseract"
  language: "eng"
  qualityStatus: "ocr-text-extracted" | "ocr-insufficient-text"
  confidenceStatus: "not-calibrated"
}

export async function runTesseractOcr(bytes: Uint8Array, mimeType: string, endpoint: string, bearerToken: string): Promise<TesseractOcrResult> {
  if (bytes.byteLength < 1 || bytes.byteLength > MAX_NOTE_BYTES) throw new Error("OCR input is outside the allowed file-size range.")
  if (!["application/pdf", "image/jpeg", "image/png"].includes(mimeType)) throw new Error("Tesseract OCR supports PDF, JPEG and PNG inputs in this implementation.")
  if (!endpoint || !bearerToken) throw new Error("The private OCR worker is not configured.")
  const url = new URL(endpoint)
  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) throw new Error("The OCR worker endpoint must use HTTPS outside local development.")
  const response = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: { Authorization: "Bearer " + bearerToken, "Content-Type": mimeType, "Cache-Control": "no-store" },
    body: bytes,
  })
  if (!response.ok) throw new Error("The private OCR worker returned status " + response.status + ".")
  const value = await response.json() as Record<string, unknown>
  if (value.engine !== "tesseract" || value.language !== "eng" || !Number.isInteger(value.pageCount) || Number(value.pageCount) < 1 || Number(value.pageCount) > 30 || typeof value.text !== "string") {
    throw new Error("The private OCR worker returned an invalid response.")
  }
  const text = cleanExtractedText(value.text, MAX_EXTRACTED_TEXT_CHARS)
  return { text, pageCount: Number(value.pageCount), engine: "tesseract", language: "eng", qualityStatus: text.length >= 100 ? "ocr-text-extracted" : "ocr-insufficient-text", confidenceStatus: "not-calibrated" }
}