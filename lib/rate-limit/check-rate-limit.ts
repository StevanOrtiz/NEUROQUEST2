export interface RateLimitOptions {
  maxEvents: number
  windowMinutes: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds?: number
}

type SupabaseLike = {
  from: (table: string) => any
}

/**
 * Per-user sliding-window rate limit backed by Supabase (no Redis/Upstash —
 * overkill for this project's volume). Fails open on infra errors: a broken
 * rate-limit check should never block a legitimate user from using the app.
 */
export async function checkRateLimit(
  supabase: SupabaseLike,
  userId: string,
  route: string,
  { maxEvents, windowMinutes }: RateLimitOptions
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMinutes * 60_000).toISOString()

  const { data: events, error } = await supabase
    .from("api_rate_limit_events")
    .select("created_at")
    .eq("user_id", userId)
    .eq("route", route)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[rate-limit] check error, failing open:", error.message)
    return { allowed: true }
  }

  if ((events?.length ?? 0) >= maxEvents) {
    const oldest = new Date(events[0].created_at).getTime()
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMinutes * 60_000 - Date.now()) / 1000)
    )
    return { allowed: false, retryAfterSeconds }
  }

  const { error: insertError } = await supabase
    .from("api_rate_limit_events")
    .insert({ user_id: userId, route })

  if (insertError) {
    console.error("[rate-limit] insert error, failing open:", insertError.message)
  }

  return { allowed: true }
}

export function rateLimitResponse(result: RateLimitResult) {
  const minutes = Math.max(1, Math.ceil((result.retryAfterSeconds ?? 60) / 60))
  return Response.json(
    { error: `Demasiadas solicitudes. Intenta de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.` },
    {
      status: 429,
      headers: result.retryAfterSeconds ? { "Retry-After": String(result.retryAfterSeconds) } : undefined,
    }
  )
}
