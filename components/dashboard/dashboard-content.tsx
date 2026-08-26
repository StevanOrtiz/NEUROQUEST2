"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { Profile, GameSession, getLevelProgress, DIFFICULTY_CONFIG } from "@/lib/types"
import { AdhdScreeningCard } from "@/components/dashboard/adhd-screening-card"
import { PdfUploadCard } from "@/components/dashboard/pdf-upload-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SubjectsSidebar } from "@/components/dashboard/subjects-sidebar"
import { StreakStatsCard } from "@/components/streak/streak-stats-cards"
import { TaskPendingNotifier } from "@/components/tasks/task-pending-notifier"
import { ChevronDown, Heart, Star, Trophy, Swords, Clock } from "lucide-react"
import type { Subject } from "@/lib/subjects/config"

// Both self-gate to rendering nothing most of the time (SusForm until
// unlocked, TutorialOverlay once the tutorial is done) — split into their
// own chunks to shrink the dashboard's main JS payload. SSR stays on
// (no `ssr: false`) so first paint is unchanged, just a smaller bundle
// to parse.
const SusForm = dynamic(() => import("@/components/sus/sus-form").then((mod) => mod.SusForm))
const TutorialOverlay = dynamic(() => import("@/components/tutorial/tutorial-overlay").then((mod) => mod.TutorialOverlay))

interface SubjectProgress {
  subject_id: string
  diagnostic_passed: boolean
  subject_completed: boolean
  completed_modules: string[]
  completed_sections: string[]
}

interface DashboardContentProps {
  profile: Profile | null
  recentSessions: GameSession[]
  subjects: Subject[]
  subjectProgressMap: Record<string, SubjectProgress>
  /** Whether to show the tutorial (computed server-side) */
  showTutorial: boolean
  /** Authenticated user ID for persisting tutorial state */
  userId: string
}

export function DashboardContent({
  profile,
  recentSessions,
  subjects,
  subjectProgressMap,
  showTutorial,
  userId,
}: DashboardContentProps) {
  const [, setRefreshKey] = useState(0)
  const p = profile ?? {
    level: 1,
    xp: 0,
    total_games: 0,
    total_correct: 0,
    display_name: "Aventurero",
  }
  const { progress, nextLevelXp } = getLevelProgress(p.xp)

  const totalQuestionsEver = recentSessions.reduce(
    (sum, s) => sum + s.total_questions,
    0
  )
  const accuracy =
    totalQuestionsEver > 0
      ? Math.round((p.total_correct / totalQuestionsEver) * 100)
      : p.total_games > 0
      ? Math.round((p.total_correct / (p.total_games * 10)) * 100)
      : 0

  return (
    <>
      {/* ── Tutorial Overlay — renders as a portal into document.body ── */}
      <TutorialOverlay show={showTutorial} userId={userId} />
      <TaskPendingNotifier />

      <div className="w-full max-w-[1540px] mx-auto px-6 py-6">
        <div className="grid min-h-[calc(100vh-96px)] items-start gap-6 xl:grid-cols-[320px_minmax(560px,1fr)_320px] 2xl:grid-cols-[340px_minmax(640px,1fr)_340px]">
          <aside className="order-2 xl:order-1">
            <div className="space-y-4 xl:sticky xl:top-24">
              <div data-tutorial="streak">
                <StreakStatsCard />
              </div>
              <AdhdScreeningCard />
            </div>
          </aside>
          {/* ── Main content ── */}
          <div className="order-1 xl:order-2 min-w-0">

            {/* Welcome section — Step 1 target */}
            <motion.div
              className="mb-6 rounded-xl border border-border/40 bg-card/70 p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              data-tutorial="welcome"
            >
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Bienvenido, {p.display_name}
              </h1>

              {/* XP bar — Step 2 target */}
              <div data-tutorial="xp-bar">
                <p className="text-muted-foreground">
                  Nivel {p.level} &middot; {p.xp} / {nextLevelXp} XP
                </p>
                <div className="mt-3 h-2.5 rounded-full bg-secondary overflow-hidden w-full">
                  <motion.div
                    className="h-full rounded-full bg-rpg-xp"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Stats row — Step 3 target */}
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
              data-tutorial="stats"
            >
              <StatsCard icon={Star}   label="Nivel"     value={p.level}          color="text-rpg-gold"   />
              <StatsCard icon={Trophy} label="Partidas"  value={p.total_games}    color="text-primary"    />
              <StatsCard icon={Heart}  label="Aciertos"  value={p.total_correct}  color="text-rpg-health" />
              <StatsCard icon={Swords} label="Precision" value={`${accuracy}%`}   color="text-rpg-mana"   />
            </div>

            {/* New game card — Step 5 target */}
            <div data-tutorial="new-game">
              <PdfUploadCard onGameCreated={() => setRefreshKey((k) => k + 1)} />
            </div>

            <SusForm
              currentStreak={profile?.current_streak ?? 0}
              level={profile?.level ?? 1}
            />

            {/* Recent sessions */}
            {recentSessions.length > 0 && (
              <motion.details
                className="group mt-6 rounded-xl border border-border/50 bg-card/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Partidas recientes</h2>
                    <p className="text-xs text-muted-foreground">Historial de tus ultimas aventuras</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-2 border-t border-border/40 p-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            session.status === "victory"
                              ? "bg-primary"
                              : session.status === "defeat"
                              ? "bg-destructive"
                              : "bg-rpg-gold"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {session.pdf_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span
                              className={DIFFICULTY_CONFIG[session.difficulty].color}
                            >
                              {DIFFICULTY_CONFIG[session.difficulty].label}
                            </span>
                            <span>&middot;</span>
                            <span>
                              {session.correct_answers}/{session.total_questions}{" "}
                              correctas
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(session.created_at).toLocaleDateString("es")}
                        </span>
                        {session.xp_earned > 0 && (
                          <span className="text-rpg-gold font-mono">
                            +{session.xp_earned} XP
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.details>
            )}
          </div>

          {/* ── Subjects sidebar — Step 6 target ── */}
          <motion.div
            className="order-3 min-w-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            data-tutorial="subjects-sidebar"
          >
            <div className="xl:sticky xl:top-24 xl:h-[calc(100vh-120px)]">
              <SubjectsSidebar
                subjects={subjects}
                progressMap={subjectProgressMap}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
