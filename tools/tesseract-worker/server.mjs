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
const TIMEOUT_MS = 15000
const MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"])

if (!TOKEN || TOKEN.length < 32) { process.stderr.write("TESSERACT_WORKER_TOKEN must contain at least 32 characters.\n"); process.exit(1) }

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

async function processFile(bytes, mimeType) {
  if (!hasExpectedSignature(bytes, mimeType)) throw Object.assign(new Error("File signature does not match its declared MIME type."), { status: 415 })
  const deadline = Date.now() + TIMEOUT_MS
  const dir = await mkdtemp(path.join(os.tmpdir(), "examforge-ocr-"))
  try {
    const input = path.join(dir, mimeType === "application/pdf" ? "source.pdf" : "source-image")
    await writeFile(input, bytes, { mode: 0o600 })
    let images = []
    if (mimeType === "application/pdf") {
      const info = await command("pdfinfo", [input], deadline)
      const match = info.stdout.match(/^Pages:\s+(\d+)/m), pages = Number(match?.[1] || 0)
      if (!Number.isInteger(pages) || pages < 1 || pages > MAX_PAGES) throw Object.assign(new Error("PDF page count is outside the allowed range."), { status: 422 })
      const prefix = path.join(dir, "page")
      await command("pdftoppm", ["-f", "1", "-l", String(pages), "-scale-to", "2500", "-png", input, prefix], deadline)
      images = (await readdir(dir)).filter(name => /^page-\d+\.png$/.test(name)).sort((a,b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0])).map(name => path.join(dir, name))
      if (images.length !== pages) throw new Error("PDF page rendering did not complete.")
    } else { images = [input] }
    const output = []
    for (let index = 0; index < images.length; index++) {
      const result = await command("tesseract", [images[index], "stdout", "-l", "eng", "--psm", "3"], deadline)
      output.push("[Page " + (index + 1) + "]\n" + result.stdout)
    }
    const text = cleanText(output.join("\n\n"))
    return { text, pageCount: images.length, engine: "tesseract", language: "eng", qualityStatus: text.length >= 100 ? "ocr-text-extracted" : "ocr-insufficient-text", confidenceStatus: "not-calibrated" }
  } finally { await rm(dir, { recursive: true, force: true }) }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { status: "ok", engine: "tesseract" })
  if (req.method !== "POST" || req.url !== "/ocr") return send(res, 404, { error: "Not found." })
  if (!authorised(req)) return send(res, 401, { error: "Unauthorized." })
  const mimeType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase()
  if (!MIME_TYPES.has(mimeType)) return send(res, 415, { error: "Unsupported OCR input type." })
  try { const result = await processFile(await readBody(req), mimeType); return send(res, 200, result) }
  catch (error) { const status = Number(error?.status) || (error?.killed ? 504 : 422); return send(res, status, { error: status === 504 ? "OCR processing timed out." : String(error?.message || "OCR failed.") }) }
})
server.listen(PORT, "0.0.0.0", () => process.stdout.write("Tesseract worker listening on port " + PORT + "\n"))