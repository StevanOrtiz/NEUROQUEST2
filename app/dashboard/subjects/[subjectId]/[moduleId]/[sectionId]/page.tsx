// app/dashboard/subjects/[subjectId]/[moduleId]/[sectionId]/page.tsx
// Shows theory content for a section + button to start the quiz.

import { redirect } from "next/navigation"
import { getSubjectById } from "@/lib/subjects/config"
import { SectionClient } from "@/components/subjects/section-client"
import { getDashboardUser } from "@/lib/auth/dashboard-user"

interface SectionPageProps {
  params: Promise<{ subjectId: string; moduleId: string; sectionId: string }>
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { subjectId, moduleId, sectionId } = await params
  const { supabase, user } = await getDashboardUser()

  const subject = getSubjectById(subjectId)
  if (!subject) redirect("/dashboard/subjects")

  const module = subject.modules.find((m) => m.id === moduleId)
  if (!module) redirect(`/dashboard/subjects/${subjectId}`)

  const section = module.sections.find((s) => s.id === sectionId)
  if (!section) redirect(`/dashboard/subjects/${subjectId}`)

  // Check user is allowed to access this section
  const { data: progress } = await supabase
    .from("user_subject_progress")
    .select("unlocked_sections, completed_sections")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .single()

  const unlockedSections: string[] = progress?.unlocked_sections ?? []
  const isUnlocked = unlockedSections.includes(sectionId)

  if (!isUnlocked) {
    redirect(`/dashboard/subjects/${subjectId}`)
  }

  const completedSections: string[] = progress?.completed_sections ?? []
  const isCompleted = completedSections.includes(sectionId)

  return (
    <SectionClient
      subject={subject}
      module={module}
      section={section}
      isCompleted={isCompleted}
    />
  )
}
