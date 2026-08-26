import { describe, it, expect } from "vitest"
import { getTodayUtc, isStreakActiveToday, buildStreakData } from "./streak-utils"

describe("getTodayUtc", () => {
  it("returns today's date as YYYY-MM-DD", () => {
    expect(getTodayUtc()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(getTodayUtc()).toBe(new Date().toISOString().slice(0, 10))
  })
})

describe("isStreakActiveToday", () => {
  it("is false when there is no last activity date", () => {
    expect(isStreakActiveToday(null)).toBe(false)
  })

  it("is true when the last activity date is today", () => {
    expect(isStreakActiveToday(getTodayUtc())).toBe(true)
  })

  it("is false for a date in the past", () => {
    expect(isStreakActiveToday("2000-01-01")).toBe(false)
  })
})

describe("buildStreakData", () => {
  it("defaults missing streak fields to 0 and null", () => {
    const data = buildStreakData({})
    expect(data).toEqual({
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      active_today: false,
    })
  })

  it("carries through provided values and derives active_today", () => {
    const today = getTodayUtc()
    const data = buildStreakData({
      current_streak: 3,
      longest_streak: 7,
      last_activity_date: today,
    })
    expect(data).toEqual({
      current_streak: 3,
      longest_streak: 7,
      last_activity_date: today,
      active_today: true,
    })
  })

  it("active_today is false when last_activity_date is not today", () => {
    const data = buildStreakData({ last_activity_date: "2000-01-01" })
    expect(data.active_today).toBe(false)
  })
})
