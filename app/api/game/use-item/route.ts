import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 })
  }

  const { itemType, sessionId, questionId } = await req.json()

  if (!itemType) {
    return Response.json({ error: "Falta el tipo de item" }, { status: 400 })
  }

  // Check inventory
  const { data: item } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .single()

  if (!item || item.quantity <= 0) {
    return Response.json({ error: "No tienes este item" }, { status: 400 })
  }

  // Decrement quantity (delete row if last one)
  if (item.quantity <= 1) {
    await supabase.from("inventory_items").delete().eq("id", item.id)
  } else {
    await supabase
      .from("inventory_items")
      .update({ quantity: item.quantity - 1 })
      .eq("id", item.id)
  }

  let result: Record<string, unknown> = { used: true, itemType }

  // ── extra_life ─────────────────────────────────────────
  if (itemType === "extra_life" && sessionId) {
    const { data: session } = await supabase
      .from("game_sessions")
      .select("lives_remaining")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (session) {
      const newLives = session.lives_remaining + 1
      await supabase
        .from("game_sessions")
        .update({ lives_remaining: newLives })
        .eq("id", sessionId)
      result.newLives = newLives
    }
  }

  // ── fifty_fifty ────────────────────────────────────────
  if (itemType === "fifty_fifty" && questionId) {
    const { data: question } = await supabase
      .from("questions")
      .select("options, correct_option")
      .eq("id", questionId)
      .eq("user_id", user.id)
      .single()

    if (question) {
      const incorrectIndices = [0, 1, 2, 3].filter((i) => i !== question.correct_option)
      const toRemove = incorrectIndices.sort(() => Math.random() - 0.5).slice(0, 2)
      result.removedOptions = toRemove
    }
  }

  // ── skip_question ──────────────────────────────────────
  // Mark question as answered and advance the session index
  if (itemType === "skip_question" && questionId && sessionId) {
    // Mark question as skipped (answered=true, user_answer=-1, is_correct=true so no life lost)
    await supabase
      .from("questions")
      .update({ answered: true, is_correct: true, user_answer: -1 })
      .eq("id", questionId)
      .eq("user_id", user.id)

    // Advance the session question index
    const { data: session } = await supabase
      .from("game_sessions")
      .select("current_question_index, total_questions")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (session) {
      const newIndex = session.current_question_index + 1
      const newStatus = newIndex >= session.total_questions ? "victory" : "in_progress"
      await supabase
        .from("game_sessions")
        .update({
          current_question_index: newIndex,
          status: newStatus,
          ...(newStatus === "victory" ? { finished_at: new Date().toISOString() } : {}),
        })
        .eq("id", sessionId)
      result.skipped = true
      result.gameStatus = newStatus
    }
  }

  // ── double_xp ──────────────────────────────────────────
  // Flag is stored client-side and applied on the next answer XP calculation
  // We also store a session flag so the server-side answer route can double XP
  if (itemType === "double_xp" && sessionId) {
    const { error: doubleXpError } = await supabase
      .from("game_sessions")
      .update({ double_xp_active: true } as never)
      .eq("id", sessionId)
      .eq("user_id", user.id)

    if (doubleXpError) {
      console.error("[use-item] Failed to activate double_xp:", doubleXpError.message)
      return Response.json({ error: "No se pudo activar doble XP" }, { status: 500 })
    }
    result.doubleXpActive = true
  }

  // ── hint ───────────────────────────────────────────────
  if (itemType === "hint" && questionId) {
    const { data: question } = await supabase
      .from("questions")
      .select("explanation, correct_option, options")
      .eq("id", questionId)
      .eq("user_id", user.id)
      .single()

    if (question) {
      const correctText = (question.options as string[])[question.correct_option] ?? ""
      // Give first half of the correct option text as a hint
      const halfLength = Math.max(Math.floor(correctText.length / 2), 10)
      result.hint = `La respuesta esta relacionada con: "${correctText.substring(0, halfLength)}..."`
    }
  }

  return Response.json(result)
}
