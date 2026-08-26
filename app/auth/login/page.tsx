"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Swords, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // A user who's already authenticated (e.g. lands here from a stale
  // bookmark, browser back, or a confusing link elsewhere) should never
  // see the login form again — send them straight to the dashboard.
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) {
        router.replace("/dashboard")
      }
    })

    return () => {
      cancelled = true
    }
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Bienvenido de vuelta, aventurero!")
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 rpg-grid-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 glow-primary">
            <Swords className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Iniciar Sesión</h1>
          <p className="text-sm text-muted-foreground mt-1">Continua tu aventura</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-foreground">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="aventurero@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-foreground">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Tu contraseña secreta"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-input border-border text-foreground"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Entrar al reino"
            )}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground mt-6">
          No tienes cuenta?{" "}
          <Link href="/auth/sign-up" className="text-primary hover:underline">
            Registrate aqui
          </Link>
        </p>
        <p className="text-xs text-center text-muted-foreground mt-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            Volver al inicio
          </Link>
          <span className="mx-2">·</span>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About Us
          </Link>
        </p>
      </div>
    </main>
  )
}
