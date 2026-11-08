export type ValidatedQuestionDraft = {
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
  evidence: string
  confidence: number
}

function normaliseForEvidence(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim()
}

export function parseQuestionDraft(content: string, sourceText: string): ValidatedQuestionDraft {
  const cleaned = content.trim()
    .replace(/^\x60\x60\x60(?:json)?\s*/i, '')
    .replace(/\s*\x60\x60\x60$/, '')
  const value = JSON.parse(cleaned) as Partial<ValidatedQuestionDraft>

  if (typeof value.prompt !== 'string' || value.prompt.trim().length < 12 || value.prompt.length > 700) {
    throw new Error('The generated question prompt is invalid.')
  }
  if (!Array.isArray(value.options) || value.options.length !== 4 ||
      value.options.some(option => typeof option !== 'string' || option.trim().length < 1 || option.length > 240)) {
    throw new Error('The generated question must contain four valid answer options.')
  }
  if (new Set(value.options.map(option => option.trim().toLocaleLowerCase())).size !== 4) {
    throw new Error('The generated answer options must be distinct.')
  }
  if (!Number.isInteger(value.answerIndex) || value.answerIndex! < 0 || value.answerIndex! > 3) {
    throw new Error('The generated correct answer index is invalid.')
  }
  if (typeof value.explanation !== 'string' || value.explanation.trim().length < 25 || value.explanation.length > 2400) {
    throw new Error('The generated explanation is invalid.')
  }
  if (typeof value.evidence !== 'string' || value.evidence.trim().length < 12 || value.evidence.length > 300) {
    throw new Error('The generated evidence excerpt is invalid.')
  }
  const evidence = normaliseForEvidence(value.evidence)
  if (!evidence || !normaliseForEvidence(sourceText).includes(evidence)) {
    throw new Error('The generated evidence excerpt is not present in the learner-provided source text.')
  }
  if (typeof value.confidence !== 'number' || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) {
    throw new Error('The generated confidence value is invalid.')
  }

  return {
    prompt: value.prompt.trim(),
    options: value.options.map(option => option.trim()),
    answerIndex: value.answerIndex!,
    explanation: value.explanation.trim(),
    evidence: value.evidence.trim(),
    confidence: value.confidence,
  }
}
