"use client"
// components/subjects/subject-detail-client.tsx
// Shows the subject detail page: diagnostic gate + module/section tree.

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Subject } from "@/lib/subjects/config"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Swords,
} from "lucide-react"
import { toast } from "sonner"

interface SubjectDetailClientProps {
  subject: Subject
  progress: any | null
}

export function SubjectDetailClient({ subject, progress }: SubjectDetailClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  const diagnosticPassed: boolean = progress?.diagnostic_passed ?? false
  const subjectCompleted: boolean = progress?.subject_completed ?? false
  const unlockedModules: string[] = progress?.unlocked_modules ?? []
  const unlockedSections: string[] = progress?.unlocked_sections ?? []
  const completedSections: string[] = progress?.completed_sections ?? []
  const completedModules: string[] = progress?.completed_modules ?? []

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId)
      return next
    })
  }

  const startDiagnostic = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/subjects/create-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: subject.id, quizType: "diagnostic" }),
      })
      const data = await res.json()
      if (data.sessionId) {
        router.push(`/game/${data.sessionId}`)
      } else {
        toast.error(data.error ?? "Error al crear el quiz")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-5xl">{subject.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{subject.title}</h1>
          <p className="text-muted-foreground">{subject.description}</p>
          {subjectCompleted && (
            <div className="flex items-center gap-1.5 mt-1 text-rpg-gold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Completada! {subject.medalIcon}</span>
            </div>
          )}
        </div>
      </div>

      {/* Diagnostic gate */}
      <div className={`rounded-xl border p-5 mb-6 ${diagnosticPassed ? "border-green-500/30 bg-green-500/5" : "border-rpg-gold/30 bg-rpg-gold/5"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${diagnosticPassed ? "bg-green-500/20" : "bg-rpg-gold/20"}`}>
              {diagnosticPassed ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <Swords className="w-4 h-4 text-rpg-gold" />
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Test Diagnóstico</p>
              <p className="text-xs text-muted-foreground">
                {diagnosticPassed
                  ? "Aprobado — módulos desbloqueados"
                  : `${subject.diagnosticTest.length} preguntas · Obligatorio para desbloquear módulos`}
              </p>
            </div>
          </div>

          {!diagnosticPassed && (
            <Button
              size="sm"
              onClick={startDiagnostic}
              disabled={loading}
              className="shrink-0"
            >
              {loading ? "Creando..." : "Empezar"}
            </Button>
          )}
        </div>
      </div>

      {/* Modules list */}
      <div className="space-y-3">
        {subject.modules.map((module, mIdx) => {
          const isModuleUnlocked = diagnosticPassed && unlockedModules.includes(module.id)
          const isModuleCompleted = completedModules.includes(module.id)
          const isExpanded = expandedModules.has(module.id)

          return (
            <div
              key={module.id}
              className={`rounded-xl border transition-colors ${
                isModuleUnlocked
                  ? "border-border/50 bg-rpg-surface"
                  : "border-border/20 bg-secondary/10 opacity-60"
              }`}
            >
              {/* Module header */}
              <button
                className="w-full flex items-center justify-between gap-3 p-4"
                onClick={() => isModuleUnlocked && toggleModule(module.id)}
                disabled={!isModuleUnlocked}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{module.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-foreground text-sm">
                      Módulo {mIdx + 1}: {module.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isModuleCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-rpg-gold" />
                  )}
                  {!isModuleUnlocked ? (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  ) : isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Sections list */}
              {isModuleUnlocked && isExpanded && (
                <div className="border-t border-border/30 px-4 pb-3 space-y-1.5 pt-2">
                  {module.sections.map((section, sIdx) => {
                    const isSectionUnlocked = unlockedSections.includes(section.id)
                    const isSectionCompleted = completedSections.includes(section.id)

                    return (
                      <button
                        key={section.id}
                        disabled={!isSectionUnlocked}
                        onClick={() =>
                          isSectionUnlocked &&
                          router.push(
                            `/dashboard/subjects/${subject.id}/${module.id}/${section.id}`
                          )
                        }
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          isSectionUnlocked
                            ? "hover:bg-secondary/50 cursor-pointer"
                            : "opacity-40 cursor-not-allowed"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isSectionCompleted ? "bg-green-500/20" : isSectionUnlocked ? "bg-primary/10" : "bg-secondary"}`}>
                          {isSectionCompleted ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                          ) : isSectionUnlocked ? (
                            <BookOpen className="w-3 h-3 text-primary" />
                          ) : (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>

                        <span className="flex-1 text-left font-medium text-foreground">
                          {sIdx + 1}. {section.title}
                        </span>

                        {isSectionUnlocked && !isSectionCompleted && (
                          <PlayCircle className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Button
        variant="ghost"
        className="mt-6 text-muted-foreground"
        onClick={() => router.push("/dashboard/subjects")}
      >
        ← Volver a Materias
      </Button>
    </div>
  )
}