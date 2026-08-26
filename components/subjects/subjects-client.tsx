"use client"
// components/subjects/subjects-client.tsx
// Renders the subject grid on /dashboard/subjects.

import { useRouter } from "next/navigation"
import { Subject } from "@/lib/subjects/config"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle2, Lock, ChevronRight } from "lucide-react"

interface SubjectsClientProps {
  subjects: Subject[]
  progressMap: Record<string, any>
}

export function SubjectsClient({ subjects, progressMap }: SubjectsClientProps) {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Materias
        </h1>
        <p className="text-muted-foreground">
          Aprende y sube de nivel completando módulos gamificados
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {subjects.map((subject) => {
          const progress = progressMap[subject.id]
          const diagnosticPassed = progress?.diagnostic_passed ?? false
          const completed = progress?.subject_completed ?? false
          const completedModules: string[] = progress?.completed_modules ?? []
          const totalModules = subject.modules.length
          const modulesCompleted = completedModules.length

          return (
            <button
              key={subject.id}
              onClick={() => router.push(`/dashboard/subjects/${subject.id}`)}
              className="text-left group border border-border/50 rounded-xl bg-rpg-surface p-5 hover:border-primary/50 hover:bg-secondary/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{subject.icon}</span>
                  <div>
                    <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {subject.title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {subject.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 shrink-0 group-hover:text-primary transition-colors" />
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                {completed ? (
                  <div className="flex items-center gap-1.5 text-xs text-rpg-gold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completada · {subject.medalIcon}</span>
                  </div>
                ) : !diagnosticPassed ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Test diagnóstico requerido</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{modulesCompleted}/{totalModules} módulos</span>
                      <span>{Math.round((modulesCompleted / totalModules) * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rpg-xp transition-all duration-500"
                        style={{ width: `${(modulesCompleted / totalModules) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <Button
        variant="ghost"
        className="mt-6 text-muted-foreground"
        onClick={() => router.push("/dashboard")}
      >
        ← Volver al inicio
      </Button>
    </div>
  )
}