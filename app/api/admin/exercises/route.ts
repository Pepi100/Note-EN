import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function requiredText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null

  const text = value.trim()
  return text.length > 0 && text.length <= maxLength ? text : null
}

function optionalText(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return undefined

  const text = value.trim()
  return text.length <= maxLength ? text || null : undefined
}

async function authorizeAdmin() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error("Unable to verify the user for exercise administration:", authError)
    return {
      response: NextResponse.json({ error: "Unable to verify authentication." }, { status: 500 }),
    }
  }
  if (!user) {
    return {
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    }
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin")
  if (roleError) {
    console.error("Unable to verify the user's admin role:", roleError)
    return {
      response: NextResponse.json({ error: "Unable to verify admin access." }, { status: 500 }),
    }
  }
  if (isAdmin !== true) {
    return {
      response: NextResponse.json({ error: "Admin access required." }, { status: 403 }),
    }
  }

  return { supabase }
}

export async function GET() {
  const authorization = await authorizeAdmin()
  if ("response" in authorization) return authorization.response

  return NextResponse.json({ authorized: true })
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin()
  if ("response" in authorization) return authorization.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 })
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "A valid exercise is required." }, { status: 400 })
  }

  const topic = requiredText(body.topic, 120)
  const chapter = requiredText(body.chapter, 120)
  const origin = requiredText(body.origin, 120)
  const promptText = requiredText(body.prompt_text, 10000)
  const answerType = requiredText(body.answer_type, 60)
  const correctAnswer = requiredText(body.correct_answer, 1000)
  const additionalText = optionalText(body.additional_text, 10000)
  const imageUrl = optionalText(body.image_url, 2048)
  const grade = body.grade

  if (
    !topic
    || !chapter
    || !origin
    || !promptText
    || !answerType
    || !correctAnswer
    || additionalText === undefined
    || imageUrl === undefined
    || typeof grade !== "number"
    || !Number.isInteger(grade)
    || grade < -32768
    || grade > 32767
  ) {
    return NextResponse.json({ error: "Exercise fields are missing or invalid." }, { status: 400 })
  }

  if (imageUrl) {
    try {
      const parsedImageUrl = new URL(imageUrl)
      if (parsedImageUrl.protocol !== "https:" && parsedImageUrl.protocol !== "http:") {
        return NextResponse.json({ error: "Image URL must use HTTP or HTTPS." }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: "Image URL must be a valid absolute URL." }, { status: 400 })
    }
  }

  if (body.options !== undefined && body.options !== null) {
    const optionsLength = JSON.stringify(body.options).length
    if (optionsLength > 10000) {
      return NextResponse.json({ error: "Options must be 10,000 characters or fewer." }, { status: 400 })
    }
  }

  const { error } = await authorization.supabase.from("exercises").insert({
    topic,
    chapter,
    grade,
    origin,
    prompt_text: promptText,
    additional_text: additionalText,
    image_url: imageUrl,
    answer_type: answerType,
    options: body.options ?? null,
    correct_answer: correctAnswer,
  })

  if (error) {
    console.error("Unable to create exercise:", error)
    return NextResponse.json({ error: "Unable to save the exercise." }, { status: 500 })
  }

  return NextResponse.json({ created: true }, { status: 201 })
}
