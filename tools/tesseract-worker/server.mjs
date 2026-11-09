import http from "node:http"
import os from "node:os"
import path from "node:path"
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { timingSafeEqual } from "node:crypto"

const execFileAsync = promisify(execFile)
const PORT = Number(process.env.PORT || 8787)
const TOKEN = process.env.TESSERACT_WORKER_TOKEN || ""
const MAX_BYTES = 10 * 1024 * 1024
const MAX_PAGES = 30
const MAX_TEXT = 8000
const TIMEOUT_MS = 20000
const configuredConcurrency = Number(process.env.TESSERACT_MAX_CONCURRENT_JOBS || 2)
const MAX_CONCURRENT_JOBS = Number.isInteger(configuredConcurrency) ? Math.max(1, Math.min(4, configuredConcurrency)) : 2
let activeJobs = 0
const MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"])
const ALLOWED_LANGUAGES = new Set((process.env.TESSERACT_ALLOWED_LANGUAGES || "eng,afr").split(",").map(x => x.trim()).filter(Boolean))

if (!TOKEN || TOKEN.length < 32) { process.stderr.write("TESSERACT_WORKER_TOKEN must contain at least 32 characters.\n"); process.exit(1) }
if (!ALLOWED_LANGUAGES.has("eng")) { process.stderr.write("English traineddata must remain installed.\n"); process.exit(1) }

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" })
  res.end(JSON.stringify(body))
}

function authorised(req) {
  const supplied = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1] || ""
  const left = Buffer.from(supplied), right = Buffer.from(TOKEN)
  return left.length === right.length && timingSafeEqual(left, right)
}

async function readBody(req) {
  const declared = Number(req.headers["content-length"] || 0)
  if (declared > MAX_BYTES) throw Object.assign(new Error("File is too large."), { status: 413 })
  const chunks = []; let total = 0
  for await (const chunk of req) { total += chunk.length; if (total > MAX_BYTES) throw Object.assign(new Error("File is too large."), { status: 413 }); chunks.push(chunk) }
  if (!total) throw Object.assign(new Error("File is empty."), { status: 400 })
  return Buffer.concat(chunks, total)
}

async function command(file, args, deadline) {
  const remaining = deadline - Date.now()
  if (remaining <= 0) throw Object.assign(new Error("OCR processing timed out."), { killed: true })
  return execFileAsync(file, args, { timeout: remaining, maxBuffer: 2 * 1024 * 1024, windowsHide: true })
}

function hasExpectedSignature(bytes, mimeType) {
  if (mimeType === "application/pdf") return bytes.subarray(0, Math.min(bytes.length, 1024)).includes(Buffer.from("%PDF-"))
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  return false
}

function cleanText(value) {
  return value.replace(/\u0000/g, "").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_TEXT)
}

function requestedLanguages(req) {
  const raw = String(req.headers["x-ocr-languages"] || "eng+afr")
  const values = raw.split("+")
  if (!values.length || values.length > 3 || values.some(value => !/^[a-z_]{3,12}$/.test(value) || !ALLOWED_LANGUAGES.has(value))) {
    throw Object.assign(new Error("Requested OCR languages are not enabled on this worker."), { status: 400 })
  }
  return [...new Set(values)].join("+")
}

async function processFile(bytes, mimeType, languages) {
  if (!hasExpectedSignature(bytes, mimeType)) throw Object.assign(new Error("File signature does not match its declared MIME type."), { status: 415 })
  const deadline = Date.now() + TIMEOUT_MS
  const dir = await mkdtemp(path.join(os.tmpdir(), "examforge-ocr-"))
  try {
    const input = path.join(dir, mimeType === "application/pdf" ? "source.pdf" : "source-image")
    await writeFile(input, bytes, { mode: 0o600 })
    let images = []
    if (mimeType !== "application/pdf") {
      const dimensions = await command("identify", ["-ping", "-format", "%w %h %n", input], deadline)
      const [width, height, frames] = dimensions.stdout.trim().split(/\\s+/).map(Number)
      if (!Number.isInteger(width) || !Number.isInteger(height) || !Number.isInteger(frames) ||
          width < 1 || height < 1 || width > 10000 || height > 10000 || width * height > 25_000_000 || frames !== 1) {
        throw Object.assign(new Error("Image dimensions or frame count are outside the allowed range."), { status: 422 })
      }
    }
    if (mimeType === "application/pdf") {
      const info = await command("pdfinfo", [input], deadline)
      const match = info.stdout.match(/^Pages:\s+(\d+)/m), pages = Number(match?.[1] || 0)
      if (!Number.isInteger(pages) || pages < 1 || pages > MAX_PAGES) throw Object.assign(new Error("PDF page count is outside the allowed range."), { status: 422 })
      const prefix = path.join(dir, "page")
      await command("pdftoppm", ["-f", "1", "-l", String(pages), "-scale-to", "2500", "-png", input, prefix], deadline)
      images = (await readdir(dir)).filter(name => /^page-\d+\.png$/.test(name)).sort((a,b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0])).map(name => path.join(dir, name))
      if (images.length !== pages) throw new Error("PDF page rendering did not complete.")
    } else { images = [input] }

    const textPages = [], equationPages = []
    for (let index = 0; index < images.length; index++) {
      const normalized = path.join(dir, "normalized-" + index + ".png")
      await command("convert", [images[index], "-auto-orient", "-colorspace", "Gray", "-deskew", "40%", "-resize", "200%", "-contrast", normalized], deadline)
      const textResult = await command("tesseract", [normalized, "stdout", "-l", languages, "--oem", "1", "--psm", "3"], deadline)
      textPages.push("[Page " + (index + 1) + "]\n" + textResult.stdout)

      // A separate formula pass avoids aggressive deskewing, which can merge
      // adjacent mathematical glyphs. This is best-effort OCR, not symbolic parsing.
      const equationInput = path.join(dir, "equation-" + index + ".png")
      await command("convert", [images[index], "-auto-orient", "-colorspace", "Gray", equationInput], deadline)
      const equationResult = await command("tesseract", [equationInput, "stdout", "-l", "eng", "--oem", "1", "--psm", "6", "-c", "preserve_interword_spaces=1"], deadline)
      equationPages.push("[Page " + (index + 1) + "]\n" + equationResult.stdout)
    }
    const text = cleanText(textPages.join("\n\n"))
    const equationText = cleanText(equationPages.join("\n\n"))
    return {
      text,
      equationText,
      pageCount: images.length,
      engine: "tesseract",
      languages,
      qualityStatus: text.length >= 100 ? "ocr-text-extracted" : "ocr-insufficient-text",
      equationStatus: /[=<>±×÷√∫∑^_]/u.test(equationText) ? "equation-symbols-detected-best-effort" : "no-equation-symbols-detected",
      confidenceStatus: "not-calibrated",
    }
  } finally { await rm(dir, { recursive: true, force: true }) }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { status: "ok", engine: "tesseract", languages: [...ALLOWED_LANGUAGES] })
  if (req.method !== "POST" || req.url !== "/ocr") return send(res, 404, { error: "Not found." })
  if (!authorised(req)) return send(res, 401, { error: "Unauthorized." })
  if (activeJobs >= MAX_CONCURRENT_JOBS) return send(res, 429, { error: "OCR worker is busy. Retry shortly." })
  const mimeType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase()
  if (!MIME_TYPES.has(mimeType)) return send(res, 415, { error: "Unsupported OCR input type." })
  activeJobs += 1
  try {
    const languages = requestedLanguages(req)
    const result = await processFile(await readBody(req), mimeType, languages)
    return send(res, 200, result)
  } catch (error) {
    const requestedStatus = Number(error?.status)
    const status = [400, 413, 415, 422].includes(requestedStatus) ? requestedStatus : (error?.killed ? 504 : 422)
    const safeMessages = {
      400: "OCR request settings are invalid.",
      413: "OCR input exceeds the 10 MiB limit.",
      415: "OCR input type or file signature is not supported.",
      422: "OCR could not process this document. Check the file and try again.",
      504: "OCR processing timed out.",
    }
    return send(res, status, { error: safeMessages[status] })
  } finally {
    activeJobs -= 1
  }
})
server.requestTimeout = 25_000
server.headersTimeout = 10_000
server.keepAliveTimeout = 5_000
server.maxHeadersCount = 30
server.listen(PORT, "0.0.0.0", () => process.stdout.write("Tesseract worker listening on port " + PORT + "\n"))
