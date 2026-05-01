import { grantAchievements, type GrantedAchievement } from "@/lib/achievements/grant"
import { updateUserStreak } from "@/lib/streak/update-streak"
import { createClient } from "@/lib/supabase/server"
import { DIFFICULTY_CONFIG, LEVEL_THRESHOLDS } from "@/lib/types"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 })
  }

  const { questionId, answer } = await req.json()

  if (questionId === undefined || answer === undefined) {
    return Response.json({ error: "Faltan datos" }, { status: 400 })
  }

  const { data: question, error: qError } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .eq("user_id", user.id)
    .single()

  if (qError || !question) {
    return Response.json({ error: "Pregunta no encontrada" }, { status: 404 })
  }

  if (question.answered) {
    return Response.json({ error: "Pregunta ya respondida" }, { status: 400 })
  }

  const isCorrect = answer === question.correct_option

  await supabase
    .from("questions")
    .update({
      answered: true,
      user_answer: answer,
      is_correct: isCorrect,
    })
    .eq("id", questionId)

  const { data: session } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", question.session_id)
    .eq("user_id", user.id)
    .single()

  if (!session) {
    return Response.json({ error: "Sesion no encontrada" }, { status: 404 })
  }

  const config =
    DIFFICULTY_CONFIG[session.difficulty as keyof typeof DIFFICULTY_CONFIG] ??
    DIFFICULTY_CONFIG.normal

  const doubleXpActive = (session as Record<string, unknown>).double_xp_active === true
  const baseXp = isCorrect
    ? Math.round(25 * config.xpMultiplier * (doubleXpActive ? 2 : 1))
    : 0

  const newCorrect = session.correct_answers + (isCorrect ? 1 : 0)
  const newWrong = session.wrong_answers + (isCorrect ? 0 : 1)
  const newLives = session.lives_remaining - (isCorrect ? 0 : 1)
  const newQuestionIndex = session.current_question_index + 1
  const newXp = session.xp_earned + baseXp

  let newStatus: string = session.status
  if (newLives <= 0) {
    newStatus = "defeat"
  } else if (newQuestionIndex >= session.total_questions) {
    newStatus = "victory"
  }

  const isFinished = newStatus === "victory" || newStatus === "defeat"
  const accuracy = session.total_questions > 0 ? (newCorrect / session.total_questions) * 100 : 0

  await supabase
    .from("game_sessions")
    .update({
      correct_answers: newCorrect,
      wrong_answers: newWrong,
      lives_remaining: Math.max(newLives, 0),
      current_question_index: newQuestionIndex,
      xp_earned: newXp,
      status: newStatus,
      ...(doubleXpActive ? { double_xp_active: false } : {}),
      ...(isFinished ? { finished_at: new Date().toISOString() } : {}),
    } as never)
    .eq("id", session.id)

  let grantedAchievements: GrantedAchievement[] = []

  if (isFinished) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, total_games, total_correct, level")
      .eq("id", user.id)
      .single()

    const oldLevel = profile?.level ?? 1
    let newLevel = oldLevel

    if (profile) {
      const updatedXp = profile.xp + newXp
      const updatedGames = profile.total_games + 1
      const updatedCorrect = profile.total_correct + newCorrect

      newLevel = 1
      for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
        if (updatedXp >= LEVEL_THRESHOLDS[i]) newLevel = i + 1
      }

      await supabase
        .from("profiles")
        .update({
          xp: updatedXp,
          total_games: updatedGames,
          total_correct: updatedCorrect,
          level: newLevel,
        })
        .eq("id", user.id)
    }

    const streakResult = await updateUserStreak(user.id)

    const { data: subjectLink } = await supabase
      .from("subject_game_sessions")
      .select("id")
      .eq("session_id", session.id)
      .maybeSingle()

    grantedAchievements = await grantAchievements(supabase, user.id, [
      ...(newStatus === "victory" ? [{ code: "first_victory" as const }] : []),
      ...(!subjectLink ? [{ code: "first_pdf_completed" as const }] : []),
      ...(accuracy >= 80
        ? [{ code: "pdf_accuracy_80" as const, metadata: { accuracy: Math.round(accuracy) } }]
        : []),
      ...((streakResult?.current_streak ?? 0) >= 3
        ? [{ code: "first_streak_3" as const, metadata: { streak: streakResult?.current_streak } }]
        : []),
      ...(oldLevel < 3 && newLevel >= 3
        ? [{ code: "level_3" as const, metadata: { level: newLevel } }]
        : []),
    ])
  }

  return Response.json({
    isCorrect,
    correctOption: question.correct_option,
    explanation: question.explanation,
    xpEarned: baseXp,
    livesRemaining: Math.max(newLives, 0),
    gameStatus: newStatus,
    totalXpEarned: newXp,
    correctAnswers: newCorrect,
    totalQuestions: session.total_questions,
    achievements: grantedAchievements,
    streakUpdated: isFinished,
  })
}
