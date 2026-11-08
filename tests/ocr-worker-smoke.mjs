import { spawn, spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { setTimeout as delay } from "node:timers/promises"

const port = 18787
const token = randomBytes(32).toString("hex")
const base = "http://127.0.0.1:" + port
const worker = spawn(process.execPath, ["tools/tesseract-worker/server.mjs"], {
  env: { ...process.env, PORT: String(port), TESSERACT_WORKER_TOKEN: token, TESSERACT_ALLOWED_LANGUAGES: "eng,afr" },
  stdio: ["ignore", "pipe", "pipe"],
})
let workerOutput = ""
worker.stdout.on("data", chunk => { workerOutput += chunk.toString() })
worker.stderr.on("data", chunk => { workerOutput += chunk.toString() })

async function waitForWorker() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { const response = await fetch(base + "/health"); if (response.ok) return response.json() }
    catch { /* worker is still starting */ }
    await delay(250)
  }
  throw new Error("Tesseract worker did not start: " + workerOutput)
}

function syntheticImage(text, filename) {
  const result = spawnSync("convert", ["-size", "2200x440", "xc:white", "-font", "DejaVu-Sans", "-pointsize", "112", "-fill", "black", "-gravity", "center", "-annotate", "+0+0", text, "png:" + filename], { encoding: null })
  if (result.status !== 0) throw new Error("Could not create synthetic OCR image: " + String(result.stderr))
  const read = spawnSync("cat", [filename], { encoding: null })
  if (read.status !== 0 || !read.stdout?.length) throw new Error("Could not read synthetic OCR image.")
  return read.stdout
}

async function postOcr(bytes, mimeType = "image/png", languages = "eng+afr") {
  return fetch(base + "/ocr", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": mimeType, "X-OCR-Languages": languages },
    body: bytes,
  })
}

function syntheticPdf(pageCount) {
  const objects = []
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>"
  const pageRefs = Array.from({ length: pageCount }, (_, index) => (4 + index * 2) + " 0 R").join(" ")
  objects[2] = "<< /Type /Pages /Kids [" + pageRefs + "] /Count " + pageCount + " >>"
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  for (let index = 0; index < pageCount; index++) {
    const pageId = 4 + index * 2
    const contentId = pageId + 1
    objects[pageId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents " + contentId + " 0 R >>"
    const text = "Synthetic Newton law: force equals mass times acceleration."
    const stream = "BT /F1 18 Tf 50 700 Td (" + text + ") Tj ET"
    objects[contentId] = "<< /Length " + Buffer.byteLength(stream) + " >>\nstream\n" + stream + "\nendstream"
  }
  let document = "%PDF-1.4\n"
  const offsets = [0]
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = Buffer.byteLength(document)
    document += id + " 0 obj\n" + objects[id] + "\nendobj\n"
  }
  const xrefOffset = Buffer.byteLength(document)
  document += "xref\n0 " + objects.length + "\n0000000000 65535 f \n"
  for (let id = 1; id < objects.length; id++) document += String(offsets[id]).padStart(10, "0") + " 00000 n \n"
  document += "trailer\n<< /Size " + objects.length + " /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF"
  return Buffer.from(document)
}

try {
  const health = await waitForWorker()
  if (!health.languages.includes("eng") || !health.languages.includes("afr")) throw new Error("Worker health must advertise English and Afrikaans traineddata.")

  const textImage = syntheticImage("Ohms law voltage equals current times resistance", "/tmp/examforge-ocr-text.png")
  const unauthorised = await fetch(base + "/ocr", { method: "POST", headers: { "Content-Type": "image/png" }, body: textImage })
  if (unauthorised.status !== 401) throw new Error("Worker must reject requests without its bearer token.")

  const unsupported = await fetch(base + "/ocr", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "image/webp" }, body: textImage })
  if (unsupported.status !== 415) throw new Error("Worker must reject unsupported MIME types.")

  const badLanguage = await postOcr(textImage, "eng+zul")
  if (badLanguage.status !== 400) throw new Error("Worker must reject uninstalled or unapproved languages.")

  const badSignature = await fetch(base + "/ocr", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "image/png" }, body: Buffer.from("not a PNG") })
  if (badSignature.status !== 415) throw new Error("Worker must reject files with mismatched signatures.")

  const textResponse = await postOcr(textImage)
  if (!textResponse.ok) throw new Error("Worker text OCR failed: " + await textResponse.text())
  const textPayload = await textResponse.json()
  if (textPayload.engine !== "tesseract" || textPayload.pageCount !== 1 ||
      !/hms law|ohms law/i.test(textPayload.text) || textPayload.languages !== "eng+afr" ||
      textPayload.confidenceStatus !== "not-calibrated") {
    throw new Error("Worker did not return expected multilingual text OCR: " + JSON.stringify(textPayload))
  }

  const afrikaansImage = syntheticImage("Die massa is twee kilogram", "/tmp/examforge-ocr-afrikaans.png")
  const afrikaansResponse = await postOcr(afrikaansImage, "afr")
  if (!afrikaansResponse.ok) throw new Error("Afrikaans OCR failed: " + await afrikaansResponse.text())
  const afrikaansPayload = await afrikaansResponse.json()
  if (!/massa/i.test(afrikaansPayload.text) || afrikaansPayload.languages !== "afr") {
    throw new Error("Afrikaans traineddata did not recognise the synthetic phrase: " + JSON.stringify(afrikaansPayload))
  }

  const equationImage = syntheticImage("F = m a", "/tmp/examforge-ocr-equation.png")
  const equationResponse = await postOcr(equationImage, "eng")
  if (!equationResponse.ok) throw new Error("Worker equation OCR failed: " + await equationResponse.text())
  const equationPayload = await equationResponse.json()
  if (!/f\s*=\s*ma/i.test(equationPayload.equationText.replace(/\s+/g, " "))) {
    throw new Error("Equation-oriented pass did not preserve the synthetic F = m a formula: " + JSON.stringify(equationPayload))
  }
  if (!["equation-symbols-detected-best-effort", "no-equation-symbols-detected"].includes(equationPayload.equationStatus)) {
    throw new Error("Equation status must use an explicit bounded value.")
  }

  const beforeTemp = new Set((await readdir(tmpdir())).filter(name => name.startsWith("examforge-ocr-")))
  const syntheticOnePagePdf = syntheticPdf(1)
  const pdfResponse = await postOcr(syntheticOnePagePdf, "application/pdf", "eng")
  if (!pdfResponse.ok) throw new Error("Synthetic PDF OCR failed: " + await pdfResponse.text())
  const pdfPayload = await pdfResponse.json()
  if (pdfPayload.pageCount !== 1 || !/newton law/i.test(pdfPayload.text)) {
    throw new Error("Synthetic scanned-PDF OCR did not return expected text: " + JSON.stringify(pdfPayload))
  }
  const oversizedPagePdf = await postOcr(syntheticPdf(31), "application/pdf", "eng")
  if (oversizedPagePdf.status !== 422) throw new Error("Worker must reject PDFs exceeding 30 pages.")
  const afterTemp = (await readdir(tmpdir())).filter(name => name.startsWith("examforge-ocr-"))
  if (afterTemp.some(name => !beforeTemp.has(name))) throw new Error("OCR worker left temporary document directories behind.")

  const tooLarge = await fetch(base + "/ocr", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "image/png" }, body: Buffer.alloc(10 * 1024 * 1024 + 1) })
  if (tooLarge.status !== 413) throw new Error("Worker must reject files larger than 10 MiB.")
  process.stdout.write("Synthetic multilingual and equation-oriented Tesseract worker smoke tests passed.\n")
} finally {
  worker.kill("SIGTERM")
}
