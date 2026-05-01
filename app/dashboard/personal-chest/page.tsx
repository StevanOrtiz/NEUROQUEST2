import { PersonalChestClient } from "@/components/tasks/personal-chest-client"
import { getDashboardUser } from "@/lib/auth/dashboard-user"

export default async function PersonalChestPage() {
  const { supabase, user } = await getDashboardUser()

  const [{ data: tasks }, { data: documents }] = await Promise.all([
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

  return (
    <PersonalChestClient
      initialTasks={tasks ?? []}
      initialDocuments={documents ?? []}
    />
  )
}
