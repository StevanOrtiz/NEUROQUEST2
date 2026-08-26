import { createClient } from "@/lib/supabase/server"
import type { StreakUpdateResult } from "@/lib/streak/streak-utils"

export async function updateUserStreak(
  userId: string,
): Promise<StreakUpdateResult | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("update_user_streak")

    if (error) {
      console.error("[streak] RPC update_user_streak failed:", error.message)
      return null
    }

    return data as unknown as StreakUpdateResult
  } catch (error) {
    console.error("[streak] Unexpected error in updateUserStreak:", error)
    return null
  }
}