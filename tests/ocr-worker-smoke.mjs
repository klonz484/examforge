import { spawn, spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { setTimeout as delay } from "node:timers/promises"

const port = 18787
const token = randomBytes(32).toString("hex")
const worker = spawn(process.execPath, ["tools/tesseract-worker/server.mjs"], {
  env: { ...process.env, PORT: String(port), TESSERACT_WORKER_TOKEN: token },
  stdio: ["ignore", "pipe", "pipe"],
})
let workerOutput = ""
worker.stdout.on("data", chunk => { workerOutput += chunk.toString() })
worker.stderr.on("data", chunk => { workerOutput += chunk.toString() })

async function waitForWorker() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { const response = await fetch("http://127.0.0.1:" + port + "/health"); if (response.ok) return }
    catch { /* worker is still starting */ }
    await delay(250)
  }
  throw new Error("Tesseract worker did not start: " + workerOutput)
}

try {
  await waitForWorker()
  const image = spawnSync("convert", ["-size", "1800x360", "xc:white", "-font", "DejaVu-Sans", "-pointsize", "76", "-fill", "black", "-gravity", "center", "-annotate", "+0+0", "Ohms law: voltage equals current times resistance", "png:-"], { encoding: null })
  if (image.status !== 0 || !image.stdout?.length) throw new Error("Could not create synthetic OCR image: " + String(image.stderr))

  const unauthorised = await fetch("http://127.0.0.1:" + port + "/ocr", { method: "POST", headers: { "Content-Type": "image/png" }, body: image.stdout })
  if (unauthorised.status !== 401) throw new Error("Worker must reject requests without its bearer token.")

  const unsupported = await fetch("http://127.0.0.1:" + port + "/ocr", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "image/webp" }, body: image.stdout })
  if (unsupported.status !== 415) throw new Error("Worker must reject unsupported MIME types.")

  const badSignature = await fetch("http://127.0.0.1:" + port + "/ocr", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "image/png" }, body: Buffer.from("not a PNG") })
  if (badSignature.status !== 415) throw new Error("Worker must reject files with mismatched signatures.")

  const result = await fetch("http://127.0.0.1:" + port + "/ocr", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "image/png" }, body: image.stdout })
  if (!result.ok) throw new Error("Worker OCR failed with status " + result.status + ": " + await result.text())
  const payload = await result.json()
  if (payload.engine !== "tesseract" || payload.pageCount !== 1 || !/ohms law/i.test(payload.text) || payload.confidenceStatus !== "not-calibrated") {
    throw new Error("Worker did not return the expected bounded synthetic OCR result: " + JSON.stringify(payload))
  }
  const tooLarge = await fetch("http://127.0.0.1:" + port + "/ocr", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "image/png" }, body: Buffer.alloc(10 * 1024 * 1024 + 1) })
  if (tooLarge.status !== 413) throw new Error("Worker must reject files larger than 10 MiB.")
  process.stdout.write("Synthetic Tesseract worker smoke tests passed.\n")
} finally {
  worker.kill("SIGTERM")
}