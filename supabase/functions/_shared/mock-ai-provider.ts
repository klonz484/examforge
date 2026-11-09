/**
 * Deterministic mock provider for non-production tests only.
 * This module never performs network requests and must not be imported by
 * the production question-generation path.
 */
export type MockQuestionContext = { grade: number; subjectName: string; topic: string; sourceText: string }

export function createMockQuestionResponse(context: MockQuestionContext): string {
  const source = context.sourceText.replace(/\s+/g, " ").trim()
  if (source.length < 100) throw new Error("Synthetic source text must contain at least 100 characters.")
  const evidence = source.slice(0, Math.min(180, source.length)).trim()
  if (evidence.length < 12) throw new Error("Synthetic source text does not contain enough evidence.")
  return JSON.stringify({
    prompt: "[SIMULATED] Which statement is directly supported by the supplied " + context.topic + " study text?",
    options: [evidence, "The source states that all quantities are always constant.", "The source states that the topic has no measurable relationship.", "The source states that the opposite process must always occur."],
    answerIndex: 0,
    explanation: "SIMULATED TEST EXPLANATION: option A repeats the supplied evidence excerpt. This deterministic response tests parsing and evidence validation; it is not a teaching-quality or curriculum-accuracy assessment.",
    evidence,
    confidence: 0.5,
    provenance: "synthetic-mock-provider",
    synthetic: true,
    context: { grade: context.grade, subjectName: context.subjectName, topic: context.topic },
  })
}