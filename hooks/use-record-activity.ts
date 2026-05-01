"use client"

import { useCallback } from "react"
import type { StreakData } from "@/lib/streak/streak-utils"

async function fetchRecordActivity(): Promise<StreakData> {
  const res = await fetch("/api/streak/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) throw new Error("Streak update failed")
  return res.json()
}

export function useRecordActivity() {
  const recordActivityFromContext = useCallback(async (): Promise<StreakData> => {
    try {
      const { useStreak } = await import("@/lib/streak/streak-context")
      void useStreak
    } catch {
      // Game pages can live outside StreakProvider, so fall back to the API.
    }

    return fetchRecordActivity()
  }, [])

  return { recordActivity: recordActivityFromContext }
}

export { useStreak } from "@/lib/streak/streak-context"
