export interface Exercise {
  id: string
  exercise_number: number
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

export interface ExerciseOption {
  value: string
  label: string
  text: string
}

export function getAnswerTypeLabel(answerType: string): string {
  switch (answerType) {
    case "multiple_choice":
      return "Grilă"
    case "numeric":
      return "Numeric"
    case "text":
      return "Text"
    default:
      return answerType
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function parseExerciseOptions(value: unknown): ExerciseOption[] | null {
  if (!Array.isArray(value)) return null

  const options: ExerciseOption[] = []
  for (const [index, option] of value.entries()) {
    if (typeof option === "string" || typeof option === "number") {
      const text = String(option)
      options.push({ value: text, label: String.fromCharCode(65 + index), text })
      continue
    }

    if (!isRecord(option)) return null
    const text = typeof option.text === "string" || typeof option.text === "number"
      ? String(option.text)
      : typeof option.label === "string"
        ? option.label
        : null
    const answerValue = typeof option.label === "string" && option.label.trim()
      ? option.label.trim()
      : text

    if (text === null || answerValue === null) return null
    options.push({
      value: answerValue,
      label: typeof option.label === "string" && option.label.trim()
        ? option.label.trim().toUpperCase()
        : String.fromCharCode(65 + index),
      text,
    })
  }

  return options
}
