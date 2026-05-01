"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export function AboutHeaderActions() {
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setHasSession(Boolean(data.session))
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <nav className="flex items-center gap-4">
      <Link href="/about" className="text-sm text-foreground font-medium">
        About Us
      </Link>
      {hasSession ? (
        <Link
          href="/dashboard"
          className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Ir al dashboard
        </Link>
      ) : (
        <>
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Iniciar Sesion
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Registrarse
          </Link>
        </>
      )}
    </nav>
  )
}
