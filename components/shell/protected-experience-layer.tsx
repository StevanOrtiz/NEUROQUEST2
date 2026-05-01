"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { AchievementUnlockOverlay } from "@/components/achievements/achievement-unlock-overlay"

const PixelCatMascot = dynamic(
  () => import("@/components/mascot/pixel-cat-mascot").then((mod) => mod.PixelCatMascot),
  { ssr: false }
)

const PomodoroTimer = dynamic(
  () => import("@/components/pomodoro/pomodoro-timer").then((mod) => mod.PomodoroTimer),
  { ssr: false }
)

export function ProtectedExperienceLayer() {
  const pathname = usePathname()
  const enabled = pathname.startsWith("/dashboard") || pathname.startsWith("/game")

  if (!enabled) return null

  return (
    <>
      <AchievementUnlockOverlay />
      <PixelCatMascot />
      <PomodoroTimer />
    </>
  )
}
