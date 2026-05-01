import { getDashboardUser } from "@/lib/auth/dashboard-user"
import { grantAchievement } from "@/lib/achievements/grant"
import type { AchievementCode } from "@/lib/achievements/config"

const CLIENT_GRANTABLE = new Set<AchievementCode>(["first_pomodoro"])

export async function GET() {
  const { supabase, user } = await getDashboardUser()

  const { data, error } = await supabase
    .from("user_achievements")
    .select("code,title,description,icon,rarity,earned_at")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false })

  if (error) {
    console.error("[achievements] fetch error:", error.message)
    return Response.json({ achievements: [] })
  }

  return Response.json({ achievements: data ?? [] })
}

export async function POST(req: Request) {
  const { supabase, user } = await getDashboardUser()
  const body = await req.json().catch(() => null)
  const code = body?.code as AchievementCode | undefined

  if (!code || !CLIENT_GRANTABLE.has(code)) {
    return Response.json({ error: "Logro no permitido desde cliente" }, { status: 403 })
  }

  const achievement = await grantAchievement(supabase, user.id, code, {
    source: "client",
  })

  return Response.json({ achievement })
}
