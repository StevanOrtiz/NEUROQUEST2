import { createHash } from "crypto"
import { estimateTokens } from "@/lib/ai/pdf-text"
import type { DocumentBlock, ProcessedDocumentContent } from "@/lib/tasks/types"

const MIN_SELECTABLE_TEXT_CHARS = 120
const MAX_STORED_TEXT_CHARS = 450_000

export async function processTaskPdf(buffer: Buffer, title: string): Promise<ProcessedDocumentContent> {
  const sourceHash = createHash("sha256").update(buffer).digest("hex")
  const pdfParse = (await import("pdf-parse")).default
  const parsed = await pdfParse(buffer)
  const cleaned = cleanTaskPdfText(parsed.text ?? "")

  if (cleaned.length < MIN_SELECTABLE_TEXT_CHARS) {
    throw new Error("Este PDF parece escaneado o no tiene texto seleccionable suficiente.")
  }

  const text = cleaned.length > MAX_STORED_TEXT_CHARS
    ? `${cleaned.slice(0, MAX_STORED_TEXT_CHARS)}\n\n[Documento truncado para ahorrar almacenamiento]`
    : cleaned

  return {
    title,
    sourceHash,
    pageCount: parsed.numpages ?? 0,
    charCount: text.length,
    estimatedTokens: estimateTokens(text),
    pages: buildPages(text, parsed.numpages ?? 1),
  }
}

export function countTables(content: ProcessedDocumentContent) {
  return content.pages.reduce(
    (total, page) => total + page.blocks.filter((block) => block.type === "table").length,
    0
  )
}

function buildPages(text: string, pageCount: number) {
  const normalizedPageCount = Math.max(pageCount || 1, 1)
  const chunks = splitDistributed(text, normalizedPageCount)

  return chunks.map((chunk, index) => ({
    page: index + 1,
    blocks: parseBlocks(chunk),
  }))
}

function parseBlocks(text: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = []
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)

  for (const paragraph of paragraphs) {
    const table = parseTable(paragraph)
    if (table) {
      blocks.push(table)
      continue
    }

    if (isLikelyHeading(paragraph)) {
      blocks.push({ type: "heading", text: paragraph })
    } else {
      blocks.push({ type: "paragraph", text: paragraph })
    }
  }

  return blocks
}

function parseTable(text: string): DocumentBlock | null {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return null

  const pipeRows = lines.map((line) => line.split("|").map((cell) => cell.trim()).filter(Boolean))
  const pipeTable = pipeRows.length >= 2 && pipeRows.every((row) => row.length >= 2)
  if (pipeTable) {
    return {
      type: "table",
      title: null,
      columns: pipeRows[0],
      rows: pipeRows.slice(1),
      fallbackImage: null,
    }
  }

  const spacedRows = lines.map((line) => line.split(/\s{2,}/).map((cell) => cell.trim()).filter(Boolean))
  const columnCount = Math.max(...spacedRows.map((row) => row.length))
  const structuredRows = spacedRows.filter((row) => row.length >= 3)

  if (columnCount >= 3 && structuredRows.length >= 2) {
    return {
      type: "table",
      title: null,
      columns: padRow(spacedRows[0], columnCount),
      rows: spacedRows.slice(1).map((row) => padRow(row, columnCount)),
      fallbackImage: null,
    }
  }

  return null
}

function padRow(row: string[], length: number) {
  return Array.from({ length }, (_, index) => row[index] ?? "")
}

function isLikelyHeading(text: string) {
  if (text.length > 90 || text.includes(".")) return false
  const words = text.split(/\s+/)
  if (words.length > 9) return false
  return /^[A-ZÁÉÍÓÚÜÑ0-9]/.test(text)
}

function splitDistributed(text: string, pageCount: number) {
  if (pageCount <= 1) return [text]

  const targetSize = Math.ceil(text.length / pageCount)
  const chunks: string[] = []
  let cursor = 0

  for (let page = 0; page < pageCount; page++) {
    if (page === pageCount - 1) {
      chunks.push(text.slice(cursor).trim())
      break
    }

    const target = cursor + targetSize
    const nextBreak = text.indexOf("\n\n", target)
    const end = nextBreak > -1 && nextBreak - target < 1200 ? nextBreak : target
    chunks.push(text.slice(cursor, end).trim())
    cursor = end
  }

  return chunks.filter(Boolean)
}

function cleanTaskPdfText(text: string) {
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
