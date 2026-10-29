import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const destination = new URL("/login", request.url)

  if (!code) {
    destination.searchParams.set("auth_error", "callback")
    return NextResponse.redirect(destination)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Unable to complete Supabase OAuth callback:", error)
    destination.searchParams.set("auth_error", "callback")
    return NextResponse.redirect(destination)
  }

  return NextResponse.redirect(destination)
}
