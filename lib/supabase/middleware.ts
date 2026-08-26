import { createServerClient } from "@supabase/ssr"
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/types/database.types"

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/game") ||
    pathname.startsWith("/protected")
  )
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/auth/login"
  url.searchParams.set("redirectedFrom", request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.",
    )

    if (isProtectedPath(pathname)) {
      return redirectToLogin(request)
    }

    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Partial<ResponseCookie> }[]) {
          // First apply to the request so downstream Server Components see them
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Supabase middleware auth error:", error.message)
    }

    if (!user && isProtectedPath(pathname)) {
      return redirectToLogin(request)
    }

    return supabaseResponse
  } catch (error) {
    console.error("Middleware invocation failed:", error)

    if (isProtectedPath(pathname)) {
      return redirectToLogin(request)
    }

    return NextResponse.next({
      request,
    })
  }
}
