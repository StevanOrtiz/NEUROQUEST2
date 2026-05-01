import { ACHIEVEMENTS, type AchievementCode } from "@/lib/achievements/config"

export interface GrantedAchievement {
  code: AchievementCode
  title: string
  description: string
  icon: string
  rarity: string
  earned_at?: string
}

type SupabaseLike = {
  from: (table: string) => any
}

export async function grantAchievement(
  supabase: SupabaseLike,
  userId: string,
  code: AchievementCode,
  metadata: Record<string, unknown> = {}
): Promise<GrantedAchievement | null> {
  const achievement = ACHIEVEMENTS[code]
  if (!achievement) return null

  const { data, error } = await supabase
    .from("user_achievements")
    .upsert(
      {
        user_id: userId,
        code,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
        metadata,
      },
      {
        onConflict: "user_id,code",
        ignoreDuplicates: true,
      }
    )
    .select("code,title,description,icon,rarity,earned_at")
    .maybeSingle()

  if (error) {
    console.error("[achievements] grant error:", error.message)
    return null
  }

  return data as GrantedAchievement | null
}

export async function grantAchievements(
  supabase: SupabaseLike,
  userId: string,
  entries: Array<{ code: AchievementCode; metadata?: Record<string, unknown> }>
): Promise<GrantedAchievement[]> {
  const granted: GrantedAchievement[] = []

  for (const entry of entries) {
    const achievement = await grantAchievement(
      supabase,
      userId,
      entry.code,
      entry.metadata ?? {}
    )
    if (achievement) granted.push(achievement)
  }

  return granted
}
