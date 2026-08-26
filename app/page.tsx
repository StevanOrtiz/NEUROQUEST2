import Link from "next/link"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingCTA } from "@/components/landing/landing-cta"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm font-mono">Q</span>
          </div>
          <span className="font-bold text-lg text-foreground">QuestMind</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About Us
          </Link>
          {user ? (
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
      </header>

      <LandingHero />
      <LandingFeatures />
      <LandingCTA />

      <footer className="px-6 py-8 border-t border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          QuestMind - Aprende jugando. Hecho para estudiantes con TDAH.
        </p>
      </footer>
    </main>
  )
}
