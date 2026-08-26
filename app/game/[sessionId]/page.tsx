import { redirect } from "next/navigation"
import { GameClient } from "@/components/game/game-client"
import { getDashboardUser } from "@/lib/auth/dashboard-user"
import type { GameSession, Question, InventoryItem } from "@/lib/types"

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

  // These four queries don't depend on each other's results, so they're
  // fired together instead of awaited one at a time.
  const [{ data: session }, { data: questions }, { data: inventory }, { data: subjectLink }] =
    await Promise.all([
      supabase
        .from("game_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("questions")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .order("question_index", { ascending: true }),
      // Inventory for power-ups
      supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id),
      // Is this session linked to a subject quiz?
      supabase
        .from("subject_game_sessions")
        .select("subject_id, module_id, section_id, quiz_type")
        .eq("session_id", sessionId)
        .single(),
    ])

  if (!session) redirect("/dashboard")

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
      session={session as GameSession}
      questions={(questions ?? []) as Question[]}
      inventory={(inventory ?? []) as InventoryItem[]}
      subjectContext={subjectContext}
    />
  )
}
