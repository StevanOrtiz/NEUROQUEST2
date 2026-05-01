export const ACHIEVEMENTS = {
  first_streak_3: {
    title: "Llama de Tres Dias",
    description: "Mantuviste tu primera racha de 3 dias.",
    icon: "F3",
    rarity: "rare",
  },
  first_pdf_completed: {
    title: "Pergamino Domado",
    description: "Completaste tu primer PDF en QuestMind.",
    icon: "PDF",
    rarity: "common",
  },
  pdf_accuracy_80: {
    title: "Ojo de Halcon",
    description: "Lograste 80% o mas de precision en una partida.",
    icon: "80",
    rarity: "rare",
  },
  first_subject_completed: {
    title: "Maestro de Ruta",
    description: "Completaste tu primera materia.",
    icon: "M",
    rarity: "epic",
  },
  first_module_completed: {
    title: "Llave de Modulo",
    description: "Completaste tu primer modulo de estudio.",
    icon: "K",
    rarity: "common",
  },
  first_pomodoro: {
    title: "Reloj de Enfoque",
    description: "Usaste tu primer Pomodoro.",
    icon: "25",
    rarity: "common",
  },
  first_chest: {
    title: "Cofre Despertado",
    description: "Ganaste tu primer cofre por buen rendimiento.",
    icon: "C",
    rarity: "rare",
  },
  first_victory: {
    title: "Primera Victoria",
    description: "Ganaste tu primera aventura.",
    icon: "V",
    rarity: "common",
  },
  level_3: {
    title: "Ascenso Relampago",
    description: "Alcanzaste el nivel 3.",
    icon: "L3",
    rarity: "rare",
  },
  adhd_check_completed: {
    title: "Brujula Interior",
    description: "Completaste el chequeo breve de TDAH.",
    icon: "TD",
    rarity: "common",
  },
  first_task_created: {
    title: "Primera Mision",
    description: "Creaste tu primera tarea en el cofre personal.",
    icon: "T1",
    rarity: "common",
  },
  first_task_completed: {
    title: "Mision Sellada",
    description: "Completaste tu primera tarea del cofre.",
    icon: "OK",
    rarity: "rare",
  },
  first_chest_document: {
    title: "Pergamino Archivado",
    description: "Guardaste tu primer documento procesado en el cofre.",
    icon: "DOC",
    rarity: "common",
  },
  organized_chest_5: {
    title: "Cofre Ordenado",
    description: "Completaste 5 tareas del cofre personal.",
    icon: "5X",
    rarity: "epic",
  },
} as const

export type AchievementCode = keyof typeof ACHIEVEMENTS

export type AchievementDefinition = (typeof ACHIEVEMENTS)[AchievementCode]
