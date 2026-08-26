"use client"

import { motion } from "framer-motion"
import { FileUp, Brain, Swords, Package } from "lucide-react"

const features = [
  {
    icon: FileUp,
    title: "Sube tu PDF",
    description: "Carga tus apuntes o cualquier documento. La IA extrae el contenido clave automaticamente.",
    color: "text-rpg-mana",
  },
  {
    icon: Brain,
    title: "La IA genera preguntas",
    description: "La IA analiza tu material y crea preguntas de opcion multiple adaptadas al contenido.",
    color: "text-primary",
  },
  {
    icon: Swords,
    title: "Batalla RPG",
    description: "Responde correctamente para derrotar enemigos. Tienes 3 vidas y cada error cuenta.",
    color: "text-rpg-health",
  },
  {
    icon: Package,
    title: "Cofres y Recompensas",
    description: "Gana XP, sube de nivel y abre cofres con power-ups para tus proximas batallas.",
    color: "text-rpg-gold",
  },
]

export function LandingFeatures() {
  return (
    <section className="px-6 py-20 bg-rpg-surface">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12 text-balance">
          Como funciona QuestMind
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="p-6 rounded-xl bg-card border border-border/50 hover:border-border transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <feature.icon className={`w-8 h-8 ${feature.color} mb-4`} />
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
