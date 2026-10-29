import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isValidDateOfBirth(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsedDate.getTime())
    && parsedDate.toISOString().slice(0, 10) === value
    && value <= new Date().toISOString().slice(0, 10)
}

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("Unable to verify the user for profile lookup:", authError)
    return NextResponse.json({ error: "Unable to verify authentication." }, { status: 500 })
  }
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }

  const [profileResult, countResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, date_of_birth, exercises_solved")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profile_problem_counts")
      .select("exercises_solved"),
  ])

  if (profileResult.error) {
    console.error("Unable to load the user's profile:", profileResult.error)
    return NextResponse.json({ error: "Unable to load profile details." }, { status: 500 })
  }
  if (countResult.error) {
    console.error("Unable to load anonymous problem counts:", countResult.error)
    return NextResponse.json({ error: "Unable to load problem counts." }, { status: 500 })
  }
  const profile = profileResult.data
  if (!profile) {
    return NextResponse.json({ error: "Profile details are unavailable." }, { status: 404 })
  }
  if (
    typeof profile.exercises_solved !== "number"
    || !Number.isSafeInteger(profile.exercises_solved)
    || profile.exercises_solved < 0
  ) {
    console.error("The user's profile contains an invalid solved-problem count.")
    return NextResponse.json({ error: "Profile progress is invalid." }, { status: 500 })
  }
  if (profile.date_of_birth !== null && typeof profile.date_of_birth !== "string") {
    console.error("The user's profile contains an invalid date of birth.")
    return NextResponse.json({ error: "Profile details are invalid." }, { status: 500 })
  }

  const problemCounts = countResult.data.map(({ exercises_solved }) => exercises_solved)
  if (problemCounts.some((count) => (
    typeof count !== "number" || !Number.isSafeInteger(count) || count < 0
  ))) {
    console.error("A profile contains an invalid solved-problem count.")
    return NextResponse.json({ error: "Problem counts are invalid." }, { status: 500 })
  }

  return NextResponse.json({
    name: (typeof profile.name === "string" ? profile.name.trim() : "")
      || (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "")
      || (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : ""),
    dateOfBirth: profile.date_of_birth ?? "",
    exercisesSolved: profile.exercises_solved,
    problemCounts,
  })
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("Unable to verify the user for profile update:", authError)
    return NextResponse.json({ error: "Unable to verify authentication." }, { status: 500 })
  }
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 })
  }

  if (
    typeof body !== "object"
    || body === null
    || !("name" in body)
    || typeof body.name !== "string"
    || !body.name.trim()
    || body.name.trim().length > 120
    || !("dateOfBirth" in body)
    || (
      body.dateOfBirth !== null
      && body.dateOfBirth !== ""
      && !isValidDateOfBirth(body.dateOfBirth)
    )
  ) {
    return NextResponse.json({ error: "A valid name and optional date of birth are required." }, { status: 400 })
  }

  const dateOfBirth = body.dateOfBirth === "" ? null : body.dateOfBirth
  const name = body.name.trim()
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ name, date_of_birth: dateOfBirth })
    .eq("id", user.id)
    .select("name, date_of_birth")
    .maybeSingle()

  if (error) {
    console.error("Unable to update the user's date of birth:", error)
    return NextResponse.json({ error: "Unable to update date of birth." }, { status: 500 })
  }
  if (!profile) {
    return NextResponse.json({ error: "Profile details are unavailable." }, { status: 404 })
  }

  return NextResponse.json({
    name: profile.name ?? name,
    dateOfBirth: profile.date_of_birth ?? "",
  })
}
