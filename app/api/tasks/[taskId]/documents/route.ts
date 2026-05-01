import { getDashboardUser } from "@/lib/auth/dashboard-user"
import { grantAchievement } from "@/lib/achievements/grant"
import { countTables, processTaskPdf } from "@/lib/tasks/document-processing"
import { getTaskDocumentsBucket } from "@/lib/tasks/storage-cleanup"

interface Params {
  params: Promise<{ taskId: string }>
}

const MAX_UPLOAD_BYTES = Number(process.env.DOCUMENT_MAX_ORIGINAL_UPLOAD_MB ?? 10) * 1024 * 1024

export const runtime = "nodejs"

export async function POST(req: Request, { params }: Params) {
  const { taskId } = await params
  const { supabase, user } = await getDashboardUser()

  const { data: task } = await supabase
    .from("user_tasks")
    .select("id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single()

  if (!task) {
    return Response.json({ error: "Tarea no encontrada" }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get("file")
  const requestedTitle = String(formData.get("title") ?? "").trim()

  if (!(file instanceof File)) {
    return Response.json({ error: "Debes subir un PDF" }, { status: 400 })
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: `El PDF supera el limite de ${process.env.DOCUMENT_MAX_ORIGINAL_UPLOAD_MB ?? 10} MB` }, { status: 400 })
  }

  const title = requestedTitle || file.name.replace(/\.pdf$/i, "")
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const content = await processTaskPdf(buffer, title)

    const { data: existing } = await supabase
      .from("task_documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_id", taskId)
      .eq("source_hash", content.sourceHash)
      .maybeSingle()

    if (existing) {
      return Response.json({ document: existing, reused: true })
    }

    const { data: inserted, error: insertError } = await supabase
      .from("task_documents")
      .insert({
        user_id: user.id,
        task_id: taskId,
        title,
        original_file_name: file.name,
        source_hash: content.sourceHash,
        content_storage_path: "pending",
        image_count: 0,
        table_count: countTables(content),
        storage_bytes: 0,
        text_char_count: content.charCount,
        estimated_tokens: content.estimatedTokens,
        page_count: content.pageCount,
        processing_status: "processing",
      })
      .select("*")
      .single()

    if (insertError || !inserted) {
      console.error("[tasks/documents] insert error:", insertError)
      return Response.json({ error: "No se pudo crear el documento" }, { status: 500 })
    }

    const contentPath = `users/${user.id}/tasks/${taskId}/documents/${inserted.id}/content.json`
    const json = JSON.stringify(content)
    const { error: uploadError } = await supabase.storage
      .from(getTaskDocumentsBucket())
      .upload(contentPath, new Blob([json], { type: "application/json" }), {
        contentType: "application/json",
        upsert: true,
      })

    if (uploadError) {
      console.error("[tasks/documents] upload error:", uploadError)
      await supabase.from("task_documents").delete().eq("id", inserted.id).eq("user_id", user.id)
      return Response.json({ error: "No se pudo guardar content.json en Storage" }, { status: 500 })
    }

    const { data: document, error: updateError } = await supabase
      .from("task_documents")
      .update({
        content_storage_path: contentPath,
        storage_bytes: Buffer.byteLength(json, "utf8"),
        processing_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", inserted.id)
      .eq("user_id", user.id)
      .select("*")
      .single()

    if (updateError || !document) {
      return Response.json({ error: "No se pudo finalizar el documento" }, { status: 500 })
    }

    const achievement = await grantAchievement(supabase, user.id, "first_chest_document", {
      documentId: document.id,
      taskId,
    })

    return Response.json({ document, achievement, reused: false })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo procesar el PDF" },
      { status: 400 }
    )
  }
}
