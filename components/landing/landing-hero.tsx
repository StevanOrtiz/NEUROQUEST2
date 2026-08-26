"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Swords, Heart, Star, Zap } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-24 overflow-hidden rpg-grid-bg">
      {/* Floating RPG elements */}
      <motion.div
        className="absolute top-20 left-[15%] text-rpg-health opacity-60"
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart className="w-6 h-6 fill-current" />
      </motion.div>
      <motion.div
        className="absolute top-32 right-[20%] text-rpg-gold opacity-60"
        animate={{ y: [0, -15, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <Star className="w-5 h-5 fill-current" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 left-[25%] text-rpg-mana opacity-50"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <Zap className="w-5 h-5 fill-current" />
      </motion.div>

      <motion.div
        className="relative z-10 max-w-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <Swords className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight text-balance mb-4">
          TUS APUNTES,{" "}
          <span className="text-primary">AHORA SON TU AVENTURA!</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
          Sube tus apuntes. Enfrenta preguntas. Gana experiencia. Conquista el conocimiento.
          Diseñado para mentes que necesitan acción para aprender, La IA se encargara!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/sign-up"
            className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity glow-primary"
          >
            Comenzar mi travesía :D
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>

        {/* XP bar decoration */}
        <motion.div
          className="mt-12 mx-auto max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-rpg-xp">XP</span>
            <span className="text-xs font-mono text-muted-foreground">Nivel 1</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-rpg-xp"
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
