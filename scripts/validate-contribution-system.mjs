import { readFileSync } from 'node:fs'

const required = [
  ['docs/ENGINEERING-ECOSYSTEM.md', ['## Defaults', '## Three layers', '## Reuse-first workflow', '## Contribution requirements']],
  ['docs/PROJECT-CLOSEOUT.md', ['## Quality gate', '## Reusable asset review', '## Safe extraction', '## Promotion decision', '## Closeout summary']],
  ['docs/REUSABLE-ASSET-REGISTER.md', ['| Asset |', '## Promotion status']],
  ['.github/PULL_REQUEST_TEMPLATE.md', ['## Reuse-first review', '## Quality checks', '## Reusable asset contribution', '## Closeout']],
]
let failed = false
for (const [path, headings] of required) {
  let content
  try { content = readFileSync(path, 'utf8') } catch {
    console.error(`FAIL: missing ${path}`); failed = true; continue
  }
  for (const heading of headings) if (!content.includes(heading)) {
    console.error(`FAIL: ${path} is missing required section: ${heading}`); failed = true
  }
  if (headings.every((heading) => content.includes(heading))) console.log(`PASS: ${path}`)
}
if (failed) process.exit(1)
console.log('Contribution workflow structure validation passed.')
