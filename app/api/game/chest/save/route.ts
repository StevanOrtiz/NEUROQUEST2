import { createClient } from "@/lib/supabase/server"
import { grantAchievement } from "@/lib/achievements/grant"

// POST /api/game/chest/save
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 })
  }

  const { sessionId } = await req.json()

  if (!sessionId) {
    return Response.json({ error: "Falta sessionId" }, { status: 400 })
  }

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, correct_answers, total_questions, status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (sessionError || !session) {
    console.error("[chest/save] session error:", sessionError)
    return Response.json({ error: "Sesion no encontrada", detail: sessionError?.message }, { status: 400 })
  }

  if (session.status !== "victory") {
    return Response.json({ error: "La sesion no es una victoria" }, { status: 400 })
  }

  const accuracy = session.correct_answers / session.total_questions
  if (accuracy <= 0.75) {
    return Response.json({ earned: false, reason: "Precision menor al 75%", accuracy })
  }

  // Verificar que no exista ya un cofre para esta sesión
  const { data: existing, error: existingError } = await supabase
    .from("chests")
    .select("id")
    .eq("game_session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingError) {
    console.error("[chest/save] existing check error:", existingError)
    return Response.json({ error: "Error al verificar cofre", detail: existingError.message }, { status: 500 })
  }

  if (existing) {
    return Response.json({ earned: false, reason: "Ya existe cofre para esta sesion" })
  }

  // rarity se asigna al abrir — aquí solo guardamos el cofre sellado
  const { data: chest, error: insertError } = await supabase
    .from("chests")
    .insert({
      user_id: user.id,
      game_session_id: sessionId,
      rarity: "common",
      is_opened: false,
    })
    .select("id")
    .single()

  if (insertError) {
    console.error("[chest/save] insert error:", insertError)
    return Response.json({ error: "Error al guardar cofre", detail: insertError.message }, { status: 500 })
  }

  const achievement = await grantAchievement(supabase, user.id, "first_chest", {
    sessionId,
    accuracy: Math.round(accuracy * 100),
  })

  return Response.json({ earned: true, chestId: chest.id, achievement })
}
