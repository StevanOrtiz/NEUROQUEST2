import { getDashboardUser } from "@/lib/auth/dashboard-user"
import { ensureUsageReport } from "@/lib/research/usage-reports"

export async function POST() {
  const { supabase, user } = await getDashboardUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak")
    .eq("id", user.id)
    .single()

  await ensureUsageReport({
    supabase,
    userId: user.id,
    reportType: "baseline",
    streakDay: profile?.current_streak ?? 0,
  })

  if ((profile?.current_streak ?? 0) >= 3) {
    await ensureUsageReport({
      supabase,
      userId: user.id,
      reportType: "day3",
      streakDay: profile?.current_streak ?? 3,
    })
  }

  return Response.json({ ok: true })
}
