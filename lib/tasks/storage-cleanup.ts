const BUCKET = "study-documents"

type SupabaseLike = {
  storage: any
}

export function getTaskDocumentsBucket() {
  return BUCKET
}

export async function removeStoragePrefix(supabase: SupabaseLike, prefix: string) {
  const bucket = supabase.storage.from(BUCKET)
  const files = await listFilesRecursive(bucket, prefix)

  if (files.length > 0) {
    const { error } = await bucket.remove(files)
    if (error) {
      console.error("[tasks/storage] remove prefix error:", error.message)
      return false
    }
  }

  return true
}

export async function removeStorageFile(supabase: SupabaseLike, path: string) {
  return removeStorageFiles(supabase, [path])
}

export async function removeStorageFiles(supabase: SupabaseLike, paths: string[]) {
  const cleanPaths = paths.filter(Boolean)
  if (cleanPaths.length === 0) return true

  const { error } = await supabase.storage.from(BUCKET).remove(cleanPaths)
  if (error) {
    console.error("[tasks/storage] remove files error:", error.message)
    return false
  }
  return true
}

async function listFilesRecursive(bucket: any, prefix: string): Promise<string[]> {
  const { data, error } = await bucket.list(prefix, { limit: 1000 })
  if (error || !data) return []

  const files: string[] = []

  for (const entry of data) {
    const path = `${prefix}/${entry.name}`
    if (entry.metadata) {
      files.push(path)
    } else {
      files.push(...await listFilesRecursive(bucket, path))
    }
  }

  return files
}
