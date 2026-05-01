import { getDashboardUser } from "@/lib/auth/dashboard-user"
import { getTaskDocumentsBucket } from "@/lib/tasks/storage-cleanup"

interface Params {
  params: Promise<{ taskId: string; documentId: string }>
}

export async function GET(_req: Request, { params }: Params) {
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

  const { data, error } = await supabase.storage
    .from(getTaskDocumentsBucket())
    .download(document.content_storage_path)

  if (error || !data) {
    return Response.json({ error: "No se pudo leer content.json" }, { status: 500 })
  }

  const content = await data.text()
  return new Response(content, {
    headers: { "Content-Type": "application/json" },
  })
}
