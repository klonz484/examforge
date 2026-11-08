import { readdir, readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const assetDirectory = new URL('../dist/assets/', import.meta.url)
const entries = await readdir(assetDirectory)
const jsFiles = entries.filter(name => name.endsWith('.js'))
const cssFiles = entries.filter(name => name.endsWith('.css'))

if (jsFiles.length === 0 || cssFiles.length === 0) {
  throw new Error('Production build did not emit both JavaScript and CSS assets.')
}

async function compressedTotal(files) {
  let total = 0
  for (const file of files) {
    const bytes = await readFile(new URL(file, assetDirectory))
    total += gzipSync(bytes).byteLength
  }
  return total
}

const jsGzip = await compressedTotal(jsFiles)
const cssGzip = await compressedTotal(cssFiles)
const combinedGzip = jsGzip + cssGzip
const budgets = {
  javascript: 180 * 1024,
  css: 20 * 1024,
  combined: 200 * 1024,
}

console.log(`JavaScript gzip: ${(jsGzip / 1024).toFixed(1)} KiB / 180 KiB`)
console.log(`CSS gzip: ${(cssGzip / 1024).toFixed(1)} KiB / 20 KiB`)
console.log(`Combined gzip: ${(combinedGzip / 1024).toFixed(1)} KiB / 200 KiB`)

const failures = []
if (jsGzip > budgets.javascript) failures.push('JavaScript gzip budget exceeded')
if (cssGzip > budgets.css) failures.push('CSS gzip budget exceeded')
if (combinedGzip > budgets.combined) failures.push('Combined gzip budget exceeded')

if (failures.length) {
  throw new Error(failures.join('; '))
}
