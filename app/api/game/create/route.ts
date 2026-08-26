import { createClient } from "@/lib/supabase/server"
import { DIFFICULTY_CONFIG } from "@/lib/types"
import { extractPdfTextForClaude, getPdfHash } from "@/lib/ai/pdf-text"
import { generateQuestionsWithClaude, type GeneratedQuestion } from "@/lib/ai/question-generation"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit/check-rate-limit"

const RATE_LIMIT_ROUTE = "game/create"
const RATE_LIMIT_MAX_EVENTS = 8
const RATE_LIMIT_WINDOW_MINUTES = 10

type Difficulty = keyof typeof DIFFICULTY_CONFIG

function envFlag(name: string, defaultValue: boolean) {
  const value = process.env[name]
  if (value == null || value === "") return defaultValue
  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 })
  }

  const rateLimit = await checkRateLimit(supabase, user.id, RATE_LIMIT_ROUTE, {
    maxEvents: RATE_LIMIT_MAX_EVENTS,
    windowMinutes: RATE_LIMIT_WINDOW_MINUTES,
  })

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit)
  }

  try {
    const formData = await req.formData()
    const pdfFile = formData.get("pdf") as File | null
    const difficulty = ((formData.get("difficulty") as string) || "normal") as Difficulty

    if (!pdfFile) {
      return Response.json({ error: "No se envio el PDF" }, { status: 400 })
    }

    const validDifficulty: Difficulty = DIFFICULTY_CONFIG[difficulty] ? difficulty : "normal"
    const config = DIFFICULTY_CONFIG[validDifficulty]
    const numQuestions = config.questions
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
    const sourceHash = getPdfHash(pdfBuffer)
    const pdfName = pdfFile.name.replace(/\.pdf$/i, "")

    if (envFlag("AI_REUSE_GENERATED_QUESTIONS", true)) {
      const reused = await tryCreateSessionFromExistingQuestions({
        supabase,
        userId: user.id,
        sourceHash,
        difficulty: validDifficulty,
        numQuestions,
        pdfName,
      })

      if (reused) {
        return Response.json({
          sessionId: reused.sessionId,
          reused: true,
          sourceMode: "reused",
          estimatedInputTokens: 0,
          truncated: false,
          cacheStatus: "disabled",
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
        })
      }
    }

    const allowDirectPdfFallback = envFlag("ANTHROPIC_ALLOW_DIRECT_PDF_FALLBACK", false)
    let sourceMode: "text_extraction_cached_prompt" | "direct_pdf_fallback" = "text_extraction_cached_prompt"
    let inputText = ""
    let inputChars = 0
    let estimatedInputTokens = 0
    let truncated = false

    try {
      const pdfText = await extractPdfTextForClaude(pdfBuffer)
      inputText = pdfText.inputText
      inputChars = pdfText.inputChars
      estimatedInputTokens = pdfText.estimatedInputTokens
      truncated = pdfText.truncated
    } catch (error) {
      if (!allowDirectPdfFallback) {
        const message = error instanceof Error ? error.message : "No se pudo extraer texto seleccionable del PDF."
        return Response.json({ error: message }, { status: 400 })
      }

      sourceMode = "direct_pdf_fallback"
      inputText = "PDF enviado directamente a Claude por fallback explicito."
      inputChars = pdfBuffer.byteLength
      estimatedInputTokens = Math.ceil(inputChars / 4)
      truncated = false
    }

    const generated = await generateQuestionsWithClaude({
      pdfName,
      pdfText: inputText,
      difficulty: validDifficulty,
      difficultyLabel: config.label,
      numQuestions,
      pdfBuffer: sourceMode === "direct_pdf_fallback" ? pdfBuffer : undefined,
      directPdfFallback: sourceMode === "direct_pdf_fallback",
    })

    const session = await createSession({
      supabase,
      userId: user.id,
      pdfName,
      difficulty: validDifficulty,
      questions: generated.questions,
      sourceHash,
      aiModel: generated.model,
      aiInputChars: inputChars,
      aiEstimatedInputTokens: estimatedInputTokens,
      aiUncachedInputTokens: generated.usage.uncachedInputTokens,
      aiOutputTokens: generated.usage.outputTokens,
      aiCacheCreationInputTokens: generated.usage.cacheCreationInputTokens,
      aiCacheReadInputTokens: generated.usage.cacheReadInputTokens,
      aiCacheStatus: generated.cacheStatus,
      aiSourceMode: generated.sourceMode,
    })

    return Response.json({
      sessionId: session.id,
      reused: false,
      sourceMode,
      estimatedInputTokens,
      truncated,
      cacheStatus: generated.cacheStatus,
      cacheReadInputTokens: generated.usage.cacheReadInputTokens,
      cacheCreationInputTokens: generated.usage.cacheCreationInputTokens,
    })
  } catch (err) {
    console.error("Game create error:", err instanceof Error ? err.message : err)
    return Response.json(
      { error: err instanceof Error ? err.message : "Error al procesar el PDF" },
      { status: 500 }
    )
  }
}

async function tryCreateSessionFromExistingQuestions(input: {
  supabase: any
  userId: string
  sourceHash: string
  difficulty: Difficulty
  numQuestions: number
  pdfName: string
}) {
  const { data: sessions, error } = await input.supabase
    .from("game_sessions")
    .select("id, total_questions")
    .eq("user_id", input.userId)
    .eq("source_hash", input.sourceHash)
    .eq("difficulty", input.difficulty)
    .gte("total_questions", input.numQuestions)
    .order("created_at", { ascending: false })
    .limit(5)

  if (error || !sessions?.length) return null

  for (const sourceSession of sessions) {
    const { data: existingQuestions, error: questionsError } = await input.supabase
      .from("questions")
      .select("question_text, options, correct_option, explanation, difficulty, question_index")
      .eq("session_id", sourceSession.id)
      .eq("user_id", input.userId)
      .order("question_index", { ascending: true })
      .limit(input.numQuestions)

    if (questionsError || !existingQuestions || existingQuestions.length < input.numQuestions) {
      continue
    }

    const { data: session, error: sessionError } = await input.supabase
      .from("game_sessions")
      .insert({
        user_id: input.userId,
        pdf_name: input.pdfName,
        difficulty: input.difficulty,
        total_questions: input.numQuestions,
        lives_remaining: 3,
        status: "in_progress",
        source_hash: input.sourceHash,
        ai_model: "reused",
        ai_input_chars: 0,
        ai_estimated_input_tokens: 0,
        ai_uncached_input_tokens: 0,
        ai_output_tokens: 0,
        ai_cache_creation_input_tokens: 0,
        ai_cache_read_input_tokens: 0,
        ai_cache_status: "disabled",
        ai_source_mode: "reused",
      })
      .select("id")
      .single()

    if (sessionError || !session) {
      console.error("Session reuse error:", sessionError)
      return null
    }

    const questionsToInsert = existingQuestions.map((q: any, index: number) => ({
      session_id: session.id,
      user_id: input.userId,
      question_text: q.question_text,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation || "",
      difficulty: input.difficulty,
      question_index: index,
    }))

    const { error: insertError } = await input.supabase.from("questions").insert(questionsToInsert)

    if (insertError) {
      console.error("Question reuse error:", insertError)
      return null
    }

    return { sessionId: session.id }
  }

  return null
}

async function createSession(input: {
  supabase: any
  userId: string
  pdfName: string
  difficulty: Difficulty
  questions: GeneratedQuestion[]
  sourceHash: string
  aiModel: string
  aiInputChars: number
  aiEstimatedInputTokens: number
  aiUncachedInputTokens: number
  aiOutputTokens: number
  aiCacheCreationInputTokens: number
  aiCacheReadInputTokens: number
  aiCacheStatus: string
  aiSourceMode: string
}) {
  const { data: session, error: sessionError } = await input.supabase
    .from("game_sessions")
    .insert({
      user_id: input.userId,
      pdf_name: input.pdfName,
      difficulty: input.difficulty,
      total_questions: input.questions.length,
      lives_remaining: 3,
      status: "in_progress",
      source_hash: input.sourceHash,
      ai_model: input.aiModel,
      ai_input_chars: input.aiInputChars,
      ai_estimated_input_tokens: input.aiEstimatedInputTokens,
      ai_uncached_input_tokens: input.aiUncachedInputTokens,
      ai_output_tokens: input.aiOutputTokens,
      ai_cache_creation_input_tokens: input.aiCacheCreationInputTokens,
      ai_cache_read_input_tokens: input.aiCacheReadInputTokens,
      ai_cache_status: input.aiCacheStatus,
      ai_source_mode: input.aiSourceMode,
    })
    .select("id")
    .single()

  if (sessionError || !session) {
    console.error("Session error:", sessionError)
    throw new Error("Error al crear la sesion")
  }

  const questionsToInsert = input.questions.map((q, index) => ({
    session_id: session.id,
    user_id: input.userId,
    question_text: q.question_text,
    options: q.options,
    correct_option: q.correct_option,
    explanation: q.explanation || "",
    difficulty: input.difficulty,
    question_index: index,
  }))

  const { error: questionsError } = await input.supabase.from("questions").insert(questionsToInsert)

  if (questionsError) {
    console.error("Questions error:", questionsError)
    throw new Error("Error al guardar preguntas")
  }

  return session
}
