"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ExerciseOption } from "@/lib/exercise-utils"
import { MathText } from "@/components/math-text"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ExerciseAnswerFormProps {
  exerciseId: string
  answerType: string
  options: ExerciseOption[]
  optionsValid: boolean
  initiallySolved: boolean
  canAnswer: boolean
}

export function ExerciseAnswerForm({
  exerciseId,
  answerType,
  options,
  optionsValid,
  initiallySolved,
  canAnswer,
}: ExerciseAnswerFormProps) {
  const router = useRouter()
  const [answer, setAnswer] = useState("")
  const [solved, setSolved] = useState(initiallySolved)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isMultipleChoice = answerType === "multiple_choice"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setFeedback(null)

    try {
      const response = await fetch(`/api/exercises/${encodeURIComponent(exerciseId)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      })
      const result: { error?: unknown; isCorrect?: unknown; isSolved?: unknown } = await response.json()

      if (!response.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "Răspunsul nu a putut fi verificat.")
      }
      if (typeof result.isCorrect !== "boolean" || typeof result.isSolved !== "boolean") {
        throw new Error("Răspunsul serverului este invalid.")
      }

      setSolved(result.isSolved)
      setFeedback({
        correct: result.isCorrect,
        message: result.isCorrect ? "Răspuns corect!" : "Răspuns greșit. Mai încearcă!",
      })
      if (result.isSolved) router.refresh()
    } catch (submitError) {
      console.error("Unable to submit exercise answer:", submitError)
      setError(submitError instanceof Error
        ? submitError.message
        : "Răspunsul nu a putut fi verificat. Încearcă din nou.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!canAnswer) {
    return (
      <Alert>
        <AlertDescription>
          <Link className="font-medium underline underline-offset-4" href="/login">
            Conectează-te
          </Link>
          {" "}pentru a trimite răspunsul și a salva progresul.
        </AlertDescription>
      </Alert>
    )
  }

  if (isMultipleChoice && !optionsValid) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Opțiunile acestui exercițiu nu sunt configurate corect.</AlertDescription>
      </Alert>
    )
  }

  if (solved && !isMultipleChoice) {
    return (
      <Alert>
        <AlertDescription>Ai rezolvat deja acest exercițiu.</AlertDescription>
      </Alert>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {isMultipleChoice ? (
        <RadioGroup
          aria-label="Alege un răspuns"
          className="space-y-2"
          value={answer}
          disabled={solved}
          onValueChange={(value) => {
            setAnswer(value)
            setFeedback(null)
          }}
        >
          {options.map((option, index) => {
            const id = `exercise-${exerciseId}-option-${index}`
            return (
              <Label
                key={`${option.value}-${index}`}
                htmlFor={id}
                className={`flex items-start gap-3 rounded-md border bg-background px-4 py-3 font-normal ${
                  solved ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem id={id} value={option.value} className="mt-0.5" />
                <span className="font-semibold">{option.label}.</span>
                <MathText className="whitespace-pre-wrap">{option.text}</MathText>
              </Label>
            )
          })}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`exercise-${exerciseId}-answer`}>Răspunsul tău</Label>
          <Input
            id={`exercise-${exerciseId}-answer`}
            autoComplete="off"
            inputMode={answerType === "numeric" ? "decimal" : "text"}
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value)
              setFeedback(null)
            }}
            maxLength={1000}
            required
          />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {feedback && (
        <Alert variant={feedback.correct ? "default" : "destructive"}>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      {solved ? (
        <Alert>
          <AlertDescription>Ai rezolvat deja acest exercițiu.</AlertDescription>
        </Alert>
      ) : (
        <Button type="submit" disabled={submitting || !answer.trim()}>
          {submitting ? "Se verifică..." : "Trimite răspunsul"}
        </Button>
      )}
    </form>
  )
}
