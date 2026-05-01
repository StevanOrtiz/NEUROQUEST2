"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, BarChart3, Flame, Star, Target, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UsageReport {
  report_type: "baseline" | "day3"
  streak_day: number | null
  created_at: string
  metrics: any
  comparisons: any
}

interface ImpactReportContentProps {
  baseline: UsageReport | null
  day3: UsageReport | null
}

function value(report: UsageReport | null, path: string, fallback = 0) {
  return path.split(".").reduce<any>((current, key) => current?.[key], report?.metrics) ?? fallback
}

function delta(day3: UsageReport | null, key: string, fallback = 0) {
  return day3?.comparisons?.[key] ?? fallback
}

export function ImpactReportContent({ baseline, day3 }: ImpactReportContentProps) {
  const hasDay3 = Boolean(day3)
  const cards = [
    {
      icon: Star,
      label: "XP ganado",
      before: value(baseline, "profile.xp"),
      after: value(day3 ?? baseline, "profile.xp"),
      change: delta(day3, "xp_delta"),
      color: "text-rpg-gold",
    },
    {
      icon: Trophy,
      label: "Partidas completadas",
      before: value(baseline, "games.completed_sessions"),
      after: value(day3 ?? baseline, "games.completed_sessions"),
      change: delta(day3, "completed_sessions_delta"),
      color: "text-primary",
    },
    {
      icon: Target,
      label: "Precision promedio",
      before: `${value(baseline, "games.average_accuracy")}%`,
      after: `${value(day3 ?? baseline, "games.average_accuracy")}%`,
      change: `${delta(day3, "accuracy_delta")}%`,
      color: "text-rpg-mana",
    },
    {
      icon: Flame,
      label: "Dias activos",
      before: value(baseline, "activity.active_days"),
      after: value(day3 ?? baseline, "activity.active_days"),
      change: delta(day3, "active_days_delta"),
      color: "text-rpg-health",
    },
  ]

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <Button asChild variant="ghost" className="mb-5">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </Button>

      <motion.section
        className="rounded-xl border border-primary/20 bg-card/80 p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Reporte Dia 0 vs Dia 3</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Una foto visual del progreso desde que empezaste hasta cumplir una racha de 3 dias.
            </p>
          </div>
          <div className="rounded-lg border border-border/45 bg-background/30 px-4 py-3 text-sm">
            <span className="block text-xs text-muted-foreground">Estado</span>
            <span className={hasDay3 ? "font-semibold text-primary" : "font-semibold text-rpg-gold"}>
              {hasDay3 ? "Comparacion lista" : "Dia 3 pendiente"}
            </span>
          </div>
        </div>
      </motion.section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            className="rounded-xl border border-border/50 bg-card/75 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index }}
          >
            <card.icon className={`mb-3 h-5 w-5 ${card.color}`} />
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-secondary/35 p-3">
                <span className="block text-xs text-muted-foreground">Dia 0</span>
                <span className="font-mono text-lg font-bold text-foreground">{card.before}</span>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <span className="block text-xs text-muted-foreground">Dia 3</span>
                <span className="font-mono text-lg font-bold text-primary">{card.after}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Cambio: <span className="font-mono text-rpg-gold">{card.change}</span>
            </p>
          </motion.div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card/75 p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Aprendizaje</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Preguntas respondidas: {value(day3 ?? baseline, "questions.answered")}</p>
            <p>Secciones completadas: {value(day3 ?? baseline, "subjects.completed_sections")}</p>
            <p>Materias iniciadas: {value(day3 ?? baseline, "subjects.subjects_started")}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/75 p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Investigacion de uso</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>SUS enviado: {value(day3 ?? baseline, "forms.sus_submitted") ? "Si" : "No"}</p>
            <p>Chequeo TDAH: {value(day3 ?? baseline, "forms.adhd_completed") ? "Completado" : "Pendiente"}</p>
            <p>Tokens cacheados leidos: {value(day3 ?? baseline, "games.ai_cache_read_input_tokens")}</p>
          </div>
        </div>
      </section>

      {!hasDay3 && (
        <p className="mt-6 rounded-xl border border-rpg-gold/25 bg-rpg-gold/10 p-4 text-sm text-rpg-gold">
          Cuando alcances 3 dias de racha, QuestMind guardara automaticamente el reporte Dia 3.
        </p>
      )}
    </main>
  )
}
