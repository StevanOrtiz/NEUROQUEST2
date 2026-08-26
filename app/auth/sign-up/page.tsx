"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Swords, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || "Aventurero",
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      // Supabase todavia exige confirmar el correo a nivel de proyecto.
      // Desactiva "Confirm email" en Supabase > Authentication > Providers > Email
      // para que signUp() entregue sesion inmediatamente.
      toast.error(
        "Tu cuenta se creo, pero Supabase aun requiere confirmar el correo. Desactiva 'Confirm email' en el dashboard de Supabase para iniciar sesion automaticamente."
      )
      setLoading(false)
      return
    }

    toast.success("Cuenta creada, bienvenido!")
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
          <h1 className="text-2xl font-bold text-foreground">Crear Cuenta</h1>
          <p className="text-sm text-muted-foreground mt-1">Unete a la aventura</p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName" className="text-foreground">Nombre de aventurero</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Sir Lancelot"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-foreground">Correo electronico</Label>
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
            <Label htmlFor="password" className="text-foreground">Contrasena</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-input border-border text-foreground"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground mt-6">
          Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Inicia sesion
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
