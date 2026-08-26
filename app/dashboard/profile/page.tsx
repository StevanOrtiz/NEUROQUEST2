import { ProfileContent } from "@/components/profile/profile-content"
import { getDashboardUser } from "@/lib/auth/dashboard-user"
import type { GameSession } from "@/lib/types"

export default async function ProfilePage() {
  const { supabase, user } = await getDashboardUser()

  const [{ data: profile }, { data: sessions }, { data: achievements }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("game_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_achievements")
      .select("code,title,description,icon,rarity,earned_at")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false }),
  ])

  return (
    <ProfileContent
      profile={profile}
      sessions={(sessions ?? []) as GameSession[]}
      achievements={achievements ?? []}
      email={user.email ?? ""}
    />
  )
}
