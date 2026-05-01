import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Always create a new client per function call — never store in a global variable.
 * This is especially important with Fluid compute / streaming.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: unknown }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // Cast to any to avoid @supabase/ssr <-> next/headers ResponseCookie type mismatch
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cookieStore.set(name, value, options as any)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore,
            // the middleware will keep the session fresh.
          }
        },
      },
    },
  )
}
