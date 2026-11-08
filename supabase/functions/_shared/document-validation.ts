export const MAX_NOTE_BYTES = 10 * 1024 * 1024
export const MAX_PDF_PAGES = 30
export const MAX_EXTRACTED_TEXT_CHARS = 8_000

export const SUPPORTED_NOTE_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export function isAllowedNoteMimeType(mimeType: string): boolean {
  return SUPPORTED_NOTE_MIME_TYPES.has(mimeType)
}

export function isOwnedNoteStoragePath(userId: string, path: string): boolean {
  if (!userId || !path || path.length > 512 || path.includes('\\') || path.includes('\0')) return false
  const parts = path.split('/')
  return parts.length >= 2 &&
    parts[0] === userId &&
    parts.slice(1).every(part => part.length > 0 && part !== '.' && part !== '..')
}

export function hasPdfMagicBytes(bytes: Uint8Array): boolean {
  const header = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.length, 1024)))
  return header.includes('%PDF-')
}

export function cleanExtractedText(input: string, maxChars = MAX_EXTRACTED_TEXT_CHARS): string {
  return input
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxChars)
}

export function hasUsableStudyText(input: string): boolean {
  const normalised = input.replace(/\s+/g, ' ').trim()
  const words = normalised.match(/[\p{L}\p{N}]{2,}/gu) ?? []
  return normalised.length >= 100 && words.length >= 15
}
