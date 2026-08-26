import Anthropic from "@anthropic-ai/sdk"
import {
  buildCacheControl,
  decidePromptCache,
  getAnthropicBetaHeaders,
  summarizeAnthropicUsage,
  type AnthropicCacheStatus,
  type AnthropicUsageSummary,
  type CacheControlWithTtl,
} from "@/lib/ai/anthropic-cache"
import { estimateTokens } from "@/lib/ai/pdf-text"

// @anthropic-ai/sdk@0.39.0 types cache_control without `ttl` (see anthropic-cache.ts).
// These widen the two block shapes we actually send so the SDK's own types keep
// checking everything else (model, message shape, document source) without a blanket `as any`.
type TextBlockWithTtlCache = Omit<Anthropic.TextBlockParam, "cache_control"> & {
  cache_control?: CacheControlWithTtl
}
type DocumentBlockWithTtlCache = Omit<Anthropic.DocumentBlockParam, "cache_control"> & {
  cache_control?: CacheControlWithTtl
}

export interface GeneratedQuestion {
  question_text: string
  options: string[]
  correct_option: number
  explanation: string
}

export type QuestionDifficulty = "easy" | "normal" | "hard"

export interface GenerateQuestionsInput {
  pdfName: string
  pdfText: string
  difficulty: QuestionDifficulty
  difficultyLabel: string
  numQuestions: number
  pdfBuffer?: Buffer
  directPdfFallback?: boolean
}

export interface GenerateQuestionsResult {
  questions: GeneratedQuestion[]
  model: string
  maxOutputTokens: number
  cacheStatus: AnthropicCacheStatus
  usage: AnthropicUsageSummary
  sourceMode: "text_extraction_cached_prompt" | "direct_pdf_fallback"
}

const SYSTEM_PROMPT =
  "Eres un profesor experto en evaluacion educativa. Creas preguntas claras, utiles y verificables a partir del material entregado."

const STABLE_INSTRUCTIONS = [
  "Genera preguntas de opcion multiple en espanol.",
  "Usa solo informacion del contenido proporcionado.",
  "No inventes datos externos.",
  "Mezcla definicion, comprension, aplicacion e interpretacion cuando aplique.",
  "Evita preguntas obvias, vagas o basadas en copiar frases largas.",
  "La salida debe ser solo JSON valido, sin markdown.",
].join("\n")

// Per-request difficulty calibration on a 1-10 scale. Kept out of
// STABLE_INSTRUCTIONS on purpose: that block (plus the PDF text right after
// it) is what carries the cache_control breakpoint for Anthropic prompt
// caching, so it must stay byte-identical across every call regardless of
// difficulty to keep cache hits working exactly as before. This guidance
// only affects the small per-request "task" block appended after the
// cached prefix, so it costs a few dozen extra tokens per call but never
// invalidates or fragments the cache.
const DIFFICULTY_GUIDANCE: Record<QuestionDifficulty, string> = {
  easy:
    "Nivel de dificultad conceptual: 3/10. Preguntas de reconocimiento directo: definiciones, datos explicitos y hechos aislados que aparecen tal cual en el texto. No combines varias ideas ni pidas inferencias. Los distractores deben ser claramente incorrectos para quien leyo el material.",
  normal:
    "Nivel de dificultad conceptual: 6/10. Preguntas de comprension y aplicacion: exige relacionar dos ideas del texto o aplicar un concepto a un caso simple no copiado literalmente. Los distractores deben ser plausibles pero distinguibles prestando atencion.",
  hard:
    "Nivel de dificultad conceptual: 9/10. Preguntas de analisis e inferencia: exige conectar varias partes del texto, razonar sobre causas/consecuencias, o distinguir matices y excepciones. Los distractores deben ser sutiles y requerir comprension profunda del material para descartarlos.",
}

export async function generateQuestionsWithClaude(input: GenerateQuestionsInput): Promise<GenerateQuestionsResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5"
  const maxOutputTokens = getMaxOutputTokens(input.numQuestions)
  const cacheDecision = decidePromptCache(model, estimateTokens(input.pdfText))
  const cacheControl = buildCacheControl(cacheDecision)

  const response = await client.messages.create(
    {
      model,
      max_tokens: maxOutputTokens,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildContentBlocks(input, cacheControl),
        },
      ],
    },
    {
      headers: getAnthropicBetaHeaders(cacheDecision),
    }
  )

  const text = extractTextContent(response.content)
  const parsed = parseAndValidateQuestions(text, input.numQuestions)

  return {
    questions: parsed,
    model,
    maxOutputTokens,
    cacheStatus: cacheDecision.status,
    usage: summarizeAnthropicUsage(response.usage),
    sourceMode: input.directPdfFallback ? "direct_pdf_fallback" : "text_extraction_cached_prompt",
  }
}

function buildContentBlocks(
  input: GenerateQuestionsInput,
  cacheControl: CacheControlWithTtl | undefined
): Array<TextBlockWithTtlCache | DocumentBlockWithTtlCache> {
  const task = [
    `PDF: ${input.pdfName}`,
    `Dificultad: ${input.difficultyLabel}`,
    DIFFICULTY_GUIDANCE[input.difficulty],
    `Numero exacto de preguntas: ${input.numQuestions}`,
    "",
    "Formato obligatorio:",
    '{"questions":[{"question_text":"Pregunta clara","options":["Opcion A","Opcion B","Opcion C","Opcion D"],"correct_option":0,"explanation":"Explicacion breve"}]}',
    "",
    "Reglas finales:",
    `- Devuelve exactamente ${input.numQuestions} preguntas.`,
    "- Cada pregunta debe tener exactamente 4 opciones.",
    "- correct_option debe ser un entero 0, 1, 2 o 3.",
    "- explanation debe tener maximo 2 frases.",
    "- Devuelve solo el objeto JSON.",
  ].join("\n")

  if (input.directPdfFallback && input.pdfBuffer) {
    return [
      { type: "text", text: STABLE_INSTRUCTIONS },
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: input.pdfBuffer.toString("base64"),
        },
        ...(cacheControl ? { cache_control: cacheControl } : {}),
      },
      { type: "text", text: task },
    ]
  }

  return [
    { type: "text", text: STABLE_INSTRUCTIONS },
    {
      type: "text",
      text: `Contenido limpio del PDF:\n\n${input.pdfText}`,
      ...(cacheControl ? { cache_control: cacheControl } : {}),
    },
    { type: "text", text: task },
  ]
}

function getMaxOutputTokens(numQuestions: number) {
  const envMax = Number.parseInt(process.env.ANTHROPIC_MAX_OUTPUT_TOKENS ?? "2800", 10)
  const hardMax = Number.isFinite(envMax) && envMax > 0 ? envMax : 2800
  const estimated = Math.max(1400, numQuestions * 220)
  return Math.min(hardMax, estimated, 2800)
}

function extractTextContent(content: unknown) {
  const blocks = Array.isArray(content) ? content : []
  const text = blocks
    .filter((block): block is { type: string; text: string } => {
      return Boolean(block && typeof block === "object" && (block as any).type === "text" && typeof (block as any).text === "string")
    })
    .map((block) => block.text)
    .join("\n")
    .trim()

  if (!text) {
    throw new Error("Respuesta inesperada del modelo: no devolvio texto.")
  }

  return text
}

export function parseAndValidateQuestions(rawText: string, expectedCount: number) {
  const jsonText = extractJsonObject(rawText)
  let parsed: unknown

  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error("Claude devolvio JSON invalido y no se pudo reparar automaticamente.")
  }

  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as any).questions)) {
    throw new Error("Claude devolvio una estructura invalida: falta questions[].")
  }

  const questions = (parsed as any).questions
    .map(normalizeQuestion)
    .filter((question: GeneratedQuestion | null): question is GeneratedQuestion => question !== null)

  if (questions.length < expectedCount) {
    throw new Error(`Claude devolvio ${questions.length} preguntas validas, pero se esperaban ${expectedCount}.`)
  }

  return questions.slice(0, expectedCount)
}

function extractJsonObject(rawText: string) {
  const withoutFences = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim()

  const first = withoutFences.indexOf("{")
  const last = withoutFences.lastIndexOf("}")

  if (first === -1 || last === -1 || last <= first) {
    throw new Error("La respuesta no contiene un objeto JSON.")
  }

  return withoutFences.slice(first, last + 1)
}

function normalizeQuestion(value: unknown): GeneratedQuestion | null {
  if (!value || typeof value !== "object") return null
  const question = value as Record<string, unknown>
  const questionText = typeof question.question_text === "string" ? question.question_text.trim() : ""
  const options = Array.isArray(question.options)
    ? question.options.map((option) => (typeof option === "string" ? option.trim() : ""))
    : []
  const correctOption = question.correct_option
  const explanation = typeof question.explanation === "string" ? question.explanation.trim() : ""

  if (!questionText) return null
  if (options.length !== 4 || options.some((option) => !option)) return null
  if (typeof correctOption !== "number" || !Number.isInteger(correctOption) || correctOption < 0 || correctOption > 3) return null

  return {
    question_text: questionText,
    options,
    correct_option: correctOption,
    explanation,
  }
}
