import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const errorDestination = new URL("/login", request.url)

  if (!code) {
    errorDestination.searchParams.set("auth_error", "callback")
    return NextResponse.redirect(errorDestination)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Unable to complete Supabase OAuth callback:", error)
    errorDestination.searchParams.set("auth_error", "callback")
    return NextResponse.redirect(errorDestination)
  }

  return NextResponse.redirect(new URL("/", request.url))
}
