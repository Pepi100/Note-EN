import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!uuidPattern.test(params.id)) {
    return NextResponse.json({ error: "Exercițiul nu a fost găsit." }, { status: 404 })
  }

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("Unable to verify the user submitting an exercise answer:", authError)
    return NextResponse.json({ error: "Sesiunea nu a putut fi verificată." }, { status: 500 })
  }
  if (!user) {
    return NextResponse.json({ error: "Conectează-te pentru a trimite un răspuns." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cererea trebuie să conțină JSON valid." }, { status: 400 })
  }

  if (
    !isRecord(body)
    || typeof body.answer !== "string"
    || !body.answer.trim()
    || body.answer.trim().length > 1000
  ) {
    return NextResponse.json({ error: "Alege sau introdu un răspuns valid." }, { status: 400 })
  }

  const { data, error } = await supabase.rpc("submit_exercise_answer", {
    p_exercise_id: params.id,
    p_answer: body.answer.trim(),
  })

  if (error) {
    if (error.code === "P0002") {
      return NextResponse.json({ error: "Exercițiul nu a fost găsit." }, { status: 404 })
    }
    console.error("Unable to check and save the exercise answer:", error)
    return NextResponse.json({ error: "Răspunsul nu a putut fi verificat." }, { status: 500 })
  }

  const result = Array.isArray(data) ? data[0] : data
  if (
    !isRecord(result)
    || typeof result.is_correct !== "boolean"
    || typeof result.is_solved !== "boolean"
  ) {
    console.error("The exercise answer function returned an invalid response.")
    return NextResponse.json({ error: "Răspunsul serverului este invalid." }, { status: 500 })
  }

  return NextResponse.json({
    isCorrect: result.is_correct,
    isSolved: result.is_solved,
  })
}
