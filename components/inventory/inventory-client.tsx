"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Divide, SkipForward, Zap, Lightbulb, Package, Lock, Loader2, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { InventoryItem, ChestReward } from "@/lib/types"

// Only needed the moment a chest is actually opened — split into its own
// chunk so it's not parsed as part of the inventory page's main bundle.
const ChestRoulette = dynamic(
  () => import("@/components/inventory/chest-roulette").then((mod) => mod.ChestRoulette),
  { ssr: false }
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface Chest {
  id: string
  is_opened: boolean
  created_at: string
  game_session_id: string | null
  rarity: string
  perk_type: string | null
}

interface InventoryClientProps {
  items: InventoryItem[]
  chests: Chest[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_ICONS: Record<string, React.ElementType> = {
  extra_life: Heart,
  fifty_fifty: Divide,
  skip_question: SkipForward,
  double_xp: Zap,
  hint: Lightbulb,
}

const ITEM_COLORS: Record<string, string> = {
  extra_life:   "text-red-400 border-red-400/30 bg-red-400/5",
  fifty_fifty:  "text-blue-400 border-blue-400/30 bg-blue-400/5",
  skip_question:"text-green-400 border-green-400/30 bg-green-400/5",
  double_xp:    "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  hint:         "text-purple-400 border-purple-400/30 bg-purple-400/5",
}

// ─── Items grid ───────────────────────────────────────────────────────────────

function ItemsGrid({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return (
      <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">No tienes ítems aún</p>
        <p className="text-sm text-muted-foreground mt-1">
          Abre cofres para obtener power-ups
        </p>
      </motion.div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, i) => {
        const Icon = ITEM_ICONS[item.item_type] ?? Package
        const colorClass = ITEM_COLORS[item.item_type] ?? "text-muted-foreground border-border"
        return (
          <motion.div
            key={item.id}
            className={`p-4 rounded-xl border ${colorClass}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start justify-between">
              <Icon className="w-6 h-6" />
              <span className="text-lg font-bold font-mono">{item.quantity}x</span>
            </div>
            <h3 className="font-semibold text-foreground mt-3">{item.item_name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{item.item_description}</p>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Chest card ───────────────────────────────────────────────────────────────

interface ChestCardProps {
  chest: Chest
  index: number
  onOpen: (chestId: string) => void
  onDelete: (chestId: string) => void
  opening: boolean
  deleting: boolean
}

function ChestCard({ chest, index, onOpen, onDelete, opening, deleting }: ChestCardProps) {
  const date = new Date(chest.created_at).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
  })

  return (
    <motion.div
      className={`relative p-4 rounded-xl border flex flex-col items-center gap-3 ${
        chest.is_opened
          ? "border-border/40 bg-card/40 opacity-50"
          : "border-yellow-500/40 bg-yellow-500/5"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.06 }}
    >
      {chest.is_opened && (
        <button
          onClick={() => onDelete(chest.id)}
          disabled={deleting}
          title="Borrar cofre abierto"
          className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
        </button>
      )}

      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          chest.is_opened ? "bg-secondary" : "bg-yellow-500/15"
        }`}
      >
        {chest.is_opened ? (
          <Package className="w-7 h-7 text-muted-foreground" />
        ) : (
          <span className="text-3xl select-none">🪙</span>
        )}
      </div>

      <div className="text-center">
        <p className="font-semibold text-sm text-foreground">
          {chest.is_opened ? "Cofre abierto" : "Cofre sellado"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
      </div>

      {!chest.is_opened && (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
          onClick={() => onOpen(chest.id)}
          disabled={opening}
        >
          {opening ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Abrir cofre
            </>
          )}
        </Button>
      )}
    </motion.div>
  )
}

// ─── Roulette modal ───────────────────────────────────────────────────────────

interface RouletteModalProps {
  rouletteItems: ChestReward[]
  finalReward: ChestReward
  onClose: () => void
}

function RouletteModal({ rouletteItems, finalReward, onClose }: RouletteModalProps) {
  const [showClose, setShowClose] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={showClose ? onClose : undefined}
      />
      <motion.div
        className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Abriendo cofre...</h2>
          {showClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <ChestRoulette
          rouletteItems={rouletteItems}
          finalReward={finalReward}
          onComplete={() => setShowClose(true)}
        />

        {showClose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <Button onClick={onClose} className="w-full">
              ¡Genial! Cerrar
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = "items" | "chests"

export function InventoryClient({ items: initialItems, chests: initialChests }: InventoryClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("items")
  const [items, setItems] = useState(initialItems)
  const [chests, setChests] = useState(initialChests)
  const [openingChestId, setOpeningChestId] = useState<string | null>(null)
  const [deletingChestId, setDeletingChestId] = useState<string | null>(null)
  const [clearingOpened, setClearingOpened] = useState(false)
  const [rouletteState, setRouletteState] = useState<{
    rouletteItems: ChestReward[]
    finalReward: ChestReward
  } | null>(null)

  const unopenedCount = chests.filter((c) => !c.is_opened).length
  const openedCount = chests.filter((c) => c.is_opened).length

  async function handleOpenChest(chestId: string) {
    setOpeningChestId(chestId)
    try {
      const res = await fetch("/api/game/chest/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chestId }),
      })
      const data = await res.json()

      if (data.reward && data.rouletteItems) {
        setChests((prev) =>
          prev.map((c) => (c.id === chestId ? { ...c, is_opened: true } : c))
        )
        setItems((prev) => {
          const existing = prev.find((i) => i.item_type === data.reward.item_type)
          if (existing) {
            return prev.map((i) =>
              i.item_type === data.reward.item_type ? { ...i, quantity: i.quantity + 1 } : i
            )
          }
          return [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              user_id: "",
              item_type: data.reward.item_type,
              item_name: data.reward.item_name,
              item_description: data.reward.item_description,
              quantity: 1,
              icon: "⚡",
              created_at: new Date().toISOString(),
            },
          ]
        })
        setRouletteState({ rouletteItems: data.rouletteItems, finalReward: data.reward })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setOpeningChestId(null)
    }
  }

  async function handleDeleteChest(chestId: string) {
    setDeletingChestId(chestId)
    try {
      const res = await fetch(`/api/game/chest/${chestId}`, { method: "DELETE" })
      if (res.ok) {
        setChests((prev) => prev.filter((c) => c.id !== chestId))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingChestId(null)
    }
  }

  async function handleClearOpenedChests() {
    setClearingOpened(true)
    try {
      const res = await fetch("/api/game/chest", { method: "DELETE" })
      if (res.ok) {
        setChests((prev) => prev.filter((c) => !c.is_opened))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setClearingOpened(false)
    }
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "items", label: "Ítems" },
    { id: "chests", label: "Cofres", badge: unopenedCount },
  ]

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
        </div>

        <div className="flex gap-1 mb-6 bg-secondary/40 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-yellow-900 text-xs font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "items" ? (
            <motion.div
              key="items"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <ItemsGrid items={items} />
            </motion.div>
          ) : (
            <motion.div
              key="chests"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {chests.length === 0 ? (
                <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span className="text-4xl block mb-4 opacity-40">🪙</span>
                  <p className="text-muted-foreground">No tienes cofres</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Completa partidas con más del 75% de aciertos para ganar cofres
                  </p>
                </motion.div>
              ) : (
                <>
                  {openedCount > 0 && (
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={handleClearOpenedChests}
                        disabled={clearingOpened}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                      >
                        {clearingOpened ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Limpiar cofres abiertos ({openedCount})
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {chests.map((chest, i) => (
                        <ChestCard
                          key={chest.id}
                          chest={chest}
                          index={i}
                          onOpen={handleOpenChest}
                          onDelete={handleDeleteChest}
                          opening={openingChestId === chest.id}
                          deleting={deletingChestId === chest.id}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {rouletteState && (
          <RouletteModal
            rouletteItems={rouletteState.rouletteItems}
            finalReward={rouletteState.finalReward}
            onClose={() => setRouletteState(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
