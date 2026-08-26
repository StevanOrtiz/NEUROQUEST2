"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Flame, Lock, CheckCircle2, ChevronRight, ChevronLeft,
  Star, Shield, Zap, Trophy, Sparkles, ClipboardList
} from "lucide-react"
import { toast } from "sonner"

const SUS_QUESTIONS = [
  { id: 1, text: "Creo que me gustaría usar este sistema con frecuencia." },
  { id: 2, text: "Encontré el sistema innecesariamente complejo." },
  { id: 3, text: "Pensé que el sistema era fácil de usar." },
  { id: 4, text: "Creo que necesitaría el apoyo de una persona técnica para poder usar este sistema." },
  { id: 5, text: "Las funciones del sistema estaban bien integradas." },
  { id: 6, text: "Había demasiada inconsistencia en este sistema." },
  { id: 7, text: "Imagino que la mayoría de las personas aprenderían muy rápidamente a usar este sistema." },
  { id: 8, text: "El sistema era muy incómodo de usar." },
  { id: 9, text: "Me sentí muy seguro/a usando el sistema." },
  { id: 10, text: "Necesité aprender muchas cosas antes de poder comenzar a usar el sistema." },
]

const SCORE_TIERS = [
  { min: 85, label: "LEGENDARIO", color: "text-rpg-legendary", bg: "bg-rpg-legendary/10 border-rpg-legendary/30", icon: Sparkles },
  { min: 70, label: "ÉPICO", color: "text-rpg-gold", bg: "bg-rpg-gold/10 border-rpg-gold/30", icon: Trophy },
  { min: 50, label: "BUENO", color: "text-primary", bg: "bg-primary/10 border-primary/30", icon: Shield },
  { min: 0, label: "NECESITA MEJORA", color: "text-rpg-health", bg: "bg-rpg-health/10 border-rpg-health/30", icon: Zap },
]

interface SusFormProps {
  currentStreak: number
  level: number
}

export function SusForm({ currentStreak, level }: SusFormProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const [checking, setChecking] = useState(true)

  const isUnlocked = currentStreak >= 1 && level >= 1

  useEffect(() => {
    // Always ask the server — this is a one-time-per-user gate, so a
    // sessionStorage cache here can go stale and permanently misreport
    // "already completed" (e.g. after the underlying row is deleted/reset)
    // for as long as the tab stays open.
    async function checkSubmission() {
      try {
        const res = await fetch("/api/sus")
        if (res.ok) {
          const data = await res.json()
          if (data.submitted) {
            setSubmitted(true)
            setFinalScore(parseFloat(data.response.sus_score))
          }
        }
      } catch {
        // silently ignore network errors
      } finally {
        setChecking(false)
      }
    }
    checkSubmission()
  }, [])

  function setAnswer(qId: number, value: number) {
    setAnswers((prev) => ({ ...prev, [`q${qId}`]: value }))
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < 10) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/sus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFinalScore(parseFloat(data.sus_score))
      setSubmitted(true)
      setCurrentStep(11)
      toast.success("¡Formulario SUS completado!")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al enviar")
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) return null

  // ── LOCKED ────────────────────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
        <div className="relative rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,oklch(0.15_0.02_280/0.4)_10px,oklch(0.15_0.02_280/0.4)_11px)] pointer-events-none" />
          <div className="relative p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1 flex items-center justify-center gap-2">
                <ClipboardList className="w-5 h-5 text-rpg-gold" />
                Formulario SUS
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ayúdanos a mejorar QuestMind completando el cuestionario de usabilidad.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${
                currentStreak >= 1
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground"
              }`}>
                <Flame className="w-4 h-4" />
                <span>Racha: {currentStreak}/1 día</span>
                {currentStreak >= 1 && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${
                level >= 1
                  ? "border-rpg-gold/40 bg-rpg-gold/10 text-rpg-gold"
                  : "border-border bg-secondary text-muted-foreground"
              }`}>
                <Star className="w-4 h-4" />
                <span>Nivel: {level}/1</span>
                {level >= 1 && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Completa tu primer día de racha y alcanza el nivel 1 para desbloquear este formulario.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── ALREADY SUBMITTED ─────────────────────────────────────────────────────
  if (submitted && currentStep !== 11) {
    const tier = SCORE_TIERS.find((t) => (finalScore ?? 0) >= t.min) ?? SCORE_TIERS[3]
    const TierIcon = tier.icon
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
        <div className={`rounded-xl border p-6 flex flex-col sm:flex-row items-center gap-4 ${tier.bg}`}>
          <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
            <TierIcon className={`w-6 h-6 ${tier.color}`} />
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-0.5">SUS Completado</p>
            <h3 className="text-lg font-bold text-foreground">
              Puntuación: <span className={tier.color}>{finalScore?.toFixed(1)} — {tier.label}</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gracias por ayudar a mejorar QuestMind. Tu opinión es invaluable.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── RESULT SCREEN ─────────────────────────────────────────────────────────
  if (currentStep === 11 && finalScore !== null) {
    const tier = SCORE_TIERS.find((t) => finalScore >= t.min) ?? SCORE_TIERS[3]
    const TierIcon = tier.icon
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4">
        <div className={`rounded-xl border p-8 text-center ${tier.bg}`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-secondary border-2 mx-auto mb-4 flex items-center justify-center"
          >
            <TierIcon className={`w-9 h-9 ${tier.color}`} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className={`font-mono text-xs tracking-[0.2em] uppercase mb-1 ${tier.color}`}>
              Sistema — {tier.label}
            </p>
            <h2 className="text-5xl font-black text-foreground mb-2">{finalScore.toFixed(1)}</h2>
            <p className="text-muted-foreground text-sm">Puntuación SUS · Escala 0–100</p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-sm text-muted-foreground max-w-xs mx-auto"
          >
            ¡Misión completada, Aventurero! Tu feedback ayudará a que QuestMind sea mejor para todos.
          </motion.p>
        </div>
      </motion.div>
    )
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (currentStep === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
        <div className="rounded-xl border border-primary/30 bg-card overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-rpg-gold to-rpg-mana" />
          <div className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-foreground">Formulario SUS</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">
                    DESBLOQUEADO
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">10 preguntas · ~2 minutos · Tu opinión importa</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              El <strong className="text-foreground">System Usability Scale (SUS)</strong> es un cuestionario estándar
              que mide la usabilidad de QuestMind. Responde con sinceridad; no hay respuestas correctas o incorrectas.
            </p>
            <div className="flex items-center gap-1 mb-5">
              {SUS_QUESTIONS.map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full bg-secondary" />
              ))}
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              <Zap className="w-4 h-4" />
              Comenzar Cuestionario
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── QUESTION STEPS ────────────────────────────────────────────────────────
  const currentQ = SUS_QUESTIONS[currentStep - 1]
  const currentAnswer = answers[`q${currentQ.id}`]
  const canNext = currentAnswer !== undefined

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="h-1 bg-secondary">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-rpg-gold"
            animate={{ width: `${(currentStep / 10) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-mono text-muted-foreground">Pregunta {currentStep} de 10</span>
            <div className="flex gap-1">
              {SUS_QUESTIONS.map((q, i) => (
                <div
                  key={q.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    answers[`q${q.id}`] !== undefined
                      ? "bg-primary"
                      : i + 1 === currentStep
                      ? "bg-rpg-gold"
                      : "bg-secondary"
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-base font-medium text-foreground mb-6 leading-relaxed min-h-[3rem]">
                {currentQ.text}
              </p>
              <div className="grid grid-cols-5 gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAnswer(currentQ.id, val)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-sm font-bold transition-all ${
                      currentAnswer === val
                        ? "border-primary bg-primary/15 text-primary scale-105 shadow-[0_0_12px_oklch(0.72_0.20_145/0.25)]"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="text-lg leading-none">{val}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Totalmente en desacuerdo</span>
                <span>Totalmente de acuerdo</span>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            {currentStep < 10 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canNext || submitting || Object.keys(answers).length < 10}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {submitting ? "Enviando…" : (
                  <>
                    <Trophy className="w-4 h-4" />
                    Enviar Resultados
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
