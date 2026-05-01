export const TASK_TYPES = [
  "Lectura",
  "Ensayo",
  "Investigacion",
  "Examen",
  "Proyecto",
  "Laboratorio",
  "Otro",
] as const

export type TaskStatus = "pending" | "completed" | "archived"

export interface UserTask {
  id: string
  user_id: string
  subject_name: string | null
  title: string
  description: string | null
  due_date: string | null
  task_type: string | null
  status: TaskStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskDocument {
  id: string
  user_id: string
  task_id: string
  title: string
  original_file_name: string | null
  source_hash: string | null
  content_storage_path: string
  image_count: number
  table_count: number
  storage_bytes: number
  text_char_count: number
  estimated_tokens: number
  page_count: number
  processing_status: "processing" | "completed" | "failed"
  created_at: string
  updated_at: string
}

export interface DocumentBlock {
  type: "heading" | "paragraph" | "table"
  text?: string
  title?: string | null
  columns?: string[]
  rows?: string[][]
  fallbackImage?: string | null
}

export interface ProcessedDocumentContent {
  title: string
  sourceHash: string
  pageCount: number
  charCount: number
  estimatedTokens: number
  pages: Array<{
    page: number
    blocks: DocumentBlock[]
  }>
}
