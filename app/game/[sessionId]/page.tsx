import { redirect } from "next/navigation"
import { GameClient } from "@/components/game/game-client"
import { getDashboardUser } from "@/lib/auth/dashboard-user"

interface GamePageProps {
  params: Promise<{ sessionId: string }>
}

export interface SubjectContext {
  subject_id: string
  module_id: string | null
  section_id: string | null
  quiz_type: "diagnostic" | "section"
}

export default async function GamePage({ params }: GamePageProps) {
  const { sessionId } = await params
  const { supabase, user } = await getDashboardUser()

  const { data: session } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (!session) redirect("/dashboard")

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .order("question_index", { ascending: true })

  // Get inventory for power-ups
  const { data: inventory } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("user_id", user.id)

  // Check if this session is linked to a subject quiz
  const { data: subjectLink } = await supabase
    .from("subject_game_sessions")
    .select("subject_id, module_id, section_id, quiz_type")
    .eq("session_id", sessionId)
    .single()

  const subjectContext: SubjectContext | null = subjectLink
    ? {
        subject_id: subjectLink.subject_id,
        module_id: subjectLink.module_id,
        section_id: subjectLink.section_id,
        quiz_type: subjectLink.quiz_type as "diagnostic" | "section",
      }
    : null

  return (
    <GameClient
      session={session}
      questions={questions ?? []}
      inventory={inventory ?? []}
      subjectContext={subjectContext}
    />
  )
}
