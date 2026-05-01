"use client"

import { useState, useEffect } from "react"
import {
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  Maximize2,
  Settings,
  Timer,
  Coffee,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  usePomodoroTimer,
  type PomodoroMode,
} from "@/hooks/use-pomodoro-timer"
import { cn } from "@/lib/utils"
import { dispatchAchievementUnlock } from "@/lib/achievements/client-events"

const MODE_CONFIG: Record<
  PomodoroMode,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pomodoro: {
    label: "Pomodoro",
    icon: <Timer className="size-4" />,
    color: "text-primary",
  },
  shortBreak: {
    label: "Descanso corto",
    icon: <Coffee className="size-4" />,
    color: "text-rpg-xp",
  },
  longBreak: {
    label: "Descanso largo",
    icon: <Coffee className="size-4" />,
    color: "text-rpg-mana",
  },
}

export function PomodoroTimer() {
  const [isMinimized, setIsMinimized] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [tempSettings, setTempSettings] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
  })

  const {
    mode,
    isRunning,
    settings,
    isInitialized,
    start,
    pause,
    reset,
    setMode,
    updateSettings,
    formattedTime,
    progress,
    completedPomodoros,
  } = usePomodoroTimer()

  // Sync temp settings when settings change
  useEffect(() => {
    setTempSettings(settings)
  }, [settings])

  const handleSaveSettings = () => {
    updateSettings(tempSettings)
    setShowSettings(false)
  }

  const handleStart = async () => {
    start()
    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "first_pomodoro" }),
      })
      const data = await res.json()
      if (data.achievement) {
        dispatchAchievementUnlock(data.achievement)
      } else {
        window.dispatchEvent(
          new CustomEvent("questmind:mascot-message", {
            detail: { message: "Modo enfoque activado. Yo vigilo el reloj." },
          })
        )
      }
    } catch {
      window.dispatchEvent(
        new CustomEvent("questmind:mascot-message", {
          detail: { message: "Modo enfoque activado. Buen viaje." },
        })
      )
    }
  }

  const currentConfig = MODE_CONFIG[mode]

  // Don't render anything until initialized to avoid hydration mismatch
  if (!isInitialized) {
    return null
  }

  // Minimized widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className={cn(
            "group flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-lg transition-all hover:shadow-xl",
            isRunning && "glow-primary"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2",
              currentConfig.color
            )}
          >
            {currentConfig.icon}
            <span className="font-mono text-sm font-semibold tabular-nums">
              {formattedTime}
            </span>
          </div>
          <Maximize2 className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>
    )
  }

  // Settings panel
  if (showSettings) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-72 border-border bg-card shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Configuracion</CardTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowSettings(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pomodoro-duration" className="text-sm">
                Pomodoro (minutos)
              </Label>
              <Input
                id="pomodoro-duration"
                type="number"
                min={1}
                max={60}
                value={tempSettings.pomodoro}
                onChange={(e) =>
                  setTempSettings((prev) => ({
                    ...prev,
                    pomodoro: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="short-break-duration" className="text-sm">
                Descanso corto (minutos)
              </Label>
              <Input
                id="short-break-duration"
                type="number"
                min={1}
                max={30}
                value={tempSettings.shortBreak}
                onChange={(e) =>
                  setTempSettings((prev) => ({
                    ...prev,
                    shortBreak: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="long-break-duration" className="text-sm">
                Descanso largo (minutos)
              </Label>
              <Input
                id="long-break-duration"
                type="number"
                min={1}
                max={60}
                value={tempSettings.longBreak}
                onChange={(e) =>
                  setTempSettings((prev) => ({
                    ...prev,
                    longBreak: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
              />
            </div>
            <Button onClick={handleSaveSettings} className="w-full">
              Guardar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Expanded view
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-72 border-border bg-card shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="size-4 text-primary" />
              Pomodoro
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowSettings(true)}
                title="Configuracion"
              >
                <Settings className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsMinimized(true)}
                title="Minimizar"
              >
                <Minimize2 className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Mode selector */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(Object.keys(MODE_CONFIG) as PomodoroMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>

          {/* Timer display */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative size-36">
              {/* Progress ring */}
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 283} 283`}
                  className={cn(
                    "transition-all duration-1000",
                    mode === "pomodoro"
                      ? "text-primary"
                      : mode === "shortBreak"
                        ? "text-rpg-xp"
                        : "text-rpg-mana"
                  )}
                />
              </svg>
              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-bold tabular-nums tracking-tight">
                  {formattedTime}
                </span>
                <span className={cn("text-xs", currentConfig.color)}>
                  {currentConfig.label}
                </span>
              </div>
            </div>

            {/* Completed pomodoros indicator */}
            {completedPomodoros > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Completados:</span>
                <span className="font-semibold text-rpg-xp">
                  {completedPomodoros}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={reset}
              title="Reiniciar"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              size="lg"
              onClick={isRunning ? pause : handleStart}
              className={cn(
                "min-w-24",
                isRunning && "bg-rpg-xp text-rpg-xp-foreground hover:bg-rpg-xp/90"
              )}
            >
              {isRunning ? (
                <>
                  <Pause className="size-4" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Iniciar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
