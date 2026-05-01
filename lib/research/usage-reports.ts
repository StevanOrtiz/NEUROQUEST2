type ReportType = "baseline" | "day3"

interface SnapshotOptions {
  supabase: any
  userId: string
  reportType: ReportType
  streakDay?: number
}

export async function ensureUsageReport({
  supabase,
  userId,
  reportType,
  streakDay,
}: SnapshotOptions) {
  const { data: existing } = await supabase
    .from("user_usage_reports")
    .select("id")
    .eq("user_id", userId)
    .eq("report_type", reportType)
    .maybeSingle()

  if (existing) return existing

  const metrics = await collectUsageMetrics(supabase, userId)
  const comparisons =
    reportType === "day3" ? await buildBaselineComparison(supabase, userId, metrics) : null

  const { data, error } = await supabase
    .from("user_usage_reports")
    .insert({
      user_id: userId,
      report_type: reportType,
      streak_day: streakDay ?? metrics.profile.current_streak ?? null,
      period_start: metrics.activity.first_seen_at,
      period_end: metrics.activity.snapshot_at,
      metrics,
      comparisons,
    })
    .select("id")
    .single()

  if (error) {
    console.error(`[research] Could not create ${reportType} report:`, error)
    return null
  }

  return data
}

async function collectUsageMetrics(supabase: any, userId: string) {
  const [
    { data: profile },
    { data: sessions },
    { data: questions },
    { data: subjectProgress },
    { data: susResponse },
    { data: adhdResult },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("game_sessions").select("*").eq("user_id", userId),
    supabase.from("questions").select("*").eq("user_id", userId),
    supabase.from("user_subject_progress").select("*").eq("user_id", userId),
    supabase
      .from("sus_responses")
      .select("id, sus_score, submitted_at")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("adhd_screening_results")
      .select("id, positive_count, total_score, result_level, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ])

  const now = new Date()
  const sessionRows = sessions ?? []
  const questionRows = questions ?? []
  const progressRows = subjectProgress ?? []
  const answeredQuestions = questionRows.filter((q: any) => q.answered)
  const correctQuestions = questionRows.filter((q: any) => q.is_correct === true)
  const completedSessions = sessionRows.filter((s: any) => ["victory", "defeat"].includes(s.status))
  const victories = sessionRows.filter((s: any) => s.status === "victory")
  const firstSessionAt = minDate(sessionRows.map((s: any) => s.created_at))
  const firstSeenAt = minDate([profile?.created_at, firstSessionAt].filter(Boolean))
  const lastSessionAt = maxDate(sessionRows.map((s: any) => s.finished_at ?? s.created_at))

  return {
    activity: {
      snapshot_at: now.toISOString(),
      first_seen_at: firstSeenAt,
      first_session_at: firstSessionAt,
      last_session_at: lastSessionAt,
      active_days: distinctDays(sessionRows.map((s: any) => s.created_at)).length,
      sessions_last_24h: countSince(sessionRows, "created_at", hoursAgo(24)),
      sessions_last_3d: countSince(sessionRows, "created_at", hoursAgo(72)),
    },
    profile: {
      level: profile?.level ?? 1,
      xp: profile?.xp ?? 0,
      total_games: profile?.total_games ?? 0,
      total_correct: profile?.total_correct ?? 0,
      current_streak: profile?.current_streak ?? 0,
      longest_streak: profile?.longest_streak ?? 0,
      last_activity_date: profile?.last_activity_date ?? null,
      tutorial_completed: Boolean(profile?.tutorial_completed),
      tutorial_skipped: Boolean(profile?.tutorial_skipped),
    },
    games: {
      total_sessions: sessionRows.length,
      completed_sessions: completedSessions.length,
      victories: victories.length,
      defeats: sessionRows.filter((s: any) => s.status === "defeat").length,
      in_progress: sessionRows.filter((s: any) => s.status === "in_progress").length,
      total_questions: sum(sessionRows, "total_questions"),
      correct_answers: sum(sessionRows, "correct_answers"),
      wrong_answers: sum(sessionRows, "wrong_answers"),
      xp_earned: sum(sessionRows, "xp_earned"),
      average_accuracy: safeRate(sum(sessionRows, "correct_answers"), sum(sessionRows, "total_questions")),
      victory_rate: safeRate(victories.length, completedSessions.length),
      by_difficulty: groupCount(sessionRows, "difficulty"),
      by_ai_source_mode: groupCount(sessionRows, "ai_source_mode"),
      ai_estimated_input_tokens: sum(sessionRows, "ai_estimated_input_tokens"),
      ai_output_tokens: sum(sessionRows, "ai_output_tokens"),
      ai_cache_read_input_tokens: sum(sessionRows, "ai_cache_read_input_tokens"),
    },
    questions: {
      total: questionRows.length,
      answered: answeredQuestions.length,
      correct: correctQuestions.length,
      skipped: questionRows.filter((q: any) => q.user_answer === -1).length,
      accuracy: safeRate(correctQuestions.length, answeredQuestions.length),
      by_difficulty: groupCount(questionRows, "difficulty"),
    },
    subjects: {
      subjects_started: progressRows.length,
      diagnostics_passed: progressRows.filter((p: any) => p.diagnostic_passed).length,
      subjects_completed: progressRows.filter((p: any) => p.subject_completed).length,
      completed_modules: progressRows.reduce((total: number, p: any) => total + (p.completed_modules?.length ?? 0), 0),
      completed_sections: progressRows.reduce((total: number, p: any) => total + (p.completed_sections?.length ?? 0), 0),
    },
    forms: {
      sus_submitted: Boolean(susResponse),
      sus_score: susResponse ? Number(susResponse.sus_score) : null,
      sus_submitted_at: susResponse?.submitted_at ?? null,
      adhd_completed: Boolean(adhdResult),
      adhd_level: adhdResult?.result_level ?? null,
      adhd_positive_count: adhdResult?.positive_count ?? null,
      adhd_total_score: adhdResult?.total_score ?? null,
      adhd_completed_at: adhdResult?.created_at ?? null,
    },
  }
}

async function buildBaselineComparison(supabase: any, userId: string, currentMetrics: any) {
  const { data: baseline } = await supabase
    .from("user_usage_reports")
    .select("metrics")
    .eq("user_id", userId)
    .eq("report_type", "baseline")
    .maybeSingle()

  if (!baseline?.metrics) return null

  const base = baseline.metrics
  return {
    xp_delta: currentMetrics.profile.xp - (base.profile?.xp ?? 0),
    level_delta: currentMetrics.profile.level - (base.profile?.level ?? 1),
    games_delta: currentMetrics.games.total_sessions - (base.games?.total_sessions ?? 0),
    completed_sessions_delta: currentMetrics.games.completed_sessions - (base.games?.completed_sessions ?? 0),
    correct_answers_delta: currentMetrics.games.correct_answers - (base.games?.correct_answers ?? 0),
    accuracy_delta: currentMetrics.games.average_accuracy - (base.games?.average_accuracy ?? 0),
    active_days_delta: currentMetrics.activity.active_days - (base.activity?.active_days ?? 0),
    completed_sections_delta: currentMetrics.subjects.completed_sections - (base.subjects?.completed_sections ?? 0),
    sus_score_delta:
      currentMetrics.forms.sus_score != null && base.forms?.sus_score != null
        ? currentMetrics.forms.sus_score - base.forms.sus_score
        : null,
  }
}

function sum(rows: any[], key: string) {
  return rows.reduce((total, row) => total + (Number(row?.[key]) || 0), 0)
}

function safeRate(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 10000) / 100 : 0
}

function groupCount(rows: any[], key: string) {
  return rows.reduce((groups, row) => {
    const value = row?.[key] ?? "unknown"
    groups[value] = (groups[value] ?? 0) + 1
    return groups
  }, {} as Record<string, number>)
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000)
}

function countSince(rows: any[], key: string, since: Date) {
  return rows.filter((row) => {
    const value = row?.[key]
    return value ? new Date(value) >= since : false
  }).length
}

function distinctDays(values: string[]) {
  return Array.from(new Set(values.filter(Boolean).map((value) => value.slice(0, 10))))
}

function minDate(values: string[]) {
  const dates = values.filter(Boolean).map((value) => new Date(value).getTime())
  if (!dates.length) return null
  return new Date(Math.min(...dates)).toISOString()
}

function maxDate(values: string[]) {
  const dates = values.filter(Boolean).map((value) => new Date(value).getTime())
  if (!dates.length) return null
  return new Date(Math.max(...dates)).toISOString()
}
