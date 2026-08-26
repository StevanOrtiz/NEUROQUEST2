// app/api/subjects/complete-quiz/route.ts
// Called by the subject module/section pages AFTER the game session finishes.
// Updates user_subject_progress and (on subject completion) grants the medal.

import { createClient } from "@/lib/supabase/server"
import { grantAchievement, type GrantedAchievement } from "@/lib/achievements/grant"
import { getSubjectById } from "@/lib/subjects/config"
import { updateUserStreak } from "@/lib/streak/update-streak"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return Response.json({ error: "Falta sessionId" }, { status: 400 })
    }

    // ── Verify game session belongs to user & is finished ─
    const { data: gameSession } = await supabase
      .from("game_sessions")
      .select("status")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (!gameSession) {
      return Response.json({ error: "Sesión no encontrada" }, { status: 404 })
    }

    const passed = gameSession.status === "victory"

    // ── Get subject context for this session ──────────────
    const { data: link } = await supabase
      .from("subject_game_sessions")
      .select("subject_id, module_id, section_id, quiz_type")
      .eq("session_id", sessionId)
      .single()

    if (!link) {
      return Response.json({ error: "Contexto de materia no encontrado" }, { status: 404 })
    }

    const subject = getSubjectById(link.subject_id)
    if (!subject) {
      return Response.json({ error: "Materia no encontrada" }, { status: 404 })
    }

    // ── Fetch or create progress row ──────────────────────
    let { data: progress } = await supabase
      .from("user_subject_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("subject_id", link.subject_id)
      .single()

    if (!progress) {
      const { data: created } = await supabase
        .from("user_subject_progress")
        .insert({
          user_id: user.id,
          subject_id: link.subject_id,
        })
        .select("*")
        .single()
      progress = created
    }

    if (!progress) {
      return Response.json({ error: "Error en progreso" }, { status: 500 })
    }

    const unlockedModules: string[] = (progress.unlocked_modules as string[] | null) ?? []
    const unlockedSections: string[] = (progress.unlocked_sections as string[] | null) ?? []
    const completedSections: string[] = (progress.completed_sections as string[] | null) ?? []
    const completedModules: string[] = (progress.completed_modules as string[] | null) ?? []

    let diagnosticPassed = progress.diagnostic_passed
    let subjectCompleted = progress.subject_completed
    let medalGranted = false
    const achievements: GrantedAchievement[] = []

    // ── DIAGNOSTIC TEST ───────────────────────────────────
    if (link.quiz_type === "diagnostic" && passed && !diagnosticPassed) {
      diagnosticPassed = true
      // Unlock first module + first section of first module
      const firstModule = subject.modules[0]
      if (!unlockedModules.includes(firstModule.id)) unlockedModules.push(firstModule.id)
      const firstSection = firstModule.sections[0]
      if (!unlockedSections.includes(firstSection.id)) unlockedSections.push(firstSection.id)
    }

    // ── SECTION QUIZ ──────────────────────────────────────
    if (link.quiz_type === "section" && passed && link.section_id && link.module_id) {
      const sectionId = link.section_id
      const moduleId = link.module_id

      if (!completedSections.includes(sectionId)) {
        completedSections.push(sectionId)
      }

      const currentModule = subject.modules.find((m) => m.id === moduleId)
      if (currentModule) {
        const sectionIndex = currentModule.sections.findIndex((s) => s.id === sectionId)
        const nextSection = currentModule.sections[sectionIndex + 1]

        if (nextSection) {
          // Unlock next section within same module
          if (!unlockedSections.includes(nextSection.id)) {
            unlockedSections.push(nextSection.id)
          }
        } else {
          // Last section of module → mark module complete
          const allSectionsComplete = currentModule.sections.every((s) =>
            completedSections.includes(s.id)
          )
          if (allSectionsComplete && !completedModules.includes(moduleId)) {
            completedModules.push(moduleId)
            const moduleAchievement = await grantAchievement(supabase, user.id, "first_module_completed", {
              subjectId: subject.id,
              moduleId,
            })
            if (moduleAchievement) achievements.push(moduleAchievement)

            // Unlock next module
            const moduleIndex = subject.modules.findIndex((m) => m.id === moduleId)
            const nextModule = subject.modules[moduleIndex + 1]
            if (nextModule) {
              if (!unlockedModules.includes(nextModule.id)) {
                unlockedModules.push(nextModule.id)
              }
              // Unlock first section of next module
              const nextModuleFirstSection = nextModule.sections[0]
              if (!unlockedSections.includes(nextModuleFirstSection.id)) {
                unlockedSections.push(nextModuleFirstSection.id)
              }
            } else {
              // No more modules → subject complete!
              const allModulesComplete = subject.modules.every((m) =>
                completedModules.includes(m.id)
              )
              if (allModulesComplete && !subjectCompleted) {
                subjectCompleted = true
                // Grant medal via inventory
                medalGranted = await grantMedal(supabase, user.id, subject.id, subject.title, subject.medalIcon)
                const subjectAchievement = await grantAchievement(supabase, user.id, "first_subject_completed", {
                  subjectId: subject.id,
                })
                if (subjectAchievement) achievements.push(subjectAchievement)
              }
            }
          }
        }
      }
    }

    // ── Persist progress ──────────────────────────────────
    await supabase
      .from("user_subject_progress")
      .update({
        diagnostic_passed: diagnosticPassed,
        subject_completed: subjectCompleted,
        unlocked_modules: unlockedModules,
        unlocked_sections: unlockedSections,
        completed_sections: completedSections,
        completed_modules: completedModules,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("subject_id", link.subject_id)

    // ── Update daily streak ─────────────────────────────────
    const streakResult = await updateUserStreak(user.id)

    return Response.json({
      passed,
      diagnosticPassed,
      subjectCompleted,
      medalGranted,
      unlockedModules,
      unlockedSections,
      completedSections,
      completedModules,
      achievements,
      streak: streakResult ?? null,
    })
  } catch (err) {
    console.error("complete-quiz error:", err)
    return Response.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── Helper: grant medal using existing inventory system ───
async function grantMedal(
  supabase: any,
  userId: string,
  subjectId: string,
  subjectTitle: string,
  medalIcon: string
): Promise<boolean> {
  try {
    // We store medals as a special inventory item type 'hint' (extensible)
    // using a composite key so each subject medal is unique per user.
    // The item_type is constrained — we repurpose 'hint' as a safe placeholder
    // and differentiate by item_name. No schema change needed.
    const medalItemType = "hint" as const

    const { error } = await supabase.from("inventory_items").upsert(
      {
        user_id: userId,
        item_type: medalItemType,
        item_name: `Medalla: ${subjectTitle}`,
        item_description: `Completaste la materia ${subjectTitle} con éxito. ¡Aventurero de élite!`,
        quantity: 1,
        icon: medalIcon,
      },
      {
        onConflict: "user_id,item_type",
        ignoreDuplicates: true,
      }
    )
    return !error
  } catch {
    return false
  }
}
