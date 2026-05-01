"use client"

export interface AchievementUnlock {
  code?: string
  title: string
  description?: string
  icon?: string
  rarity?: string
  earned_at?: string
}

export interface AchievementEventDetail extends AchievementUnlock {
  message?: string
}

function normalizeAchievement(achievement: AchievementUnlock): AchievementEventDetail | null {
  if (!achievement?.title) return null

  return {
    code: achievement.code,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    rarity: achievement.rarity,
    earned_at: achievement.earned_at,
    message: `Medalla desbloqueada: ${achievement.title}.`,
  }
}

export function dispatchAchievementUnlock(achievement: AchievementUnlock | null | undefined) {
  if (typeof window === "undefined" || !achievement) return
  const detail = normalizeAchievement(achievement)
  if (!detail) return

  window.dispatchEvent(new CustomEvent<AchievementEventDetail>("questmind:achievement", { detail }))
}

export function dispatchAchievementUnlocks(achievements: AchievementUnlock[] | null | undefined) {
  if (!achievements?.length) return

  achievements.forEach((achievement, index) => {
    window.setTimeout(() => dispatchAchievementUnlock(achievement), index * 900)
  })
}
