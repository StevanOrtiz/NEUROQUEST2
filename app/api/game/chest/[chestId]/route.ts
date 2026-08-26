import { createClient } from "@/lib/supabase/server"

interface Params {
  params: Promise<{ chestId: string }>
}

// DELETE /api/game/chest/[chestId]
// Removes a single already-opened chest "husk" from the user's inventory.
// Only opened chests can be deleted — a sealed chest still holds an
// unclaimed reward, so it's protected from deletion.
export async function DELETE(req: Request, { params }: Params) {
  const { chestId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 })
  }

  const { data: chest, error: chestError } = await supabase
    .from("chests")
    .select("id, is_opened")
    .eq("id", chestId)
    .eq("user_id", user.id)
    .single()

  if (chestError || !chest) {
    return Response.json({ error: "Cofre no encontrado" }, { status: 404 })
  }

  if (!chest.is_opened) {
    return Response.json({ error: "No puedes borrar un cofre sin abrir" }, { status: 400 })
  }

  const { error: deleteError } = await supabase
    .from("chests")
    .delete()
    .eq("id", chestId)
    .eq("user_id", user.id)

  if (deleteError) {
    console.error("[chest/:id] delete error:", deleteError)
    return Response.json({ error: "No se pudo borrar el cofre" }, { status: 500 })
  }

  return Response.json({ deleted: true })
}
