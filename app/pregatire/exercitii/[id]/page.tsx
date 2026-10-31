import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExerciseAnswerForm } from "@/components/exercise-answer-form"
import { MathText } from "@/components/math-text"
import { getExercise } from "@/lib/exercises"
import { getAnswerTypeLabel, parseExerciseOptions } from "@/lib/exercise-utils"

export default async function ExerciseDetailPage({ params }: { params: { id: string } }) {
  const result = await getExercise(params.id)

  if (result.error) {
    return (
      <section className="mx-auto max-w-3xl space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/pregatire/exercitii"><ArrowLeft className="mr-2 h-4 w-4" />Înapoi la exerciții</Link>
        </Button>
      </section>
    )
  }

  if (!result.exercise) notFound()

  const { exercise, solved, userId } = result
  const options = exercise.answer_type === "multiple_choice"
    ? parseExerciseOptions(exercise.options)
    : []

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/pregatire/exercitii">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Toate exercițiile
        </Link>
      </Button>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Exercițiul #{exercise.exercise_number}</Badge>
              <Badge variant="outline">Clasa {exercise.grade}</Badge>
              <Badge variant="outline">{exercise.topic}</Badge>
              <Badge variant="outline">{exercise.chapter}</Badge>
            </div>
            <Badge variant={solved ? "default" : "secondary"} className="gap-1.5">
              {solved
                ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                : <Circle className="h-3.5 w-3.5" aria-hidden="true" />}
              {solved ? "Rezolvat" : "Nerezolvat"}
            </Badge>
          </div>
          <CardTitle>Exercițiul #{exercise.exercise_number}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {exercise.additional_text && (
            <MathText className="block whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {exercise.additional_text}
            </MathText>
          )}
          <MathText className="block whitespace-pre-wrap leading-7">
            {exercise.prompt_text}
          </MathText>
          {exercise.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exercise.image_url}
              alt="Ilustrație pentru exercițiu"
              className="h-auto max-h-[28rem] max-w-full rounded-md border object-contain"
            />
          )}
          <ExerciseAnswerForm
            exerciseId={exercise.id}
            answerType={exercise.answer_type}
            options={options ?? []}
            optionsValid={exercise.answer_type !== "multiple_choice" || options?.length === 4}
            initiallySolved={solved}
            canAnswer={Boolean(userId)}
          />
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Badge variant="secondary">{exercise.origin}</Badge>
            <Badge variant="secondary">{getAnswerTypeLabel(exercise.answer_type)}</Badge>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
