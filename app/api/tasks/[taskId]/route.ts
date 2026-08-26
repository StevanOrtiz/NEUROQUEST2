import { getDashboardUser } from "@/lib/auth/dashboard-user"
import { grantAchievement } from "@/lib/achievements/grant"
import { removeStorageFiles } from "@/lib/tasks/storage-cleanup"
import type { TablesUpdate } from "@/types/database.types"

interface Params {
  params: Promise<{ taskId: string }>
}

export async function PATCH(req: Request, { params }: Params) {
  const { taskId } = await params
  const { supabase, user } = await getDashboardUser()
  const body = await req.json().catch(() => null)

  const patch: TablesUpdate<"user_tasks"> = {
    updated_at: new Date().toISOString(),
  }

  if (body?.title !== undefined) patch.title = String(body.title).trim()
  if (body?.subjectName !== undefined) patch.subject_name = String(body.subjectName).trim() || null
  if (body?.description !== undefined) patch.description = String(body.description).trim() || null
  if (body?.dueDate !== undefined) patch.due_date = body.dueDate || null
  if (body?.taskType !== undefined) patch.task_type = String(body.taskType).trim() || "Otro"
  if (body?.status === "completed") {
    patch.status = "completed"
    patch.completed_at = new Date().toISOString()
  }
  if (body?.status === "pending") {
    patch.status = "pending"
    patch.completed_at = null
  }

  const { data, error } = await supabase
    .from("user_tasks")
    .update(patch)
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select("*")
    .single()

  if (error || !data) {
    console.error("[tasks] update error:", error)
    return Response.json({ error: "No se pudo actualizar la tarea" }, { status: 500 })
  }

  const achievements = []
  if (body?.status === "completed") {
    const first = await grantAchievement(supabase, user.id, "first_task_completed", { taskId })
    if (first) achievements.push(first)

    const { count } = await supabase
      .from("user_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed")

    if ((count ?? 0) >= 5) {
      const organized = await grantAchievement(supabase, user.id, "organized_chest_5")
      if (organized) achievements.push(organized)
    }
  }

  return Response.json({ task: data, achievements })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { taskId } = await params
  const { supabase, user } = await getDashboardUser()

  const { data: documents } = await supabase
    .from("task_documents")
    .select("content_storage_path")
    .eq("task_id", taskId)
    .eq("user_id", user.id)

  const storageOk = await removeStorageFiles(
    supabase,
    (documents ?? []).map((document) => document.content_storage_path)
  )

  if (!storageOk) {
    return Response.json({ error: "No se pudieron borrar los documentos de Storage" }, { status: 500 })
  }

  const { error } = await supabase
    .from("user_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id)

  if (error) {
    console.error("[tasks] delete error:", error)
    return Response.json({ error: "No se pudo eliminar la tarea" }, { status: 500 })
  }

  return Response.json({ ok: true })
}
