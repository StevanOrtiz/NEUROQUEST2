"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { GameSession, Question, InventoryItem } from "@/lib/types"
import { GameHUD } from "./game-hud"
import { QuestionCard } from "./question-card"
import { GameOverScreen } from "./game-over-screen"
import { PowerUpBar } from "./power-up-bar"
import type { SubjectContext } from "@/app/game/[sessionId]/page"
import { dispatchAchievementUnlocks } from "@/lib/achievements/client-events"

interface GameClientProps {
  session: GameSession
  questions: Question[]
  inventory: InventoryItem[]
  subjectContext?: SubjectContext | null
}

export function GameClient({ session: initialSession, questions: initialQuestions, inventory: initialInventory, subjectContext }: GameClientProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(initialSession.current_question_index)
  const [lives, setLives] = useState(initialSession.lives_remaining)
  const [xpEarned, setXpEarned] = useState(initialSession.xp_earned)
  const [correctCount, setCorrectCount] = useState(initialSession.correct_answers)
  const [gameStatus, setGameStatus] = useState(initialSession.status)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(
    new Set(initialQuestions.filter((q) => q.answered).map((q) => q.id))
  )
  const [removedOptions, setRemovedOptions] = useState<number[]>([])
  const [hintText, setHintText] = useState<string | null>(null)
  const [inventory, setInventory] = useState(initialInventory)
  const [shakeScreen, setShakeScreen] = useState(false)

  const currentQuestion = initialQuestions[currentIndex]
  const totalQuestions = initialSession.total_questions
  const isGameOver = gameStatus === "victory" || gameStatus === "defeat"

  const handleAnswer = useCallback(async (questionId: string, answer: number) => {
    if (answeredQuestions.has(questionId)) return

    const res = await fetch("/api/game/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, answer }),
    })

    const data = await res.json()

    setAnsweredQuestions((prev) => new Set([...prev, questionId]))

    if (data.isCorrect) {
      setXpEarned(data.totalXpEarned)
      setCorrectCount(data.correctAnswers)
    } else {
      setLives(data.livesRemaining)
      setShakeScreen(true)
      setTimeout(() => setShakeScreen(false), 500)
    }

    if (data.achievements?.length) {
      dispatchAchievementUnlocks(data.achievements)
    }

    if (data.gameStatus === "victory" || data.gameStatus === "defeat") {
      setGameStatus(data.gameStatus)
      if (!data.achievements?.length) {
        window.dispatchEvent(
          new CustomEvent("questmind:mascot-message", {
            detail: {
              message:
                data.gameStatus === "victory"
                  ? "Gran victoria. Ese conocimiento ya es tuyo."
                  : "Caer tambien da mapa. Volvemos mas fuertes.",
            },
          })
        )
      }
    }

    return data
  }, [answeredQuestions])

  const handleNextQuestion = useCallback(() => {
    setRemovedOptions([])
    setHintText(null)
    setCurrentIndex((i) => Math.min(i + 1, totalQuestions - 1))
  }, [totalQuestions])

  const handleUseItem = useCallback(async (itemType: string) => {
    if (!currentQuestion) return

    const res = await fetch("/api/game/use-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType,
        sessionId: initialSession.id,
        questionId: currentQuestion.id,
      }),
    })

    const data = await res.json()

    if (data.used) {
      setInventory((prev) =>
        prev
          .map((item) =>
            item.item_type === itemType
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0)
      )

      if (data.removedOptions) {
        setRemovedOptions(data.removedOptions)
      }
      if (data.newLives) {
        setLives(data.newLives)
      }
      if (data.hint) {
        setHintText(data.hint)
      }
      if (data.skipped) {
        // Mark the skipped question as answered so it can't be interacted with
        setAnsweredQuestions((prev) => new Set([...prev, currentQuestion.id]))
        if (data.gameStatus === "victory") {
          setGameStatus("victory")
        } else {
          handleNextQuestion()
        }
      }
      if (data.doubleXpActive) {
        // Visual feedback only — server handles the XP multiplication
      }
    }
  }, [currentQuestion, initialSession.id, handleNextQuestion])

  if (isGameOver) {
    return (
      <GameOverScreen
        status={gameStatus as "victory" | "defeat"}
        sessionId={initialSession.id}
        xpEarned={xpEarned}
        correctAnswers={correctCount}
        totalQuestions={totalQuestions}
        pdfName={initialSession.pdf_name}
        subjectContext={subjectContext}
        onBackToDashboard={() => router.push("/dashboard")}
      />
    )
  }

  return (
    <main className={`min-h-screen flex flex-col rpg-grid-bg ${shakeScreen ? "animate-shake" : ""}`}>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>

      <GameHUD
        lives={lives}
        xp={xpEarned}
        currentQuestion={currentIndex + 1}
        totalQuestions={totalQuestions}
        pdfName={initialSession.pdf_name}
        difficulty={initialSession.difficulty}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {currentQuestion && (
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            onAnswer={handleAnswer}
            onNext={handleNextQuestion}
            isAnswered={answeredQuestions.has(currentQuestion.id)}
            removedOptions={removedOptions}
            hintText={hintText}
          />
        )}
      </div>

      <PowerUpBar
        inventory={inventory}
        onUseItem={handleUseItem}
        disabled={isGameOver || answeredQuestions.has(currentQuestion?.id ?? "")}
      />
    </main>
  )
}
