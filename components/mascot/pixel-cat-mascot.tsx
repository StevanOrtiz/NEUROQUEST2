"use client"

import { useEffect, useRef, useState, type PointerEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"

type Mood = "walk" | "sleep" | "jump" | "pet" | "eat" | "happy"

interface MascotEventDetail {
  message?: string
}

const DEFAULT_MESSAGES = [
  "Buen ritmo. Respira y sigue.",
  "Tu progreso cuenta, aunque sea pequeno.",
  "Agua, hombros abajo y seguimos.",
  "Un descanso corto tambien es estrategia.",
]

export function PixelCatMascot() {
  const [position, setPosition] = useState({ x: 24, y: 160 })
  const [mood, setMood] = useState<Mood>("walk")
  const [catName, setCatName] = useState("Michi")
  const [message, setMessage] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const [isPointerHeld, setIsPointerHeld] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const messageTimer = useRef<number | null>(null)
  const moodTimer = useRef<number | null>(null)
  const interactionTimer = useRef<number | null>(null)
  const pointerStart = useRef({ x: 0, y: 0, catX: 0, catY: 0 })
  const lastPointer = useRef({ x: 0, y: 0, time: 0 })
  const menuOpenRef = useRef(false)
  const interactingRef = useRef(false)
  const pointerHeldRef = useRef(false)
  const draggingRef = useRef(false)
  const didDrag = useRef(false)
  const shakeScore = useRef(0)
  const complainedAboutShake = useRef(false)
  const purrAudioContext = useRef<AudioContext | null>(null)

  useEffect(() => {
    const savedName = window.localStorage.getItem("questmind:cat-name")
    if (savedName) setCatName(savedName)

    return () => {
      void purrAudioContext.current?.close()
      purrAudioContext.current = null
    }
  }, [])

  // Rendered only on already-auth-protected routes (/dashboard, /game — see
  // components/shell/protected-experience-layer.tsx), so there's no need to
  // independently verify the session here. Skipping that removes a redundant
  // Supabase client + network round trip + a persistent auth listener that
  // would otherwise stay subscribed for the entire dashboard/game session.
  useEffect(() => {
    let paused = false

    function showMessage(text: string) {
      setMessage(text)
      if (messageTimer.current) window.clearTimeout(messageTimer.current)
      messageTimer.current = window.setTimeout(() => setMessage(null), 5200)
    }

    function onMascotMessage(event: Event) {
      const detail = (event as CustomEvent<MascotEventDetail>).detail
      if (detail?.message) showMessage(detail.message)
      setMood("jump")
      queueMoodReset(1100)
    }

    function closeMenu() {
      menuOpenRef.current = false
      setMenu(null)
    }

    function onVisibilityChange() {
      paused = document.hidden
    }

    window.addEventListener("questmind:mascot-message", onMascotMessage)
    window.addEventListener("questmind:achievement", onMascotMessage)
    window.addEventListener("click", closeMenu)
    window.addEventListener("scroll", closeMenu, true)
    document.addEventListener("visibilitychange", onVisibilityChange)

    // Paused while the tab is hidden (Page Visibility API) — same visible
    // behavior while the tab is active, just skips waking up the CPU for a
    // background tab nobody is looking at.
    const moveInterval = window.setInterval(() => {
      if (
        paused ||
        menuOpenRef.current ||
        interactingRef.current ||
        pointerHeldRef.current ||
        draggingRef.current
      ) {
        return
      }
      const width = Math.max(window.innerWidth - 116, 120)
      const height = Math.max(window.innerHeight - 140, 160)
      const nextMood: Mood = Math.random() > 0.82 ? "sleep" : Math.random() > 0.72 ? "jump" : "walk"

      setMood(nextMood)
      if (nextMood !== "sleep") {
        setPosition({
          x: Math.round(24 + Math.random() * (width - 24)),
          y: Math.round(84 + Math.random() * (height - 84)),
        })
      }
    }, 6200)

    const reminderInterval = window.setInterval(() => {
      if (paused) return
      showMessage(DEFAULT_MESSAGES[Math.floor(Math.random() * DEFAULT_MESSAGES.length)])
    }, 11 * 60 * 1000)

    return () => {
      window.removeEventListener("questmind:mascot-message", onMascotMessage)
      window.removeEventListener("questmind:achievement", onMascotMessage)
      window.removeEventListener("click", closeMenu)
      window.removeEventListener("scroll", closeMenu, true)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.clearInterval(moveInterval)
      window.clearInterval(reminderInterval)
      if (messageTimer.current) window.clearTimeout(messageTimer.current)
      if (moodTimer.current) window.clearTimeout(moodTimer.current)
      if (interactionTimer.current) window.clearTimeout(interactionTimer.current)
    }
  }, [])

  function queueMoodReset(delay = 1400) {
    if (moodTimer.current) window.clearTimeout(moodTimer.current)
    moodTimer.current = window.setTimeout(() => {
      setMood("walk")
    }, delay)
  }

  function showInteractionMessage(text: string, nextMood: Mood, animationMs = 4500) {
    const resetAfterMs = animationMs + 1000
    menuOpenRef.current = false
    interactingRef.current = true
    setMenu(null)
    setMessage(text)
    setMood(nextMood)
    setIsInteracting(true)
    if (messageTimer.current) window.clearTimeout(messageTimer.current)
    if (interactionTimer.current) window.clearTimeout(interactionTimer.current)
    messageTimer.current = window.setTimeout(() => setMessage(null), resetAfterMs)
    interactionTimer.current = window.setTimeout(() => {
      interactingRef.current = false
      setIsInteracting(false)
      setMood("walk")
    }, resetAfterMs)
    queueMoodReset(resetAfterMs)
  }

  function playPurr() {
    // Reuse one AudioContext across pets instead of spinning up (and
    // tearing down) a new audio-device connection on every single tap —
    // same purr sound, far less audio-subsystem churn on repeated petting.
    let ctx = purrAudioContext.current
    if (!ctx) {
      const AudioContextClass =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      ctx = new AudioContextClass()
      purrAudioContext.current = ctx
    }
    if (ctx.state === "suspended") {
      void ctx.resume()
    }

    const gain = ctx.createGain()
    const low = ctx.createOscillator()
    const warm = ctx.createOscillator()
    const tremolo = ctx.createOscillator()
    const tremoloGain = ctx.createGain()

    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1)

    low.type = "sine"
    warm.type = "triangle"
    tremolo.type = "sine"
    low.frequency.value = 82
    warm.frequency.value = 124
    tremolo.frequency.value = 22
    tremoloGain.gain.value = 0.012

    tremolo.connect(tremoloGain)
    tremoloGain.connect(gain.gain)
    low.connect(gain)
    warm.connect(gain)
    gain.connect(ctx.destination)

    low.start()
    warm.start()
    tremolo.start()
    low.stop(ctx.currentTime + 1.15)
    warm.stop(ctx.currentTime + 1.15)
    tremolo.stop(ctx.currentTime + 1.15)
  }

  function openInteractionMenu(clientX: number, clientY: number) {
    const menuX = clientX || position.x + 54
    const menuY = clientY || position.y + 20
    setMenu({
      x: Math.min(menuX, window.innerWidth - 190),
      y: Math.min(menuY, window.innerHeight - 170),
    })
    menuOpenRef.current = true
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.stopPropagation()
    if (isInteracting) return
    pointerHeldRef.current = true
    setIsPointerHeld(true)
    menuOpenRef.current = false
    setMenu(null)
    didDrag.current = false
    shakeScore.current = 0
    complainedAboutShake.current = false
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      catX: position.x,
      catY: position.y,
    }
    lastPointer.current = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointerHeldRef.current || isInteracting) return

    const dxFromStart = event.clientX - pointerStart.current.x
    const dyFromStart = event.clientY - pointerStart.current.y
    const distance = Math.hypot(dxFromStart, dyFromStart)
    if (distance < 7 && !isDragging) return

    didDrag.current = true
    draggingRef.current = true
    setIsDragging(true)
    setMood("jump")

    const now = performance.now()
    const dt = Math.max(now - lastPointer.current.time, 16)
    const dx = event.clientX - lastPointer.current.x
    const dy = event.clientY - lastPointer.current.y
    const speed = Math.hypot(dx, dy) / dt

    if (speed > 1.35) {
      shakeScore.current += Math.hypot(dx, dy) * speed
    }

    if (shakeScore.current > 760 && !complainedAboutShake.current) {
      complainedAboutShake.current = true
      setMessage(`${catName}: ey, suavecito...`)
      if (messageTimer.current) window.clearTimeout(messageTimer.current)
      messageTimer.current = window.setTimeout(() => setMessage(null), 3000)
    }

    const nextX = Math.min(
      Math.max(pointerStart.current.catX + dxFromStart, 8),
      Math.max(window.innerWidth - 104, 8)
    )
    const nextY = Math.min(
      Math.max(pointerStart.current.catY + dyFromStart, 62),
      Math.max(window.innerHeight - 104, 62)
    )

    setPosition({ x: Math.round(nextX), y: Math.round(nextY) })
    lastPointer.current = { x: event.clientX, y: event.clientY, time: now }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    event.stopPropagation()
    pointerHeldRef.current = false
    setIsPointerHeld(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (!didDrag.current) {
      openInteractionMenu(event.clientX, event.clientY)
      return
    }

    draggingRef.current = false
    setIsDragging(false)
    setMood("walk")
  }

  function handlePet() {
    playPurr()
    showInteractionMessage(`${catName}: prrr...`, "pet", 4500)
  }

  function handleFeed() {
    showInteractionMessage(`${catName} devoro el pescado. +10 felicidad imaginaria.`, "eat", 4500)
  }

  function handleRename() {
    const nextName = window.prompt("Nombre para tu gato calico", catName)?.trim()
    if (!nextName) return
    const cleanName = nextName.slice(0, 24)
    window.localStorage.setItem("questmind:cat-name", cleanName)
    setCatName(cleanName)
    showInteractionMessage(`Ahora me llamo ${cleanName}.`, "happy", 4500)
  }

  return (
    <>
      <motion.div
        className="pixel-cat-layer"
        animate={{ x: position.x, y: position.y }}
        transition={
          isDragging
            ? { duration: 0 }
            : { type: "spring", stiffness: 35, damping: 18, mass: 0.8 }
        }
      >
        <AnimatePresence>
          {message && (
            <motion.div
              className="pixel-cat-bubble"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className={`pixel-cat pixel-cat-${mood} ${isDragging ? "pixel-cat-drag" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={(event) => event.stopPropagation()}
          title={`Toca para interactuar con ${catName}. Mantén y arrastra para moverlo.`}
          role="img"
          aria-label={`Gato calico ${catName}`}
        >
          <span className="cat-fish" />
          <span className="cat-heart cat-heart-one" />
          <span className="cat-heart cat-heart-two" />
          <span className="cat-ear cat-ear-left" />
          <span className="cat-ear cat-ear-right" />
          <span className="cat-head">
            <span className="cat-patch cat-patch-one" />
            <span className="cat-patch cat-patch-two" />
            <span className="cat-eye cat-eye-left" />
            <span className="cat-eye cat-eye-right" />
            <span className="cat-nose" />
          </span>
          <span className="cat-body">
            <span className="cat-spot cat-spot-one" />
            <span className="cat-spot cat-spot-two" />
          </span>
          <span className="cat-tail" />
          <span className="cat-leg cat-leg-left" />
          <span className="cat-leg cat-leg-right" />
        </div>
      </motion.div>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="pixel-cat-menu"
            style={{ left: menu.x, top: menu.y }}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="pixel-cat-menu-title">{catName}</p>
            <button type="button" onClick={handlePet}>Acariciar</button>
            <button type="button" onClick={handleFeed}>Darle un pescado</button>
            <button type="button" onClick={handleRename}>Ponerle nombre</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
