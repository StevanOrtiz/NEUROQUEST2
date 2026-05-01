"use client"

import { useEffect } from "react"

export function UsageReportBootstrap() {
  useEffect(() => {
    const key = "questmind:usage-report:last-sync"
    const lastSync = Number(window.sessionStorage.getItem(key) ?? "0")
    const now = Date.now()

    if (now - lastSync < 10 * 60 * 1000) {
      return
    }

    window.sessionStorage.setItem(key, String(now))
    window.setTimeout(() => {
      void fetch("/api/research/usage-report", {
        method: "POST",
        keepalive: true,
      }).catch(() => {
        window.sessionStorage.removeItem(key)
      })
    }, 1200)
  }, [])

  return null
}
