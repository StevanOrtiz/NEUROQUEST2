"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Award, Sparkles, Star } from "lucide-react"
import type { AchievementEventDetail } from "@/lib/achievements/client-events"

type ActiveAchievement = Required<Pick<AchievementEventDetail, "title">> &
  Omit<AchievementEventDetail, "title">

const rarityStyles: Record<string, { ring: string; text: string; glow: string; label: string }> = {
  common: {
    ring: "border-primary/45 bg-primary/15",
    text: "text-primary",
    glow: "shadow-[0_0_45px_rgba(34,197,94,0.28)]",
    label: "Comun",
  },
  rare: {
    ring: "border-rpg-mana/50 bg-rpg-mana/15",
    text: "text-rpg-mana",
    glow: "shadow-[0_0_52px_rgba(56,189,248,0.3)]",
    label: "Rara",
  },
  epic: {
    ring: "border-rpg-legendary/55 bg-rpg-legendary/15",
    text: "text-rpg-legendary",
    glow: "shadow-[0_0_56px_rgba(168,85,247,0.34)]",
    label: "Epica",
  },
  legendary: {
    ring: "border-rpg-gold/60 bg-rpg-gold/15",
    text: "text-rpg-gold",
    glow: "shadow-[0_0_64px_rgba(250,204,21,0.36)]",
    label: "Legendaria",
  },
}

const fallbackStyle = rarityStyles.common

export function AchievementUnlockOverlay() {
  const prefersReducedMotion = useReducedMotion()
  const [queue, setQueue] = useState<ActiveAchievement[]>([])
  const [active, setActive] = useState<ActiveAchievement | null>(null)
  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => i), [])

  useEffect(() => {
    function handleAchievement(event: Event) {
      const detail = (event as CustomEvent<AchievementEventDetail>).detail
      if (!detail) return

      const title =
        detail.title ??
        detail.message?.replace(/^Medalla desbloqueada:\s*/i, "").replace(/\.$/, "")

      if (!title) return

      setQueue((current) => [
        ...current,
        {
          ...detail,
          title,
          rarity: detail.rarity ?? "common",
          icon: detail.icon ?? "XP",
          description: detail.description ?? "Nuevo logro obtenido en tu aventura.",
        },
      ])
    }

    window.addEventListener("questmind:achievement", handleAchievement)
    return () => window.removeEventListener("questmind:achievement", handleAchievement)
  }, [])

  useEffect(() => {
    if (active || queue.length === 0) return

    const [next, ...rest] = queue
    setActive(next)
    setQueue(rest)
  }, [active, queue])

  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => setActive(null), prefersReducedMotion ? 3200 : 5200)
    return () => window.clearTimeout(timer)
  }, [active, prefersReducedMotion])

  const style = active ? rarityStyles[active.rarity ?? "common"] ?? fallbackStyle : fallbackStyle
  const skip = () => setActive(null)

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[90] flex cursor-pointer items-center justify-center overflow-hidden bg-background/35 px-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={skip}
          role="button"
          tabIndex={0}
          aria-label="Cerrar y ver el siguiente logro"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") skip()
          }}
          aria-live="polite"
        >
          {!prefersReducedMotion && (
            <>
              <motion.div
                className="absolute h-[42rem] w-[42rem] rounded-full border border-primary/10 bg-[radial-gradient(circle,rgba(34,197,94,0.18),transparent_62%)]"
                initial={{ scale: 0.35, opacity: 0, rotate: 0 }}
                animate={{ scale: [0.55, 1.05, 0.95], opacity: [0, 1, 0.45], rotate: 180 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 1.6, ease: "easeOut" }}
              />
              {particles.map((particle) => {
                const angle = (particle / particles.length) * Math.PI * 2
                const distance = 150 + (particle % 5) * 28
                return (
                  <motion.span
                    key={particle}
                    className={`absolute h-2 w-2 rounded-full ${particle % 3 === 0 ? "bg-rpg-gold" : particle % 3 === 1 ? "bg-primary" : "bg-rpg-mana"}`}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      opacity: [0, 1, 0],
                      scale: [0.4, 1.15, 0.2],
                    }}
                    transition={{ duration: 1.35, delay: 0.12 + particle * 0.018, ease: "easeOut" }}
                  />
                )
              })}
            </>
          )}

          <motion.section
            className={`relative w-full max-w-xl overflow-hidden rounded-2xl border ${style.ring} ${style.glow} bg-card/95 p-7 text-center`}
            initial={{ y: 42, scale: 0.82, opacity: 0, rotateX: -16 }}
            animate={{ y: 0, scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ y: -20, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 230, damping: 21 }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-rpg-mana/10 blur-3xl" />

            <motion.div
              className={`relative mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full border ${style.ring}`}
              animate={prefersReducedMotion ? undefined : { y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-2 rounded-full border border-current/20"
                animate={prefersReducedMotion ? undefined : { scale: [0.9, 1.12, 0.9], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className={`relative font-mono text-3xl font-black ${style.text}`}>
                {active.icon}
              </span>
            </motion.div>

            <motion.div
              className="relative mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-rpg-gold"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              <Sparkles className="h-4 w-4" />
              Medalla desbloqueada
              <Sparkles className="h-4 w-4" />
            </motion.div>

            <motion.h2
              className="relative text-3xl font-black text-foreground md:text-4xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              {active.title}
            </motion.h2>

            <motion.p
              className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
            >
              {active.description}
            </motion.p>

            <motion.div
              className="relative mt-5 flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.42 }}
            >
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${style.ring} ${style.text}`}>
                <Award className="h-3.5 w-3.5" />
                Rareza: {style.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-rpg-gold/30 bg-rpg-gold/10 px-3 py-1 text-xs font-semibold text-rpg-gold">
                <Star className="h-3.5 w-3.5" />
                +Medalla
              </span>
            </motion.div>

            <motion.p
              className="relative mt-5 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              {queue.length > 0
                ? `Toca en cualquier lugar para continuar · ${queue.length} logro${queue.length === 1 ? "" : "s"} mas en cola`
                : "Toca en cualquier lugar para continuar"}
            </motion.p>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
