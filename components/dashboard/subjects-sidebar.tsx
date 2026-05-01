"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Subject } from "@/lib/subjects/config"
import { BookOpen, CheckCircle2, ChevronRight, Lock, Map, Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface SubjectProgress {
  subject_id: string
  diagnostic_passed: boolean
  subject_completed: boolean
  completed_modules: string[]
  completed_sections: string[]
}

interface SubjectsSidebarProps {
  subjects: Subject[]
  progressMap: Record<string, SubjectProgress>
}

export function SubjectsSidebar({ subjects, progressMap }: SubjectsSidebarProps) {
  const router = useRouter()

  const totalModules = subjects.reduce((sum, subject) => sum + subject.modules.length, 0)
  const completedModules = subjects.reduce((sum, subject) => {
    const progress = progressMap[subject.id]
    return sum + (progress?.completed_modules?.length ?? 0)
  }, 0)
  const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  return (
    <div className="adventure-panel flex h-full min-h-[560px] flex-col rounded-xl border border-primary/20 bg-card/85 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-primary/25 bg-primary/10 p-2 text-primary">
            <Map className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Mapa de materias</h2>
            <p className="text-xs text-muted-foreground">Ruta de aventura</p>
          </div>
        </div>
        <button
          onMouseEnter={() => router.prefetch("/dashboard/subjects")}
          onFocus={() => router.prefetch("/dashboard/subjects")}
          onClick={() => router.push("/dashboard/subjects")}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
        >
          Ver todas
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="mb-5 rounded-lg border border-border/40 bg-secondary/25 p-3">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>Progreso global</span>
          <span className="font-mono">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-1.5" />
      </div>

      <div className="adventure-map flex-1">
        {subjects.map((subject, index) => {
          const progress = progressMap[subject.id]
          const diagnosticPassed = progress?.diagnostic_passed ?? false
          const completed = progress?.subject_completed ?? false
          const completedMods = progress?.completed_modules?.length ?? 0
          const totalMods = subject.modules.length
          const subjectProgress = totalMods > 0 ? Math.round((completedMods / totalMods) * 100) : 0
          const active = diagnosticPassed && !completed

          return (
            <motion.button
              key={subject.id}
              type="button"
              onMouseEnter={() => router.prefetch(`/dashboard/subjects/${subject.id}`)}
              onFocus={() => router.prefetch(`/dashboard/subjects/${subject.id}`)}
              onClick={() => router.push(`/dashboard/subjects/${subject.id}`)}
              className={`adventure-node-row ${index % 2 === 1 ? "adventure-node-row-alt" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span
                className={`adventure-node ${
                  completed ? "adventure-node-completed" : active ? "adventure-node-active" : "adventure-node-locked"
                }`}
              >
                <span className="text-xl">{subject.icon}</span>
                {completed && <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-rpg-gold" />}
              </span>

              <span className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-foreground">{subject.title}</span>
                  {completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-rpg-gold" />
                  ) : !diagnosticPassed ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {completed
                    ? "Zona conquistada"
                    : !diagnosticPassed
                    ? "Desbloquea con test"
                    : `${completedMods}/${totalMods} modulos`}
                </span>
                {diagnosticPassed && !completed && (
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-secondary">
                    <span
                      className="block h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${subjectProgress}%` }}
                    />
                  </span>
                )}
              </span>
            </motion.button>
          )
        })}
      </div>

      {subjects.some((subject) => !progressMap[subject.id]?.diagnostic_passed) && (
        <p className="mt-4 rounded-lg border border-border/35 bg-background/30 p-3 text-center text-xs text-muted-foreground">
          Completa tests diagnosticos para abrir nuevos caminos.
        </p>
      )}
    </div>
  )
}
