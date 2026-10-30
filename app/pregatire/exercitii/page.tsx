import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExerciseList } from "@/components/exercise-list"
import { getExercises } from "@/lib/exercises"

export default async function ExercisesPage() {
  const result = await getExercises()

  if (result.error) {
    return (
      <section className="mx-auto max-w-3xl">
        <Alert variant="destructive">
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      </section>
    )
  }

  return (
    <ExerciseList
      exercises={result.exercises}
      solvedIds={[...result.solvedIds]}
    />
  )
}
