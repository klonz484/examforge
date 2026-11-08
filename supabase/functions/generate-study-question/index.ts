import { createClient } from "npm:@supabase/supabase-js@2"

type QuestionDraft = {
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
  confidence: number
}

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(status: number, body: unknown, origin: string | null) {
  const allowed = new Set([
    "https://klonz484.github.io",
    "http://127.0.0.1:4173",
    "http://localhost:5173",
    ...(Deno.env.get("AI_ALLOWED_ORIGINS") ?? "").split(",").map(value => value.trim()).filter(Boolean),
  ])
  const originAllowed = Boolean(origin && allowed.has(origin))
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Origin": originAllowed ? origin! : "null",
      "Vary": "Origin",
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  })
}

function parseDraft(content: string): QuestionDraft {
  const cleaned = content.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "")
  const value = JSON.parse(cleaned) as Partial<QuestionDraft>
  if (typeof value.prompt !== "string" || value.prompt.trim().length < 12 || value.prompt.length > 700) {
    throw new Error("The generated question prompt is invalid.")
  }
  if (!Array.isArray(value.options) || value.options.length !== 4 ||
      value.options.some(option => typeof option !== "string" || option.trim().length < 1 || option.length > 240)) {
    throw new Error("The generated question must contain four valid answer options.")
  }
  if (new Set(value.options.map(option => option.trim().toLowerCase())).size !== 4) {
    throw new Error("The generated answer options must be distinct.")
  }
  if (!Number.isInteger(value.answerIndex) || value.answerIndex! < 0 || value.answerIndex! > 3) {
    throw new Error("The generated correct answer index is invalid.")
  }
  if (typeof value.explanation !== "string" || value.explanation.trim().length < 25 || value.explanation.length > 2400) {
    throw new Error("The generated explanation is invalid.")
  }
  if (typeof value.confidence !== "number" || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) {
    throw new Error("The generated confidence value is invalid.")
  }
  return {
    prompt: value.prompt.trim(),
    options: value.options.map(option => option.trim()),
    answerIndex: value.answerIndex!,
    explanation: value.explanation.trim(),
    confidence: value.confidence,
  }
}

Deno.serve(async request => {
  const origin = request.headers.get("Origin")
  if (request.method === "OPTIONS") return json(204, {}, origin)
  if (request.method !== "POST") return json(405, { error: "Method not allowed." }, origin)

  const authorization = request.headers.get("Authorization")
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!bearer) return json(401, { error: "Sign in to use AI study tools." }, origin)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const endpoint = Deno.env.get("AI_STUDY_ENDPOINT")
  const apiKey = Deno.env.get("AI_STUDY_API_KEY")
  const model = Deno.env.get("AI_STUDY_MODEL")

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(503, { error: "AI study service is not configured securely." }, origin)
  }
  if (!endpoint || !apiKey || !model) {
    return json(503, { error: "AI provider credentials have not been configured by the project owner." }, origin)
  }

  let endpointUrl: URL
  try {
    endpointUrl = new URL(endpoint)
  } catch {
    return json(503, { error: "AI provider endpoint configuration is invalid." }, origin)
  }
  if (endpointUrl.protocol !== "https:") {
    return json(503, { error: "AI provider endpoint must use HTTPS." }, origin)
  }

  const learnerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { data: userData, error: authError } = await learnerClient.auth.getUser(bearer)
  const learner = userData.user
  if (authError || !learner) return json(401, { error: "Your sign-in session is invalid. Sign in again." }, origin)

  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return json(400, { error: "Request body must be valid JSON." }, origin)
  }

  const grade = Number(input.grade)
  const subjectId = typeof input.subjectId === "string" ? input.subjectId.trim() : ""
  const subjectName = typeof input.subjectName === "string" ? input.subjectName.trim() : ""
  const topic = typeof input.topic === "string" ? input.topic.trim() : ""
  const sourceText = typeof input.sourceText === "string" ? input.sourceText.trim() : ""

  if (!Number.isInteger(grade) || grade < 10 || grade > 12 ||
      !/^[a-z0-9-]{2,80}$/.test(subjectId) ||
      subjectName.length < 2 || subjectName.length > 80 ||
      topic.length < 2 || topic.length > 100 ||
      sourceText.length < 100 || sourceText.length > 8000) {
    return json(400, { error: "Provide a valid Grade 10–12 subject, topic, and 100–8,000 characters of study text." }, origin)
  }

  // The quota is reserved atomically before the provider is called.
  const { data: allowed, error: quotaError } = await adminClient.rpc("reserve_ai_study_request", {
    p_user_id: learner.id,
    p_daily_limit: 5,
  })
  if (quotaError) {
    console.error("AI quota reservation failed:", quotaError.message)
    return json(503, { error: "AI usage controls are temporarily unavailable. Try again later." }, origin)
  }
  if (allowed !== true) {
    return json(429, { error: "You have reached today's AI question-draft limit. You can continue using ordinary practice." }, origin)
  }

  const systemPrompt = [
    "You create one original educational multiple-choice practice question for a South African FET learner.",
    "Use only the learner-provided source text as factual grounding. Do not copy long passages.",
    "Never claim the question is an official DBE paper, memo, or certified question.",
    "Return one JSON object only with keys: prompt, options, answerIndex, explanation, confidence.",
    "options must contain exactly four distinct strings. answerIndex must be an integer from 0 to 3.",
    "The explanation must show the reasoning clearly and suit the supplied grade and topic.",
    "confidence must be a number from 0 to 1 representing confidence that the question is supported by the supplied text.",
    "If the source text is insufficient, return a question that clearly tests only what is present and use a low confidence value.",
  ].join(" ")

  let rawOutput = ""
  try {
    const providerResponse = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Grade: ${grade}\nSubject: ${subjectName}\nTopic: ${topic}\n\nLearner-provided study text:\n${sourceText}`,
          },
        ],
      }),
    })
    if (!providerResponse.ok) {
      console.error("AI provider returned status", providerResponse.status)
      return json(502, { error: "The AI provider could not complete this request. Your study progress is unaffected." }, origin)
    }
    const providerBody = await providerResponse.json()
    rawOutput = providerBody?.choices?.[0]?.message?.content
    if (typeof rawOutput !== "string") throw new Error("Provider response did not contain generated text.")
  } catch (error) {
    console.error("AI provider request failed:", error instanceof Error ? error.message : "unknown provider error")
    return json(502, { error: "AI question generation failed. Your existing study data was not changed." }, origin)
  }

  let draft: QuestionDraft
  try {
    draft = parseDraft(rawOutput)
  } catch (error) {
    console.error("AI draft validation failed:", error instanceof Error ? error.message : "invalid response")
    return json(502, { error: "The AI response did not meet ExamForge's question quality checks. Try a different section of notes." }, origin)
  }

  const { error: usageError } = await adminClient.rpc("record_ai_study_usage", {
    p_user_id: learner.id,
    p_input_chars: sourceText.length,
    p_output_chars: rawOutput.length,
  })
  if (usageError) {
    console.error("AI usage accounting failed:", usageError.message)
    return json(503, { error: "The draft could not be saved because usage accounting failed." }, origin)
  }

  const provenance = "AI-generated from learner-provided study text. Not an official DBE question, paper, memo, or endorsement."
  const { data: saved, error: saveError } = await adminClient.from("generated_questions").insert({
    user_id: learner.id,
    subject: subjectName,
    subject_id: subjectId,
    grade,
    topic,
    question_type: "mcq",
    prompt: draft.prompt,
    options: draft.options,
    answer_key: { correct_index: draft.answerIndex },
    explanation: draft.explanation,
    confidence: draft.confidence,
    review_status: "pending",
    source_label: "AI-generated practice draft",
    provenance,
    generation_model: model,
  }).select("id").single()

  if (saveError || !saved?.id) {
    console.error("AI draft persistence failed:", saveError?.message ?? "no row returned")
    return json(500, { error: "The generated draft could not be saved. Your existing learner data is unchanged." }, origin)
  }

  // Do not send the answer key to the browser. Draft stays pending until the learner reviews it.
  return json(201, {
    id: saved.id,
    prompt: draft.prompt,
    options: draft.options,
    grade,
    subjectId,
    subjectName,
    topic,
    confidence: draft.confidence,
    answerIndex: draft.answerIndex,
    explanation: draft.explanation,
    sourceLabel: "AI-generated practice draft",
    provenance,
    reviewStatus: "pending",
  }, origin)
})
