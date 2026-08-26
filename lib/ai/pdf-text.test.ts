import { describe, it, expect } from "vitest"
import { cleanPdfText, limitTextDistributed, estimateTokens, getPdfHash } from "./pdf-text"

describe("cleanPdfText", () => {
  it("collapses \\r and blank lines left by PDF extraction", () => {
    expect(cleanPdfText("Linea 1\r\n\r\n\r\nLinea 2")).toBe("Linea 1\nLinea 2")
  })

  it("merges words split by a line-break hyphen", () => {
    expect(cleanPdfText("La pala-\nbra completa")).toBe("La palabra completa")
  })

  it("drops lines that are just a page number", () => {
    expect(cleanPdfText("Titulo\n42\nContenido real")).toBe("Titulo\nContenido real")
  })

  it("keeps lines that merely contain digits mixed with text", () => {
    expect(cleanPdfText("Capitulo 4\nSeccion 4.2")).toBe("Capitulo 4\nSeccion 4.2")
  })

  it("collapses repeated spaces and tabs", () => {
    expect(cleanPdfText("Palabra1    con\t\tespacios")).toBe("Palabra1 con espacios")
  })

  it("trims leading/trailing whitespace on the whole result", () => {
    expect(cleanPdfText("  \n  Contenido  \n  ")).toBe("Contenido")
  })
})

describe("limitTextDistributed", () => {
  it("returns the text unchanged when it fits under maxChars", () => {
    const result = limitTextDistributed("texto corto", 1000)
    expect(result).toEqual({ text: "texto corto", truncated: false })
  })

  it("truncates and distributes start/middle/end when text exceeds maxChars", () => {
    // maxChars chosen well above the function's internal 3000-char segment floor
    // so all three markers are guaranteed to survive the final hard slice.
    const text = "A".repeat(3000) + "B".repeat(3000) + "C".repeat(3000)
    const result = limitTextDistributed(text, 6000)

    expect(result.truncated).toBe(true)
    expect(result.text.length).toBeLessThanOrEqual(6000)
    expect(result.text.startsWith("[EXTRACTO INICIAL]")).toBe(true)
    expect(result.text).toContain("[EXTRACTO CENTRAL]")
    expect(result.text).toContain("[EXTRACTO FINAL]")
  })

  it("never returns text longer than maxChars even with a tiny budget", () => {
    const text = "X".repeat(10000)
    const result = limitTextDistributed(text, 4000)
    expect(result.text.length).toBeLessThanOrEqual(4000)
  })
})

describe("estimateTokens", () => {
  it("estimates ~4 chars per token, rounded up", () => {
    expect(estimateTokens("")).toBe(0)
    expect(estimateTokens("abcd")).toBe(1)
    expect(estimateTokens("abcde")).toBe(2)
    expect(estimateTokens("a".repeat(35000))).toBe(8750)
  })
})

describe("getPdfHash", () => {
  it("is deterministic for the same buffer", () => {
    const buffer = Buffer.from("mismo contenido")
    expect(getPdfHash(buffer)).toBe(getPdfHash(Buffer.from("mismo contenido")))
  })

  it("differs for different buffers", () => {
    expect(getPdfHash(Buffer.from("a"))).not.toBe(getPdfHash(Buffer.from("b")))
  })

  it("returns a 64-char hex sha256 digest", () => {
    const hash = getPdfHash(Buffer.from("test"))
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})
