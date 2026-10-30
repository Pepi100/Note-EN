import { createClient } from "@/lib/supabase/server"

export interface Exercise {
  id: string
  topic: string
  chapter: string
  grade: number
  origin: string
  prompt_text: string
  additional_text: string | null
  image_url: string | null
  answer_type: string
  options: unknown
}

const exerciseColumns =
  "id, topic, chapter, grade, origin, prompt_text, additional_text, image_url, answer_type, options"
const exercisePageSize = 500

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseExercise(value: unknown): Exercise | null {
  if (!isRecord(value)) return null

  const {
    id,
    topic,
    chapter,
    grade,
    origin,
    prompt_text,
    additional_text,
    image_url,
    answer_type,
    options,
  } = value

  if (
    typeof id !== "string"
    || typeof topic !== "string"
    || typeof chapter !== "string"
    || typeof grade !== "number"
    || !Number.isInteger(grade)
    || typeof origin !== "string"
    || typeof prompt_text !== "string"
    || (additional_text !== null && typeof additional_text !== "string")
    || (image_url !== null && typeof image_url !== "string")
    || typeof answer_type !== "string"
  ) {
    return null
  }

  return {
    id,
    topic,
    chapter,
    grade,
    origin,
    prompt_text,
    additional_text,
    image_url,
    answer_type,
    options,
  }
}

async function getCurrentUserId(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && error.name !== "AuthSessionMissingError") {
    console.error("Unable to verify the user for exercise progress:", error)
    return { error: "Sesiunea nu a putut fi verificată.", userId: null }
  }

  return { error: null, userId: user?.id ?? null }
}

async function getSolvedExerciseIds(userId: string | null, exerciseIds: string[]) {
  if (!userId || exerciseIds.length === 0) {
    return { error: null, solvedIds: new Set<string>() }
  }

  const supabase = createClient()
  const solvedIds = new Set<string>()

  for (let offset = 0; offset < exerciseIds.length; offset += exercisePageSize) {
    const { data, error } = await supabase
      .from("user_exercise_progress")
      .select("exercise_id")
      .eq("user_id", userId)
      .eq("status", "solved")
      .in("exercise_id", exerciseIds.slice(offset, offset + exercisePageSize))

    if (error) {
      console.error("Unable to load the user's exercise progress:", error)
      return { error: "Starea exercițiilor nu a putut fi încărcată.", solvedIds: new Set<string>() }
    }

    for (const row of data) {
      if (typeof row.exercise_id === "string") solvedIds.add(row.exercise_id)
    }
  }

  return { error: null, solvedIds }
}

export async function getExercises() {
  const supabase = createClient()
  const { error: authError, userId } = await getCurrentUserId(supabase)
  if (authError) return { error: authError, exercises: [], solvedIds: new Set<string>() }

  const rows: unknown[] = []
  for (let offset = 0; ; offset += exercisePageSize) {
    const { data, error } = await supabase
      .from("exercises")
      .select(exerciseColumns)
      .order("created_at", { ascending: false })
      .range(offset, offset + exercisePageSize - 1)

    if (error) {
      console.error("Unable to load exercises:", error)
      return {
        error: "Exercițiile nu au putut fi încărcate.",
        exercises: [],
        solvedIds: new Set<string>(),
      }
    }

    rows.push(...data)
    if (data.length < exercisePageSize) break
  }

  const parsedExercises = rows.map(parseExercise)
  if (parsedExercises.some((exercise) => exercise === null)) {
    console.error("The exercises table contains rows with an invalid shape.")
    return {
      error: "Datele exercițiilor sunt invalide.",
      exercises: [],
      solvedIds: new Set<string>(),
    }
  }

  const validExercises = parsedExercises.filter((exercise): exercise is Exercise => exercise !== null)
  const progress = await getSolvedExerciseIds(userId, validExercises.map(({ id }) => id))
  if (progress.error) {
    return { error: progress.error, exercises: [], solvedIds: new Set<string>() }
  }

  return { error: null, exercises: validExercises, solvedIds: progress.solvedIds }
}

export async function getExercise(id: string) {
  const supabase = createClient()
  const { error: authError, userId } = await getCurrentUserId(supabase)
  if (authError) return { error: authError, exercise: null, solved: false }

  const { data, error } = await supabase
    .from("exercises")
    .select(exerciseColumns)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Unable to load exercise details:", error)
    return { error: "Exercițiul nu a putut fi încărcat.", exercise: null, solved: false }
  }

  if (!data) return { error: null, exercise: null, solved: false }

  const exercise = parseExercise(data)
  if (!exercise) {
    console.error("The exercise detail row has an invalid shape.")
    return { error: "Datele exercițiului sunt invalide.", exercise: null, solved: false }
  }

  const progress = await getSolvedExerciseIds(userId, [exercise.id])
  if (progress.error) {
    return { error: progress.error, exercise: null, solved: false }
  }

  return { error: null, exercise, solved: progress.solvedIds.has(exercise.id) }
}
