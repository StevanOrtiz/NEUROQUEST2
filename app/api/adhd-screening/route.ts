import { getDashboardUser } from "@/lib/auth/dashboard-user"
import { grantAchievement } from "@/lib/achievements/grant"
import {
  ADHD_SCREENING_QUESTIONS,
  ADHD_SCREENING_SOURCE,
  scoreAdhdScreening,
} from "@/lib/adhd/asrs-screener"

export async function POST(req: Request) {
  const { supabase, user } = await getDashboardUser()
  const body = await req.json().catch(() => null)
  const answers = body?.answers

  if (!answers || typeof answers !== "object") {
    return Response.json({ error: "Respuestas invalidas" }, { status: 400 })
  }

  const normalizedAnswers: Record<string, number> = {}

  for (const question of ADHD_SCREENING_QUESTIONS) {
    const value = Number((answers as Record<string, unknown>)[question.id])
    if (!Number.isInteger(value) || value < 0 || value > 4) {
      return Response.json({ error: "Debes responder todas las preguntas" }, { status: 400 })
    }
    normalizedAnswers[question.id] = value
  }

  const result = scoreAdhdScreening(normalizedAnswers)

  const { data: existing, error: existingError } = await supabase
    .from("adhd_screening_results")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingError) {
    console.error("ADHD screening existing check error:", existingError)
    return Response.json({ error: "No se pudo verificar el resultado previo" }, { status: 500 })
  }

  if (existing) {
    return Response.json(
      { error: "Ya completaste este chequeo. Solo se permite un resultado por usuario." },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from("adhd_screening_results")
    .insert({
      user_id: user.id,
      instrument: ADHD_SCREENING_SOURCE.instrument,
      source_url: ADHD_SCREENING_SOURCE.sourceUrl,
      answers: normalizedAnswers,
      positive_count: result.positiveCount,
      total_score: result.totalScore,
      result_level: result.level,
      recommendation: result.recommendation,
    })
    .select("id, positive_count, total_score, result_level, recommendation, created_at")
    .single()

  if (error || !data) {
    console.error("ADHD screening insert error:", error)
    return Response.json({ error: "No se pudo guardar el resultado" }, { status: 500 })
  }

  const achievement = await grantAchievement(supabase, user.id, "adhd_check_completed")

  return Response.json({
    id: data.id,
    positiveCount: data.positive_count,
    totalScore: data.total_score,
    level: data.result_level,
    recommendation: data.recommendation,
    createdAt: data.created_at,
    achievement,
  })
}

export async function GET() {
  const { supabase, user } = await getDashboardUser()

  const { data, error } = await supabase
    .from("adhd_screening_results")
    .select("id, positive_count, total_score, result_level, recommendation, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("ADHD screening fetch error:", error)
    return Response.json({ error: "No se pudo cargar el ultimo resultado" }, { status: 500 })
  }

  if (!data) {
    return Response.json({ result: null })
  }

  return Response.json({
    result: {
      id: data.id,
      positiveCount: data.positive_count,
      totalScore: data.total_score,
      level: data.result_level,
      recommendation: data.recommendation,
      createdAt: data.created_at,
    },
  })
}
