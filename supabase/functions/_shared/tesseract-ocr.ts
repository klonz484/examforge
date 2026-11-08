import { MAX_EXTRACTED_TEXT_CHARS, MAX_NOTE_BYTES, cleanExtractedText } from "./document-validation.ts"

export type TesseractOcrResult = {
  text: string
  equationText: string
  pageCount: number
  engine: "tesseract"
  languages: string
  qualityStatus: "ocr-text-extracted" | "ocr-insufficient-text"
  equationStatus: "equation-symbols-detected-best-effort" | "no-equation-symbols-detected"
  confidenceStatus: "not-calibrated"
}

export async function runTesseractOcr(
  bytes: Uint8Array,
  mimeType: string,
  endpoint: string,
  bearerToken: string,
  languages = "eng+afr",
): Promise<TesseractOcrResult> {
  if (bytes.byteLength < 1 || bytes.byteLength > MAX_NOTE_BYTES) throw new Error("OCR input is outside the allowed file-size range.")
  if (!["application/pdf", "image/jpeg", "image/png"].includes(mimeType)) throw new Error("Tesseract OCR supports PDF, JPEG and PNG inputs in this implementation.")
  if (!endpoint || !bearerToken) throw new Error("The private OCR worker is not configured.")
  if (!/^(eng|afr)(\+(eng|afr)){0,2}$/.test(languages)) throw new Error("Requested OCR languages are not allowed.")
  const url = new URL(endpoint)
  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) throw new Error("The OCR worker endpoint must use HTTPS outside local development.")
  const response = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(25_000),
    headers: {
      Authorization: "Bearer " + bearerToken,
      "Content-Type": mimeType,
      "Cache-Control": "no-store",
      "X-OCR-Languages": languages,
    },
    body: bytes,
  })
  if (!response.ok) throw new Error("The private OCR worker returned status " + response.status + ".")
  const value = await response.json() as Record<string, unknown>
  if (value.engine !== "tesseract" || value.languages !== languages ||
      !Number.isInteger(value.pageCount) || Number(value.pageCount) < 1 || Number(value.pageCount) > 30 ||
      typeof value.text !== "string" || typeof value.equationText !== "string" ||
      !["equation-symbols-detected-best-effort", "no-equation-symbols-detected"].includes(String(value.equationStatus))) {
    throw new Error("The private OCR worker returned an invalid response.")
  }
  const text = cleanExtractedText(value.text, MAX_EXTRACTED_TEXT_CHARS)
  const equationText = cleanExtractedText(value.equationText, MAX_EXTRACTED_TEXT_CHARS)
  return {
    text, equationText, pageCount: Number(value.pageCount), engine: "tesseract", languages,
    qualityStatus: text.length >= 100 ? "ocr-text-extracted" : "ocr-insufficient-text",
    equationStatus: value.equationStatus as TesseractOcrResult["equationStatus"],
    confidenceStatus: "not-calibrated",
  }
}
