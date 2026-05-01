export interface Profile {
  id: string
  display_name: string | null
  level: number
  xp: number
  total_games: number
  total_correct: number
  created_at: string
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  streak_updated_at: string | null
  // ── Tutorial onboarding ──────────────────────────────
  tutorial_completed: boolean
  tutorial_skipped: boolean
  tutorial_completed_at: string | null
}

export interface GameSession {
  id: string
  user_id: string
  pdf_name: string
  difficulty: "easy" | "normal" | "hard"
  total_questions: number
  correct_answers: number
  wrong_answers: number
  lives_remaining: number
  xp_earned: number
  status: "in_progress" | "victory" | "defeat" | "abandoned"
  current_question_index: number
  created_at: string
  finished_at: string | null
  source_hash?: string | null
  ai_model?: string | null
  ai_input_chars?: number | null
  ai_estimated_input_tokens?: number | null
  ai_uncached_input_tokens?: number | null
  ai_output_tokens?: number | null
  ai_cache_creation_input_tokens?: number | null
  ai_cache_read_input_tokens?: number | null
  ai_cache_status?: "disabled" | "requested_5m" | "requested_1h" | "skipped_below_minimum"
  ai_source_mode?: "unknown" | "text_extraction_cached_prompt" | "direct_pdf_fallback" | "reused"
}

export interface Question {
  id: string
  session_id: string
  user_id: string
  question_text: string
  options: string[]
  correct_option: number
  explanation: string | null
  difficulty: string
  question_index: number
  answered: boolean
  user_answer: number | null
  is_correct: boolean | null
  created_at: string
}

export interface InventoryItem {
  id: string
  user_id: string
  item_type: "extra_life" | "fifty_fifty" | "skip_question" | "double_xp" | "hint"
  item_name: string
  item_description: string | null
  quantity: number
  icon: string
  created_at: string
}

export interface ChestReward {
  item_type: InventoryItem["item_type"]
  item_name: string
  item_description: string
  rarity: "common" | "rare" | "legendary"
}

export const DIFFICULTY_CONFIG = {
  easy: { label: "Facil", xpMultiplier: 1, questions: 8, color: "text-primary" },
  normal: { label: "Normal", xpMultiplier: 1.5, questions: 10, color: "text-rpg-gold" },
  hard: { label: "Dificil", xpMultiplier: 2, questions: 12, color: "text-rpg-health" },
} as const

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5500, 7500, 10000
]

export function getLevelProgress(xp: number) {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
    }
  }
  const maxLevel = LEVEL_THRESHOLDS.length
  if (level >= maxLevel) {
    return { level: maxLevel, progress: 100, currentXp: xp, nextLevelXp: LEVEL_THRESHOLDS[maxLevel - 1] }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const range = nextThreshold - currentThreshold
  const progress = range > 0 ? ((xp - currentThreshold) / range) * 100 : 100
  return { level, progress: Math.min(Math.max(progress, 0), 100), currentXp: xp, nextLevelXp: nextThreshold }
}
