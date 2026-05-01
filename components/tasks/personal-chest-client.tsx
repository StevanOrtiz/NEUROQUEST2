"use client"

import { useEffect, useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Archive,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  ScrollText,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { dispatchAchievementUnlock, dispatchAchievementUnlocks } from "@/lib/achievements/client-events"
import { getTaskDocumentsBucket } from "@/lib/tasks/storage-cleanup"
import { TASK_TYPES, type ProcessedDocumentContent, type TaskDocument, type UserTask } from "@/lib/tasks/types"

interface PersonalChestClientProps {
  initialTasks: UserTask[]
  initialDocuments: TaskDocument[]
}

interface TaskFormState {
  title: string
  subjectName: string
  dueDate: string
  taskType: string
  description: string
  files: File[]
}

const emptyForm: TaskFormState = {
  title: "",
  subjectName: "",
  dueDate: "",
  taskType: "Lectura",
  description: "",
  files: [],
}

export function PersonalChestClient({ initialTasks, initialDocuments }: PersonalChestClientProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [documents, setDocuments] = useState(initialDocuments)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTasks[0]?.id ?? null)
  const [form, setForm] = useState<TaskFormState>(emptyForm)
  const [creating, setCreating] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null
  const documentsByTask = useMemo(() => {
    return documents.reduce((groups, document) => {
      groups[document.task_id] = [...(groups[document.task_id] ?? []), document]
      return groups
    }, {} as Record<string, TaskDocument[]>)
  }, [documents])

  async function refresh() {
    const res = await fetch("/api/tasks")
    const data = await res.json()
    if (res.ok) {
      setTasks(data.tasks ?? [])
      setDocuments(data.documents ?? [])
      if (!selectedTaskId && data.tasks?.[0]) setSelectedTaskId(data.tasks[0].id)
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.title.trim()) {
      toast.error("El nombre de la tarea es obligatorio")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear la tarea")

      setTasks((prev) => [data.task, ...prev])
      setSelectedTaskId(data.task.id)
      toast.success("Mision creada")
      if (data.achievement) {
        dispatchAchievementUnlock(data.achievement)
      } else {
        window.dispatchEvent(new CustomEvent("questmind:mascot-message", {
          detail: { message: "Nueva mision guardada en tu cofre." },
        }))
      }

      if (form.files.length > 0) {
        await uploadFiles(data.task.id, form.files)
      }

      setForm(emptyForm)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado")
    } finally {
      setCreating(false)
    }
  }

  async function uploadFiles(taskId: string, files: File[]) {
    setUploadingFor(taskId)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("title", file.name.replace(/\.pdf$/i, ""))

        const res = await fetch(`/api/tasks/${taskId}/documents`, {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? `No se pudo procesar ${file.name}`)
        if (data.document) {
          setDocuments((prev) => [data.document, ...prev.filter((doc) => doc.id !== data.document.id)])
        }
        dispatchAchievementUnlock(data.achievement)
      }
      toast.success("Documento procesado y guardado como lector")
      window.dispatchEvent(new CustomEvent("questmind:mascot-message", {
        detail: { message: "Pergamino archivado sin guardar el PDF original." },
      }))
    } finally {
      setUploadingFor(null)
    }
  }

  async function completeTask(task: UserTask) {
    const shouldDelete = window.confirm(
      "Mision completada. ¿Quieres eliminarla tambien para liberar espacio? Aceptar elimina tarea y documentos; Cancelar solo la marca como completada."
    )

    if (shouldDelete) {
      await deleteTask(task, { skipConfirm: true })
      return
    }

    setCompletingTaskId(task.id)
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo completar")
      setCompletingTaskId(null)
      return
    }
    setTasks((prev) => prev.map((item) => item.id === task.id ? data.task : item))
    setCompletingTaskId(null)
    toast.success("Mision completada")
    if (data.achievements?.length) {
      dispatchAchievementUnlocks(data.achievements)
    } else {
      window.dispatchEvent(new CustomEvent("questmind:mascot-message", {
        detail: { message: "Mision completada. Buen trabajo." },
      }))
    }
  }

  async function deleteTask(task: UserTask, options: { skipConfirm?: boolean } = {}) {
    if (!options.skipConfirm) {
      const ok = window.confirm("Eliminar esta tarea borrara tambien sus documentos de Storage. ¿Continuar?")
      if (!ok) return
    }
    setDeletingTaskId(task.id)
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo eliminar")
      setDeletingTaskId(null)
      return
    }
    setTasks((prev) => prev.filter((item) => item.id !== task.id))
    setDocuments((prev) => prev.filter((doc) => doc.task_id !== task.id))
    setSelectedTaskId((current) => current === task.id ? null : current)
    setDeletingTaskId(null)
    toast.success("Tarea eliminada y espacio liberado")
  }

  async function deleteDocument(document: TaskDocument) {
    const ok = window.confirm("Eliminar este documento borrara content.json de Storage. ¿Continuar?")
    if (!ok) return
    const res = await fetch(`/api/tasks/${document.task_id}/documents/${document.id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo eliminar el documento")
      return
    }
    setDocuments((prev) => prev.filter((doc) => doc.id !== document.id))
    toast.success("Documento eliminado")
  }

  async function renameDocument(document: TaskDocument) {
    const title = window.prompt("Nuevo nombre del documento", document.title)?.trim()
    if (!title) return
    const res = await fetch(`/api/tasks/${document.task_id}/documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo renombrar")
      return
    }
    setDocuments((prev) => prev.map((doc) => doc.id === document.id ? data.document : doc))
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6">
      <motion.section
        className="mb-6 rounded-xl border border-rpg-gold/25 bg-card/80 p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-rpg-gold/35 bg-rpg-gold/10 text-rpg-gold">
              <Archive className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Tu Cofre Personal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Misiones, materias y pergaminos procesados para estudiar sin llenar Storage.
            </p>
          </div>
          <div className="rounded-lg border border-border/45 bg-background/30 px-4 py-3 text-xs text-muted-foreground">
            {tasks.filter((task) => task.status === "pending").length} misiones pendientes
          </div>
        </div>
      </motion.section>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <form onSubmit={handleCreateTask} className="rounded-xl border border-border/50 bg-card/80 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Nueva mision</h2>
            </div>
            <div className="space-y-3">
              <Field label="Nombre tarea">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="Materia">
                <Input value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} />
              </Field>
              <Field label="Fecha de entrega">
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </Field>
              <Field label="Tipo">
                <select
                  value={form.taskType}
                  onChange={(e) => setForm({ ...form, taskType: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background/40 px-3 text-sm"
                >
                  {TASK_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </Field>
              <Field label="Descripcion">
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="Subir documentos relevantes">
                <Input
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  onChange={(e) => setForm({ ...form, files: Array.from(e.target.files ?? []) })}
                />
              </Field>
              <Button disabled={creating} className="w-full">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Crear mision
              </Button>
            </div>
          </form>

          <div className="rounded-xl border border-border/50 bg-card/80 p-3">
            <h2 className="mb-3 px-1 text-sm font-semibold text-foreground">Misiones</h2>
            <div className="space-y-2">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedTask?.id === task.id
                      ? "border-primary/45 bg-primary/10"
                      : "border-border/45 bg-background/20 hover:border-primary/30"
                  }`}
                >
                  <span className="block truncate text-sm font-semibold text-foreground">{task.title}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{task.subject_name || "Sin materia"}</span>
                    <TaskStatusBadge task={task} />
                  </span>
                </button>
              ))}
              {tasks.length === 0 && (
                <p className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  Tu cofre esta vacio. Crea tu primera mision.
                </p>
              )}
            </div>
          </div>
        </aside>

        <section className="min-h-[620px] rounded-xl border border-border/50 bg-card/75 p-5">
          <AnimatePresence mode="wait">
            {selectedTask ? (
              <motion.div
                key={selectedTask.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedTask.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedTask.description || "Sin descripcion"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.status !== "completed" && (
                      <Button
                        onClick={() => completeTask(selectedTask)}
                        size="sm"
                        disabled={completingTaskId === selectedTask.id || deletingTaskId === selectedTask.id}
                      >
                        {completingTaskId === selectedTask.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Completar
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteTask(selectedTask)}
                      variant="outline"
                      size="sm"
                      disabled={deletingTaskId === selectedTask.id}
                    >
                      {deletingTaskId === selectedTask.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Eliminar
                    </Button>
                  </div>
                </div>

                <div className="mb-5 grid gap-3 md:grid-cols-4">
                  <Info label="Materia" value={selectedTask.subject_name || "Sin materia"} icon={BookOpen} />
                  <Info label="Fecha" value={selectedTask.due_date || "Sin fecha"} icon={Calendar} />
                  <Info label="Tipo" value={selectedTask.task_type || "Otro"} icon={ScrollText} />
                  <Info label="Estado" value={getTaskStatus(selectedTask)} icon={CheckCircle2} />
                </div>

                <div className="mb-5 rounded-xl border border-border/45 bg-background/25 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">Pergaminos/documentos</h3>
                      <p className="text-xs text-muted-foreground">
                        PDFs convertidos a lector ligero. El PDF original no se conserva.
                      </p>
                    </div>
                    {uploadingFor === selectedTask.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  </div>
                  <Input
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    disabled={uploadingFor === selectedTask.id}
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? [])
                      if (files.length) void uploadFiles(selectedTask.id, files)
                      event.currentTarget.value = ""
                    }}
                  />
                </div>

                <div className="space-y-3">
                  {(documentsByTask[selectedTask.id] ?? []).map((document) => (
                    <TaskDocumentAccordion
                      key={document.id}
                      document={document}
                      onDelete={deleteDocument}
                      onRename={renameDocument}
                    />
                  ))}
                  {(documentsByTask[selectedTask.id] ?? []).length === 0 && (
                    <p className="rounded-xl border border-dashed border-border/60 p-5 text-sm text-muted-foreground">
                      Esta mision aun no tiene documentos relevantes.
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full min-h-[520px] items-center justify-center text-muted-foreground">
                Selecciona o crea una mision para abrir el cofre.
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg border border-border/45 bg-background/25 p-3">
      <Icon className="mb-2 h-4 w-4 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function TaskStatusBadge({ task }: { task: UserTask }) {
  const status = getTaskStatus(task)
  const color = status === "Vencida" ? "text-rpg-health" : status === "Completada" ? "text-primary" : "text-rpg-gold"
  return <span className={`font-mono ${color}`}>{status}</span>
}

function getTaskStatus(task: UserTask) {
  if (task.status === "completed") return "Completada"
  if (task.due_date && task.due_date < new Date().toISOString().slice(0, 10)) return "Vencida"
  return "Pendiente"
}

function TaskDocumentAccordion({
  document,
  onDelete,
  onRename,
}: {
  document: TaskDocument
  onDelete: (document: TaskDocument) => Promise<void>
  onRename: (document: TaskDocument) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState<ProcessedDocumentContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [renaming, setRenaming] = useState(false)

  useEffect(() => {
    if (!open || content) return
    let cancelled = false

    async function loadContent() {
      const cacheKey = `questmind:task-document:${document.id}:${document.updated_at}:${document.storage_bytes}`
      const cached = window.sessionStorage.getItem(cacheKey)
      if (cached) {
        setContent(JSON.parse(cached))
        return
      }

      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase.storage
          .from(getTaskDocumentsBucket())
          .download(document.content_storage_path)

        if (error || !data) {
          throw error ?? new Error("Storage no devolvio contenido")
        }

        const parsed = JSON.parse(await data.text())
        window.sessionStorage.setItem(cacheKey, JSON.stringify(parsed))
        if (!cancelled) setContent(parsed)
      } catch {
        try {
          const res = await fetch(`/api/tasks/${document.task_id}/documents/${document.id}/content`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          window.sessionStorage.setItem(cacheKey, JSON.stringify(data))
          if (!cancelled) setContent(data)
        } catch {
          if (!cancelled) toast.error("No se pudo cargar el lector")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadContent()
    return () => {
      cancelled = true
    }
  }, [
    open,
    content,
    document.id,
    document.task_id,
    document.content_storage_path,
    document.storage_bytes,
    document.updated_at,
  ])

  async function handleDelete() {
    setDeleting(true)
    await onDelete(document)
    setDeleting(false)
  }

  async function handleRename() {
    setRenaming(true)
    await onRename(document)
    setRenaming(false)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-background/25">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <FileText className="h-5 w-5 shrink-0 text-rpg-gold" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{document.title}</span>
            <span className="text-xs text-muted-foreground">
              {document.page_count} pags · {Math.round(document.storage_bytes / 1024)} KB · {document.table_count} tablas
            </span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/45"
          >
            <div className="flex flex-wrap gap-2 p-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleRename()}
                disabled={renaming || deleting}
              >
                {renaming && <Loader2 className="h-4 w-4 animate-spin" />}
                Renombrar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleDelete()}
                disabled={renaming || deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </Button>
            </div>
            <div className="max-h-[560px] overflow-y-auto border-t border-border/35 p-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando lector
                </div>
              ) : content ? (
                <DocumentReader content={content} />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DocumentReader({ content }: { content: ProcessedDocumentContent }) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()

  return (
    <article className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 -mt-4 border-b border-border/35 bg-card/95 p-4 backdrop-blur">
        <h3 className="font-semibold text-foreground">{content.title}</h3>
        <Input
          className="mt-3"
          placeholder="Buscar en el documento..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {content.pages.map((page) => (
        <section key={page.page} className="rounded-lg border border-border/35 bg-card/55 p-4">
          <p className="mb-3 text-xs font-mono text-rpg-gold">Pagina {page.page}</p>
          <div className="space-y-3">
            {page.blocks
              .filter((block) => !normalizedQuery || JSON.stringify(block).toLowerCase().includes(normalizedQuery))
              .map((block, index) => <DocumentBlockView key={`${page.page}-${index}`} block={block} />)}
          </div>
        </section>
      ))}
    </article>
  )
}

function DocumentBlockView({ block }: { block: any }) {
  if (block.type === "heading") {
    return <h4 className="text-lg font-bold text-foreground">{block.text}</h4>
  }
  if (block.type === "table") {
    return (
      <div className="overflow-x-auto rounded-lg border border-border/45">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-primary/15 text-foreground">
            <tr>
              {(block.columns ?? []).map((column: string, index: number) => (
                <th key={index} className="border-b border-border/45 px-3 py-2 text-left">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(block.rows ?? []).map((row: string[], rowIndex: number) => (
              <tr key={rowIndex} className="odd:bg-background/20">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border-b border-border/25 px-3 py-2 text-muted-foreground">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  return <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{block.text}</p>
}
