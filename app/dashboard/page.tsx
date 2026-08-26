import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { UsageReportBootstrap } from "@/components/research/usage-report-bootstrap"
import { getDashboardUser } from "@/lib/auth/dashboard-user"
import { SUBJECTS } from "@/lib/subjects/config"
import type { GameSession } from "@/lib/types"

export default async function DashboardPage() {
  const { supabase, user } = await getDashboardUser()

  const [{ data: profile }, { data: recentSessions }, { data: subjectProgress }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,display_name,level,xp,total_games,total_correct,created_at,current_streak,longest_streak,last_activity_date,streak_updated_at,tutorial_completed,tutorial_skipped,tutorial_completed_at")
        .eq("id", user.id)
        .single(),
      supabase
        .from("game_sessions")
        .select("id,user_id,pdf_name,difficulty,total_questions,correct_answers,wrong_answers,lives_remaining,xp_earned,status,current_question_index,created_at,finished_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("user_subject_progress")
        .select("subject_id,diagnostic_passed,subject_completed,completed_modules,completed_sections")
        .eq("user_id", user.id),
    ])

  const progressMap = Object.fromEntries(
    (subjectProgress ?? []).map((p) => [
      p.subject_id,
      {
        ...p,
        completed_modules: (p.completed_modules as string[] | null) ?? [],
        completed_sections: (p.completed_sections as string[] | null) ?? [],
      },
    ])
  )

  const showTutorial =
    (profile?.xp ?? 0) === 0 &&
    !profile?.tutorial_completed &&
    !profile?.tutorial_skipped

  return (
    <>
      <UsageReportBootstrap />
      <DashboardContent
        profile={profile}
        recentSessions={(recentSessions ?? []) as GameSession[]}
        subjects={SUBJECTS}
        subjectProgressMap={progressMap}
        showTutorial={showTutorial}
        userId={user.id}
      />
    </>
  )
}
