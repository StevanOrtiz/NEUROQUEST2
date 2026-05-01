export const ADHD_SCREENING_SOURCE = {
  instrument: "Adult ADHD Self-Report Scale (ASRS-v1.1) Screener",
  sourceName: "World Health Organization / Harvard Workgroup on Adult ADHD",
  sourceUrl: "https://www.hcp.med.harvard.edu/ncs/ftpdir/adhd/adhd/Old%20Versions/6Question-ADHD-ASRS-v1-1.pdf",
}

export const ADHD_RESPONSE_OPTIONS = [
  { value: 0, label: "Nunca" },
  { value: 1, label: "Rara vez" },
  { value: 2, label: "A veces" },
  { value: 3, label: "A menudo" },
  { value: 4, label: "Muy a menudo" },
] as const

export const ADHD_SCREENING_QUESTIONS = [
  {
    id: "finish_details",
    text: "En los ultimos 6 meses, que tan seguido te cuesta terminar los detalles finales de una tarea despues de hacer la parte mas dificil?",
    threshold: 2,
  },
  {
    id: "organization",
    text: "Que tan seguido te cuesta ordenar pasos, materiales o prioridades cuando una tarea requiere organizacion?",
    threshold: 2,
  },
  {
    id: "appointments",
    text: "Que tan seguido olvidas citas, compromisos, entregas u obligaciones importantes?",
    threshold: 2,
  },
  {
    id: "avoid_thought",
    text: "Que tan seguido evitas o aplazas empezar tareas que requieren bastante esfuerzo mental?",
    threshold: 3,
  },
  {
    id: "fidgeting",
    text: "Que tan seguido mueves manos o pies, cambias de postura o te inquietas cuando debes permanecer sentado?",
    threshold: 3,
  },
  {
    id: "driven",
    text: "Que tan seguido sientes una actividad interna excesiva, como si te costara bajar el ritmo o parar?",
    threshold: 3,
  },
] as const

export type AdhdQuestionId = (typeof ADHD_SCREENING_QUESTIONS)[number]["id"]

export type AdhdScreeningLevel = "low" | "moderate" | "elevated"

export interface AdhdScreeningResult {
  positiveCount: number
  totalScore: number
  level: AdhdScreeningLevel
  recommendation: string
}

export function scoreAdhdScreening(answers: Record<string, number>): AdhdScreeningResult {
  const positiveCount = ADHD_SCREENING_QUESTIONS.reduce((count, question) => {
    const value = answers[question.id] ?? 0
    return count + (value >= question.threshold ? 1 : 0)
  }, 0)

  const totalScore = ADHD_SCREENING_QUESTIONS.reduce((sum, question) => {
    return sum + (answers[question.id] ?? 0)
  }, 0)

  if (positiveCount >= 4) {
    return {
      positiveCount,
      totalScore,
      level: "elevated",
      recommendation:
        "Tus respuestas son compatibles con una senal de tamizaje elevada. Seria recomendable hablar con un profesional de salud mental o medico para una evaluacion completa.",
    }
  }

  if (positiveCount >= 2) {
    return {
      positiveCount,
      totalScore,
      level: "moderate",
      recommendation:
        "Hay algunas senales que podrian valer la pena explorar, sobre todo si afectan estudio, trabajo, descanso o relaciones. Considera comentarlo con un profesional si te genera malestar o deterioro.",
    }
  }

  return {
    positiveCount,
    totalScore,
    level: "low",
    recommendation:
      "Tus respuestas no sugieren una senal alta en este tamizaje breve. Si aun tienes dificultades importantes, consulta con un profesional para revisar otras posibles causas.",
  }
}
