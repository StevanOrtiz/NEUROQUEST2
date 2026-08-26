"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Archive, BarChart3, Brain, CheckCircle2, ChevronDown, ClipboardList, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ADHD_RESPONSE_OPTIONS,
  ADHD_SCREENING_QUESTIONS,
  ADHD_SCREENING_SOURCE,
  type AdhdScreeningLevel,
} from "@/lib/adhd/asrs-screener"
import { toast } from "sonner"
import { dispatchAchievementUnlock } from "@/lib/achievements/client-events"

interface SavedResult {
  id: string
  positiveCount: number
  totalScore: number
  level: AdhdScreeningLevel
  recommendation: string
  createdAt: string
}

const levelLabel: Record<AdhdScreeningLevel, string> = {
  low: "Senal baja",
  moderate: "Senal moderada",
  elevated: "Senal elevada",
}

const levelClass: Record<AdhdScreeningLevel, string> = {
  low: "text-primary",
  moderate: "text-rpg-gold",
  elevated: "text-rpg-health",
}

export function AdhdScreeningCard() {
  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<SavedResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingLatest, setLoadingLatest] = useState(true)

  const answeredCount = useMemo(() => {
    return ADHD_SCREENING_QUESTIONS.filter((question) => answers[question.id] !== undefined).length
  }, [answers])

  useEffect(() => {
    let cancelled = false

    // Always ask the server — this is a one-time-per-user gate, so a
    // sessionStorage cache here can go stale and permanently misreport
    // "already completed" (e.g. after the underlying row is deleted/reset)
    // for as long as the tab stays open.
    async function loadLatest() {
      try {
        const res = await fetch("/api/adhd-screening")
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setResult(data.result ?? null)
      } finally {
        if (!cancelled) setLoadingLatest(false)
      }
    }

    loadLatest()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit() {
    if (result) {
      toast.info("Este chequeo ya fue completado")
      return
    }

    if (answeredCount !== ADHD_SCREENING_QUESTIONS.length) {
      toast.error("Responde las 6 preguntas para ver el resultado")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/adhd-screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo guardar el resultado")
      }

      setResult(data)
      setOpen(false)
      toast.success("Resultado guardado")
      dispatchAchievementUnlock(data.achievement)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Collapsible open={result ? false : open} onOpenChange={result ? undefined : setOpen} asChild>
        <section className={`adhd-quiz-card rounded-xl border overflow-hidden ${
          result
            ? "border-border/45 bg-muted/45 grayscale"
            : "border-primary/25 bg-card/90"
        }`}>
        <CollapsibleTrigger
          disabled={Boolean(result)}
          className="flex w-full items-center justify-between gap-3 p-4 text-left disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
              result
                ? "bg-secondary/50 border-border text-muted-foreground"
                : "bg-primary/12 border-primary/25 text-primary"
            }`}>
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Chequeo TDAH{" "}
                {result && (
                  <span className="text-xs font-mono text-muted-foreground">(COMPLETADO)</span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {result
                  ? `${levelLabel[result.level]} · ${result.positiveCount}/6 senales`
                  : `Tamizaje breve ASRS-v1.1 · ${answeredCount}/6`}
              </p>
            </div>
          </div>
          {result ? (
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-border/40 p-4 pt-3">
          <p className="text-xs leading-relaxed text-muted-foreground mb-4">
            Basado en el screener ASRS-v1.1 para adultos. No diagnostica TDAH; ayuda a decidir si conviene hablar con un profesional.
          </p>

          <div className="space-y-4">
            {ADHD_SCREENING_QUESTIONS.map((question, index) => (
              <div key={question.id} className="rounded-lg bg-secondary/25 border border-border/40 p-3">
                <p className="text-sm text-foreground leading-snug mb-3">
                  <span className="text-primary font-mono">{index + 1}.</span> {question.text}
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {ADHD_RESPONSE_OPTIONS.map((option) => {
                    const active = answers[question.id] === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option.value }))}
                        className={`min-h-9 rounded-md border px-1.5 text-[11px] leading-tight transition-colors ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/60 bg-background/35 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        title={option.label}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full mt-4">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ver resultado"}
          </Button>

          {loadingLatest ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Cargando ultimo resultado
            </div>
          ) : result ? (
            <div className="mt-4 rounded-lg border border-border/50 bg-background/35 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className={`w-4 h-4 ${levelClass[result.level]}`} />
                <p className={`text-sm font-semibold ${levelClass[result.level]}`}>
                  {levelLabel[result.level]} · {result.positiveCount}/6 senales
                </p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{result.recommendation}</p>
            </div>
          ) : null}

          <a
            href={ADHD_SCREENING_SOURCE.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Fuente profesional: ASRS-v1.1
          </a>
        </CollapsibleContent>
        </section>
      </Collapsible>

      <Link
        href="/dashboard/impact"
        className="group flex items-center justify-between gap-3 rounded-xl border border-rpg-mana/25 bg-card/80 p-4 transition-all hover:border-rpg-mana/50 hover:bg-rpg-mana/10"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-rpg-mana/30 bg-rpg-mana/10 text-rpg-mana">
            <BarChart3 className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">Reporte Dia 0 vs Dia 3</span>
            <span className="block text-xs text-muted-foreground">Comparacion visual de progreso</span>
          </span>
        </span>
        <ChevronDown className="-rotate-90 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </Link>

      <Link
        href="/dashboard/personal-chest"
        className="group flex items-center justify-between gap-3 rounded-xl border border-rpg-gold/25 bg-card/80 p-4 transition-all hover:border-rpg-gold/50 hover:bg-rpg-gold/10"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-rpg-gold/30 bg-rpg-gold/10 text-rpg-gold">
            <Archive className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">Tu cofre personal</span>
            <span className="block text-xs text-muted-foreground">Misiones, tareas y pergaminos</span>
          </span>
        </span>
        <ChevronDown className="-rotate-90 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  )
}
