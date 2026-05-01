"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getLevelProgress } from "@/lib/types"
import { Swords, Home, Package, User, LogOut, Trophy, Info } from "lucide-react"
import { toast } from "sonner"

interface DashboardNavProps {
  email: string
  displayName: string
  level: number
  xp: number
}

export function DashboardNav({ displayName, level, xp }: DashboardNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { progress } = getLevelProgress(xp)
  const links = [
    { href: "/dashboard",           label: "Inicio",    icon: Home,    tutorialId: undefined           },
    { href: "/dashboard/inventory", label: "Inventario",icon: Package, tutorialId: "nav-inventory"    },
    { href: "/dashboard/records",   label: "RECORDS",   icon: Trophy,  tutorialId: "nav-records"      },
    { href: "/dashboard/profile",   label: "Perfil",    icon: User,    tutorialId: "nav-profile"      },
    { href: "/about",               label: "About Us",  icon: Info,    tutorialId: undefined           },
  ]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Hasta la proxima, aventurero!")
    router.push("/")
    router.refresh()
  }

  return (
    <header className="border-b border-border/50 bg-rpg-surface">
      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Swords className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground hidden sm:block">QuestMind</span>
          </Link>

          <nav className="flex items-center gap-1 ml-4">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  onMouseEnter={() => router.prefetch(link.href)}
                  onFocus={() => router.prefetch(link.href)}
                  {...(link.tutorialId
                    ? { "data-tutorial": link.tutorialId }
                    : {})}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <span className="text-xs font-medium text-foreground">{displayName}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-rpg-gold">Nv. {level}</span>
              <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-rpg-xp transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label="Cerrar sesion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
