// Este endpoint ha sido reemplazado por dos rutas separadas:
// POST /api/game/chest/save  → guarda cofre al inventario al terminar partida
// POST /api/game/chest/open  → abre cofre con ruleta y da item
//
// DELETE /api/game/chest  → limpia (borra) todos los cofres ya abiertos del
// usuario, para que el inventario no se llene de "cofre abierto" residuales.

import { createClient } from "@/lib/supabase/server"

export async function POST() {
  return Response.json(
    {
      error:
        "Endpoint deprecado. Usa /api/game/chest/save para guardar cofres y /api/game/chest/open para abrirlos.",
    },
    { status: 410 }
  )
}

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 })
  }

  const { error } = await supabase
    .from("chests")
    .delete()
    .eq("user_id", user.id)
    .eq("is_opened", true)

  if (error) {
    console.error("[chest] clear opened error:", error)
    return Response.json({ error: "No se pudieron borrar los cofres abiertos" }, { status: 500 })
  }

  return Response.json({ cleared: true })
}