"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Trophy, Skull, Star, Package, ArrowRight, Loader2, Check, BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SubjectContext } from "@/app/game/[sessionId]/page"
import { dispatchAchievementUnlock, dispatchAchievementUnlocks } from "@/lib/achievements/client-events"

interface GameOverScreenProps {
  status: "victory" | "defeat"
  sessionId: string
  xpEarned: number
  correctAnswers: number
  totalQuestions: number
  pdfName: string
  subjectContext?: SubjectContext | null
  onBackToDashboard: () => void
}

export function GameOverScreen({
  status,
  sessionId,
  xpEarned,
  correctAnswers,
  totalQuestions,
  pdfName,
  subjectContext,
  onBackToDashboard,
}: GameOverScreenProps) {
  const router = useRouter()
  const isVictory = status === "victory"
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100)
  const earnedChest = isVictory && accuracy > 75
  const isSubjectQuiz = !!subjectContext

  // Chest-save state
  const [chestSaved, setChestSaved] = useState(false)
  const [savingChest, setSavingChest] = useState(false)
  const [chestError, setChestError] = useState(false)
  const savedRef = useRef(false)

  // Subject progress state
  const [subjectProgressSaved, setSubjectProgressSaved] = useState(false)
  const [savingSubjectProgress, setSavingSubjectProgress] = useState(false)
  const [subjectProgressResult, setSubjectProgressResult] = useState<{
    diagnosticPassed?: boolean
    subjectCompleted?: boolean
    medalGranted?: boolean
  } | null>(null)
  const subjectSavedRef = useRef(false)

  // Automatically save subject progress if this is a subject quiz
  useEffect(() => {
    if (!isSubjectQuiz || subjectSavedRef.current) return
    subjectSavedRef.current = true

    setSavingSubjectProgress(true)
    fetch("/api/subjects/complete-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSubjectProgressSaved(true)
        setSubjectProgressResult({
          diagnosticPassed: data.diagnosticPassed,
          subjectCompleted: data.subjectCompleted,
          medalGranted: data.medalGranted,
        })
        if (data.achievements?.length) {
          dispatchAchievementUnlocks(data.achievements)
        } else if (data.subjectCompleted) {
          window.dispatchEvent(
            new CustomEvent("questmind:mascot-message", {
              detail: { message: "Materia completada. Eso merece una vuelta triunfal." },
            })
          )
        }
      })
      .catch(() => {
        // Non-fatal: progress just won't be saved
        setSubjectProgressSaved(true)
      })
      .finally(() => setSavingSubjectProgress(false))
  }, [isSubjectQuiz, sessionId])

  // Automatically save chest to inventory if earned
  useEffect(() => {
    if (!earnedChest || savedRef.current) return
    savedRef.current = true

    setSavingChest(true)
    fetch("/api/game/chest/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.earned || data.reason?.includes("Ya existe")) {
          setChestSaved(true)
          if (data.achievement) {
            dispatchAchievementUnlock(data.achievement)
          } else {
            window.dispatchEvent(
              new CustomEvent("questmind:mascot-message", {
                detail: { message: "Cofre guardado. Huele a recompensa." },
              })
            )
          }
        } else {
          setChestError(true)
        }
      })
      .catch(() => setChestError(true))
      .finally(() => setSavingChest(false))
  }, [earnedChest, sessionId])

  return (
    <main className="min-h-screen flex items-center justify-center px-4 rpg-grid-bg">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
        <motion.div
          className="mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isVictory ? (
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto glow-primary">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto glow-health">
              <Skull className="w-10 h-10 text-destructive" />
            </div>
          )}
        </motion.div>

        {/* Title */}
        <motion.h1
          className={`text-3xl font-bold mb-2 ${isVictory ? "text-primary" : "text-destructive"}`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isVictory ? "¡Victoria!" : "Derrota"}
        </motion.h1>

        <motion.p
          className="text-muted-foreground mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {isVictory
            ? `Has conquistado "${pdfName}"`
            : `"${pdfName}" te ha derrotado esta vez`}
        </motion.p>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-3 gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="p-3 rounded-xl bg-card border border-border/50">
            <Star className="w-5 h-5 text-rpg-gold mx-auto mb-1" />
            <p className="text-lg font-bold font-mono text-rpg-gold">{xpEarned}</p>
            <p className="text-xs text-muted-foreground">XP ganada</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/50">
            <p className="text-lg font-bold font-mono text-foreground">
              {correctAnswers}/{totalQuestions}
            </p>
            <p className="text-xs text-muted-foreground">Correctas</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/50">
            <p className="text-lg font-bold font-mono text-foreground">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">Precisión</p>
          </div>
        </motion.div>

        {/* Chest reward notification */}
        {earnedChest && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {savingChest ? (
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Guardando cofre en tu inventario...</span>
              </div>
            ) : chestSaved ? (
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/8 text-yellow-400">
                <span className="text-2xl">🪙</span>
                <div className="text-left">
                  <p className="text-sm font-semibold">¡Cofre guardado!</p>
                  <p className="text-xs text-yellow-400/70">
                    Ve a Inventario → Cofres para abrirlo con la ruleta
                  </p>
                </div>
                <Check className="w-5 h-5 ml-auto shrink-0" />
              </div>
            ) : chestError ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-card text-muted-foreground text-sm">
                <Package className="w-4 h-4" />
                <span>No se pudo guardar el cofre. Intenta de nuevo.</span>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* No chest notification for defeats or low accuracy */}
        {isVictory && !earnedChest && !isSubjectQuiz && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-sm text-muted-foreground">
              Necesitas más del 75% de precisión para ganar un cofre.
            </p>
          </motion.div>
        )}

        {/* Subject progress notification */}
        {isSubjectQuiz && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            {savingSubjectProgress ? (
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl border border-primary/30 bg-primary/5 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Guardando progreso...</span>
              </div>
            ) : subjectProgressSaved ? (
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl border border-primary/40 bg-primary/5">
                <BookOpen className="w-5 h-5 text-primary" />
                <div className="text-left flex-1">
                  {isVictory ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        {subjectProgressResult?.diagnosticPassed && subjectContext?.quiz_type === "diagnostic"
                          ? "¡Diagnóstico aprobado!"
                          : subjectProgressResult?.subjectCompleted
                          ? "¡Materia completada!"
                          : "¡Sección completada!"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {subjectProgressResult?.subjectCompleted
                          ? "Has desbloqueado una medalla"
                          : subjectContext?.quiz_type === "diagnostic"
                          ? "Módulos desbloqueados"
                          : "Siguiente sección desbloqueada"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-foreground">Quiz no aprobado</p>
                      <p className="text-xs text-muted-foreground">Inténtalo de nuevo para avanzar</p>
                    </>
                  )}
                </div>
                {isVictory && subjectProgressResult?.subjectCompleted && (
                  <Sparkles className="w-5 h-5 text-rpg-gold shrink-0" />
                )}
                {isVictory && !subjectProgressResult?.subjectCompleted && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Navigation buttons */}
        <div className="flex flex-col gap-2">
          {isSubjectQuiz && (
            <Button
              onClick={() => router.push(`/dashboard/subjects/${subjectContext.subject_id}`)}
              className="w-full"
              size="lg"
            >
              Volver a la materia
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          <Button
            onClick={onBackToDashboard}
            variant={isSubjectQuiz ? "outline" : "default"}
            className="w-full"
            size="lg"
          >
            {isSubjectQuiz ? "Ir al panel principal" : "Volver al panel"}
            {!isSubjectQuiz && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </motion.div>
    </main>
  )
}
