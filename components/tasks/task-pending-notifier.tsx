"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function TaskPendingNotifier() {
  useEffect(() => {
    let cancelled = false
    const cacheKey = "questmind:task-summary:last-check"
    const lastCheck = Number(window.sessionStorage.getItem(cacheKey) ?? "0")
    const now = Date.now()

    if (now - lastCheck < 5 * 60 * 1000) {
      return
    }

    window.sessionStorage.setItem(cacheKey, String(now))

    async function loadSummary() {
      const res = await fetch("/api/tasks/summary")
      if (!res.ok) return
      const data = await res.json()
      if (cancelled || !data.pending) return

      const message = data.overdue > 0
        ? "Tienes misiones vencidas en tu cofre"
        : "Tienes tareas pendientes en tu cofre"

      toast.info(message)
      window.dispatchEvent(new CustomEvent("questmind:mascot-message", {
        detail: { message },
      }))
    }

    void loadSummary()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}
