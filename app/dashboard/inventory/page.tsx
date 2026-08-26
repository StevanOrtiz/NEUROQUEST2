import { InventoryClient } from "@/components/inventory/inventory-client"
import { getDashboardUser } from "@/lib/auth/dashboard-user"
import type { InventoryItem } from "@/lib/types"

export default async function InventoryPage() {
  const { supabase, user } = await getDashboardUser()

  const [{ data: inventory }, { data: chests }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("chests")
      .select("id, is_opened, created_at, game_session_id, rarity, perk_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  return (
    <InventoryClient
      items={(inventory ?? []) as InventoryItem[]}
      chests={(chests ?? []).map((c) => ({ ...c, is_opened: c.is_opened ?? false, created_at: c.created_at ?? "" }))}
    />
  )
}
