"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Shield } from "lucide-react"

export function LandingCTA() {
  return (
    <section className="px-6 py-20">
      <motion.div
        className="max-w-xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <Shield className="w-12 h-12 text-rpg-legendary mx-auto mb-6" />
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance">
          Tu cerebro es tu mejor arma
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Diseñado especialmente para estudiantes con TDAH. Microdesafios rapidos,
          recompensas inmediatas y cero aburrimiento.
        </p>
        <Link
          href="/auth/sign-up"
          className="inline-block px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity glow-primary"
        >
          Unirme ahora!
        </Link>
      </motion.div>
    </section>
  )
}
