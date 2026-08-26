import { describe, it, expect } from "vitest"
import { scoreAdhdScreening, ADHD_SCREENING_QUESTIONS } from "./asrs-screener"

function answersWithPositives(count: number) {
  const answers: Record<string, number> = {}
  ADHD_SCREENING_QUESTIONS.forEach((question, index) => {
    // At/above threshold counts as "positive"; well below never does.
    answers[question.id] = index < count ? question.threshold : 0
  })
  return answers
}

describe("scoreAdhdScreening", () => {
  it("returns 'low' when fewer than 2 questions are positive", () => {
    const result = scoreAdhdScreening(answersWithPositives(1))
    expect(result.level).toBe("low")
    expect(result.positiveCount).toBe(1)
  })

  it("returns 'moderate' at exactly 2 positives", () => {
    const result = scoreAdhdScreening(answersWithPositives(2))
    expect(result.level).toBe("moderate")
  })

  it("returns 'moderate' at 3 positives (still below the elevated cutoff)", () => {
    const result = scoreAdhdScreening(answersWithPositives(3))
    expect(result.level).toBe("moderate")
  })

  it("returns 'elevated' at exactly 4 positives", () => {
    const result = scoreAdhdScreening(answersWithPositives(4))
    expect(result.level).toBe("elevated")
  })

  it("returns 'elevated' when all 6 questions are positive", () => {
    const result = scoreAdhdScreening(answersWithPositives(6))
    expect(result.level).toBe("elevated")
    expect(result.positiveCount).toBe(6)
  })

  it("treats missing answers as 0 (not positive, not counted in total)", () => {
    const result = scoreAdhdScreening({})
    expect(result.positiveCount).toBe(0)
    expect(result.totalScore).toBe(0)
    expect(result.level).toBe("low")
  })

  it("totalScore sums raw answer values regardless of threshold", () => {
    const answers: Record<string, number> = {}
    ADHD_SCREENING_QUESTIONS.forEach((question) => {
      answers[question.id] = 1
    })
    const result = scoreAdhdScreening(answers)
    expect(result.totalScore).toBe(ADHD_SCREENING_QUESTIONS.length)
  })

  it("a question's own threshold decides whether it counts as positive", () => {
    // First question has threshold 2: value 1 must not count, value 2 must.
    const q = ADHD_SCREENING_QUESTIONS[0]
    expect(scoreAdhdScreening({ [q.id]: q.threshold - 1 }).positiveCount).toBe(0)
    expect(scoreAdhdScreening({ [q.id]: q.threshold }).positiveCount).toBe(1)
  })
})
