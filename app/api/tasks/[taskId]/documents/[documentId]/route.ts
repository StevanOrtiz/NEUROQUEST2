import { getDashboardUser } from "@/lib/auth/dashboard-user"
import { removeStorageFile } from "@/lib/tasks/storage-cleanup"

interface Params {
  params: Promise<{ taskId: string; documentId: string }>
}

export async function PATCH(req: Request, { params }: Params) {
  const { taskId, documentId } = await params
  const { supabase, user } = await getDashboardUser()
  const body = await req.json().catch(() => null)
  const title = String(body?.title ?? "").trim()

  if (!title) {
    return Response.json({ error: "El nombre es obligatorio" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("task_documents")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .select("*")
    .single()

  if (error || !data) {
    return Response.json({ error: "No se pudo renombrar el documento" }, { status: 500 })
  }

  return Response.json({ document: data })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { taskId, documentId } = await params
  const { supabase, user } = await getDashboardUser()

  const { data: document } = await supabase
    .from("task_documents")
    .select("content_storage_path")
    .eq("id", documentId)
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .single()

  if (!document) {
    return Response.json({ error: "Documento no encontrado" }, { status: 404 })
  }

  const storageOk = await removeStorageFile(supabase, document.content_storage_path)
  if (!storageOk) {
    return Response.json({ error: "No se pudo borrar content.json de Storage" }, { status: 500 })
  }

  const { error } = await supabase
    .from("task_documents")
    .delete()
    .eq("id", documentId)
    .eq("task_id", taskId)
    .eq("user_id", user.id)

  if (error) {
    return Response.json({ error: "No se pudo eliminar el documento" }, { status: 500 })
  }

  return Response.json({ ok: true })
}
