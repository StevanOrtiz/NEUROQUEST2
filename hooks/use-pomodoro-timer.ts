"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export type PomodoroMode = "pomodoro" | "shortBreak" | "longBreak"

export interface PomodoroSettings {
  pomodoro: number // minutes
  shortBreak: number // minutes
  longBreak: number // minutes
}

export interface PomodoroState {
  mode: PomodoroMode
  timeRemaining: number // seconds
  isRunning: boolean
  completedPomodoros: number
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
}

const STORAGE_KEY_SETTINGS = "pomodoro-settings"
const STORAGE_KEY_STATE = "pomodoro-state"

function loadSettings(): PomodoroSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SETTINGS)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: PomodoroSettings) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings))
}

function loadState(settings: PomodoroSettings): PomodoroState {
  if (typeof window === "undefined") {
    return {
      mode: "pomodoro",
      timeRemaining: settings.pomodoro * 60,
      isRunning: false,
      completedPomodoros: 0,
    }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY_STATE)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        mode: parsed.mode || "pomodoro",
        timeRemaining: parsed.timeRemaining ?? settings.pomodoro * 60,
        isRunning: false, // Always start paused on reload
        completedPomodoros: parsed.completedPomodoros || 0,
      }
    }
  } catch {
    // Ignore parse errors
  }
  return {
    mode: "pomodoro",
    timeRemaining: settings.pomodoro * 60,
    isRunning: false,
    completedPomodoros: 0,
  }
}

function saveState(state: PomodoroState) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state))
}

export function usePomodoroTimer() {
  const [settings, setSettingsState] = useState<PomodoroSettings>(DEFAULT_SETTINGS)
  const [state, setState] = useState<PomodoroState>({
    mode: "pomodoro",
    timeRemaining: DEFAULT_SETTINGS.pomodoro * 60,
    isRunning: false,
    completedPomodoros: 0,
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedAtRef = useRef(0)
  const latestStateRef = useRef(state)
  latestStateRef.current = state

  // Initialize from localStorage
  useEffect(() => {
    const loadedSettings = loadSettings()
    setSettingsState(loadedSettings)
    setState(loadState(loadedSettings))
    setIsInitialized(true)
  }, [])

  // Save state to localStorage when it changes. While the timer is actively
  // ticking (once/second), this throttles the actual disk write to at most
  // once every 5s instead of every tick — the on-screen countdown still
  // updates every second via React state regardless, only the persistence
  // frequency changes. Any non-tick change (start/pause/reset/mode/complete)
  // still saves immediately since `isRunning` is false in all those cases.
  useEffect(() => {
    if (!isInitialized) return

    function flush() {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      saveState(latestStateRef.current)
      lastSavedAtRef.current = Date.now()
    }

    if (!state.isRunning) {
      flush()
      return
    }

    if (saveTimeoutRef.current) return

    const delay = Math.max(5000 - (Date.now() - lastSavedAtRef.current), 0)
    saveTimeoutRef.current = setTimeout(flush, delay)
  }, [state, isInitialized])

  // Flush pending writes when the tab is hidden or the component unmounts,
  // so a backgrounded/closed tab never loses more than a few seconds of
  // progress.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden && saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
        saveState(latestStateRef.current)
        lastSavedAtRef.current = Date.now()
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveState(latestStateRef.current)
      }
    }
  }, [])

  // Timer interval
  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.timeRemaining <= 1) {
            // Timer completed
            const newCompletedPomodoros =
              prev.mode === "pomodoro"
                ? prev.completedPomodoros + 1
                : prev.completedPomodoros

            // Play notification sound
            if (typeof window !== "undefined") {
              try {
                const audio = new Audio("/notification.mp3")
                audio.volume = 0.5
                audio.play().catch(() => {
                  // Fallback: use Web Audio API beep
                  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
                  const oscillator = audioContext.createOscillator()
                  const gainNode = audioContext.createGain()
                  oscillator.connect(gainNode)
                  gainNode.connect(audioContext.destination)
                  oscillator.frequency.value = 800
                  oscillator.type = "sine"
                  gainNode.gain.value = 0.3
                  oscillator.start()
                  setTimeout(() => oscillator.stop(), 200)
                })
              } catch {
                // Ignore audio errors
              }
            }

            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false,
              completedPomodoros: newCompletedPomodoros,
            }
          }
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
          }
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.isRunning])

  const start = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true }))
  }, [])

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }))
  }, [])

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      timeRemaining: settings[prev.mode] * 60,
      isRunning: false,
    }))
  }, [settings])

  const setMode = useCallback(
    (mode: PomodoroMode) => {
      setState((prev) => ({
        ...prev,
        mode,
        timeRemaining: settings[mode] * 60,
        isRunning: false,
      }))
    },
    [settings]
  )

  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings }
      saveSettings(updated)
      return updated
    })
    setState((prev) => {
      const updatedSettings = { ...settings, ...newSettings }
      // If not running, update time remaining to match new duration
      if (!prev.isRunning) {
        return {
          ...prev,
          timeRemaining: updatedSettings[prev.mode] * 60,
        }
      }
      return prev
    })
  }, [settings])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  return {
    // State
    mode: state.mode,
    timeRemaining: state.timeRemaining,
    isRunning: state.isRunning,
    completedPomodoros: state.completedPomodoros,
    settings,
    isInitialized,
    // Actions
    start,
    pause,
    reset,
    setMode,
    updateSettings,
    // Helpers
    formatTime,
    formattedTime: formatTime(state.timeRemaining),
    progress: 1 - state.timeRemaining / (settings[state.mode] * 60),
  }
}
