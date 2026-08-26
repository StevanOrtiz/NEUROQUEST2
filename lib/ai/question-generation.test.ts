import { describe, it, expect } from "vitest"
import { parseAndValidateQuestions } from "./question-generation"

function makeQuestion(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    question_text: "Pregunta de ejemplo",
    options: ["A", "B", "C", "D"],
    correct_option: 1,
    explanation: "Explicacion breve",
    ...overrides,
  }
}

describe("parseAndValidateQuestions", () => {
  it("parses a clean JSON response", () => {
    const raw = JSON.stringify({ questions: [makeQuestion()] })
    const result = parseAndValidateQuestions(raw, 1)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(makeQuestion())
  })

  it("strips ```json markdown fences before parsing", () => {
    const raw = "```json\n" + JSON.stringify({ questions: [makeQuestion()] }) + "\n```"
    expect(parseAndValidateQuestions(raw, 1)).toHaveLength(1)
  })

  it("extracts the JSON object even with prose before/after it", () => {
    const raw = `Aqui tienes las preguntas:\n${JSON.stringify({ questions: [makeQuestion()] })}\nEspero que sirvan.`
    expect(parseAndValidateQuestions(raw, 1)).toHaveLength(1)
  })

  it("filters out malformed questions and keeps the valid ones", () => {
    const raw = JSON.stringify({
      questions: [
        makeQuestion({ options: ["solo tres", "opciones", "aqui"] }), // wrong option count -> dropped
        makeQuestion({ correct_option: 7 }), // out of range -> dropped
        makeQuestion({ question_text: "" }), // empty text -> dropped
        makeQuestion(), // valid
      ],
    })

    const result = parseAndValidateQuestions(raw, 1)
    expect(result).toHaveLength(1)
    expect(result[0].question_text).toBe("Pregunta de ejemplo")
  })

  it("throws when fewer valid questions were returned than expected", () => {
    const raw = JSON.stringify({ questions: [makeQuestion()] })
    expect(() => parseAndValidateQuestions(raw, 5)).toThrow(/se esperaban 5/)
  })

  it("truncates extra questions down to the expected count", () => {
    const raw = JSON.stringify({ questions: [makeQuestion(), makeQuestion(), makeQuestion()] })
    expect(parseAndValidateQuestions(raw, 2)).toHaveLength(2)
  })

  it("throws on invalid JSON", () => {
    expect(() => parseAndValidateQuestions("{questions: not valid json}", 1)).toThrow(
      /JSON invalido/
    )
  })

  it("throws when the response has no JSON object at all", () => {
    expect(() => parseAndValidateQuestions("lo siento, no puedo ayudar con eso", 1)).toThrow(
      /no contiene un objeto JSON/
    )
  })

  it("throws when questions[] is missing", () => {
    expect(() => parseAndValidateQuestions(JSON.stringify({ foo: "bar" }), 1)).toThrow(
      /falta questions/
    )
  })
})
