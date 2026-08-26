import { createHash } from "crypto"

export interface PdfTextResult {
  fullTextChars: number
  inputText: string
  inputChars: number
  estimatedInputTokens: number
  truncated: boolean
  pageCount: number
}

const MIN_SELECTABLE_TEXT_CHARS = 600

export async function extractPdfTextForClaude(pdfBuffer: Buffer): Promise<PdfTextResult> {
  const pdfParse = (await import("pdf-parse")).default
  const parsed = await pdfParse(pdfBuffer)
  const cleaned = cleanPdfText(parsed.text ?? "")

  if (cleaned.length < MIN_SELECTABLE_TEXT_CHARS) {
    throw new Error(
      "El PDF no tiene suficiente texto seleccionable. Sube un PDF con texto real o aplica OCR antes de generar preguntas."
    )
  }

  const maxInputChars = getMaxInputChars()
  const limited = limitTextDistributed(cleaned, maxInputChars)

  return {
    fullTextChars: cleaned.length,
    inputText: limited.text,
    inputChars: limited.text.length,
    estimatedInputTokens: estimateTokens(limited.text),
    truncated: limited.truncated,
    pageCount: parsed.numpages ?? 0,
  }
}

export function getPdfHash(pdfBuffer: Buffer) {
  return createHash("sha256").update(pdfBuffer).digest("hex")
}

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4)
}

function getMaxInputChars() {
  const parsed = Number.parseInt(process.env.ANTHROPIC_MAX_INPUT_CHARS ?? "35000", 10)
  if (!Number.isFinite(parsed) || parsed < 4000) return 35000
  return parsed
}

export function cleanPdfText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-+\n\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, "$1$2")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^\d{1,4}$/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

export function limitTextDistributed(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return { text, truncated: false }
  }

  const markerBudget = 240
  const segmentBudget = Math.max(maxChars - markerBudget, 3000)
  const perSegment = Math.floor(segmentBudget / 3)
  const middleStart = Math.max(Math.floor(text.length / 2 - perSegment / 2), 0)
  const endStart = Math.max(text.length - perSegment, 0)

  const parts = [
    text.slice(0, perSegment),
    text.slice(middleStart, middleStart + perSegment),
    text.slice(endStart),
  ]

  const limited = [
    "[EXTRACTO INICIAL]",
    parts[0].trim(),
    "[EXTRACTO CENTRAL]",
    parts[1].trim(),
    "[EXTRACTO FINAL]",
    parts[2].trim(),
  ].join("\n\n")

  return {
    text: limited.slice(0, maxChars).trim(),
    truncated: true,
  }
}
