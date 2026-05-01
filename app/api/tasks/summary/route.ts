import { getDashboardUser } from "@/lib/auth/dashboard-user"

export async function GET() {
  const { supabase, user } = await getDashboardUser()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from("user_tasks")
    .select("id,due_date,status")
    .eq("user_id", user.id)
    .eq("status", "pending")

  if (error) {
    console.error("[tasks] summary error:", error)
    return Response.json({ pending: 0, overdue: 0 })
  }

  const pending = data?.length ?? 0
  const overdue = (data ?? []).filter((task) => task.due_date && task.due_date < today).length

  return Response.json({ pending, overdue })
}
