import { getDashboardUser } from "@/lib/auth/dashboard-user"
import { grantAchievement } from "@/lib/achievements/grant"
import { TASK_TYPES } from "@/lib/tasks/types"

export async function GET() {
  const { supabase, user } = await getDashboardUser()

  const [{ data: tasks, error: tasksError }, { data: documents, error: docsError }] = await Promise.all([
    supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("task_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  if (tasksError || docsError) {
    console.error("[tasks] list error:", tasksError ?? docsError)
    return Response.json({ error: "No se pudieron cargar las tareas" }, { status: 500 })
  }

  return Response.json({ tasks: tasks ?? [], documents: documents ?? [] })
}

export async function POST(req: Request) {
  const { supabase, user } = await getDashboardUser()
  const body = await req.json().catch(() => null)

  const title = String(body?.title ?? "").trim()
  if (!title) {
    return Response.json({ error: "El nombre de la tarea es obligatorio" }, { status: 400 })
  }

  const taskType = String(body?.taskType ?? "Otro").trim()
  const normalizedType = TASK_TYPES.includes(taskType as never) ? taskType : "Otro"

  const { data, error } = await supabase
    .from("user_tasks")
    .insert({
      user_id: user.id,
      title,
      subject_name: String(body?.subjectName ?? "").trim() || null,
      description: String(body?.description ?? "").trim() || null,
      due_date: body?.dueDate || null,
      task_type: normalizedType,
      status: "pending",
    })
    .select("*")
    .single()

  if (error || !data) {
    console.error("[tasks] create error:", error)
    return Response.json({ error: "No se pudo crear la tarea" }, { status: 500 })
  }

  const achievement = await grantAchievement(supabase, user.id, "first_task_created", {
    taskId: data.id,
  })

  return Response.json({ task: data, achievement })
}
