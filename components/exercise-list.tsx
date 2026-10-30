"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Exercise } from "@/lib/exercises"

interface ExerciseListProps {
  exercises: Exercise[]
  solvedIds: string[]
}

const pageSize = 12

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  const id = `exercise-filter-${label.toLowerCase().replaceAll(" ", "-")}`

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Toate</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  )
}

export function ExerciseList({ exercises, solvedIds }: ExerciseListProps) {
  const solved = useMemo(() => new Set(solvedIds), [solvedIds])
  const [topic, setTopic] = useState("")
  const [grade, setGrade] = useState("")
  const [chapter, setChapter] = useState("")
  const [origin, setOrigin] = useState("")
  const [answerType, setAnswerType] = useState("")
  const [page, setPage] = useState(1)

  const topics = useMemo(() => [...new Set(exercises.map(({ topic }) => topic))].sort(), [exercises])
  const grades = useMemo(
    () => [...new Set(exercises.map(({ grade }) => String(grade)))].sort((a, b) => Number(a) - Number(b)),
    [exercises],
  )
  const chapters = useMemo(() => [...new Set(exercises.map(({ chapter }) => chapter))].sort(), [exercises])
  const origins = useMemo(() => [...new Set(exercises.map(({ origin }) => origin))].sort(), [exercises])
  const answerTypes = useMemo(
    () => [...new Set(exercises.map(({ answer_type }) => answer_type))].sort(),
    [exercises],
  )

  const filteredExercises = useMemo(
    () => exercises.filter((exercise) => (
      (!topic || exercise.topic === topic)
      && (!grade || String(exercise.grade) === grade)
      && (!chapter || exercise.chapter === chapter)
      && (!origin || exercise.origin === origin)
      && (!answerType || exercise.answer_type === answerType)
    )),
    [answerType, chapter, exercises, grade, origin, topic],
  )
  const pageCount = Math.ceil(filteredExercises.length / pageSize)
  const currentPage = Math.min(page, Math.max(pageCount, 1))
  const visibleExercises = filteredExercises.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const solvedCount = filteredExercises.filter(({ id }) => solved.has(id)).length

  const clearFilters = () => {
    setTopic("")
    setGrade("")
    setChapter("")
    setOrigin("")
    setAnswerType("")
    setPage(1)
  }

  const updateFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="lg:sticky lg:top-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="h-4 w-4" />
            Filtrează exercițiile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FilterSelect label="Subiect" value={topic} options={topics} onChange={updateFilter(setTopic)} />
          <FilterSelect label="Clasă" value={grade} options={grades} onChange={updateFilter(setGrade)} />
          <FilterSelect label="Capitol" value={chapter} options={chapters} onChange={updateFilter(setChapter)} />
          <FilterSelect label="Origine" value={origin} options={origins} onChange={updateFilter(setOrigin)} />
          <FilterSelect label="Tipul răspunsului" value={answerType} options={answerTypes} onChange={updateFilter(setAnswerType)} />
          <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
            Șterge filtrele
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-4" aria-label="Lista exercițiilor">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Exerciții</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredExercises.length} exerciții · {solvedCount} rezolvate
            </p>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center gap-2" aria-label="Paginarea exercițiilor">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Înapoi
              </Button>
              <span className="text-sm text-muted-foreground">{currentPage} / {pageCount}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === pageCount}
              >
                Înainte
              </Button>
            </div>
          )}
        </div>

        {visibleExercises.length > 0 ? (
          visibleExercises.map((exercise) => {
            const isSolved = solved.has(exercise.id)

            return (
              <Link
                key={exercise.id}
                href={`/pregatire/exercitii/${encodeURIComponent(exercise.id)}`}
                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h2 className="font-semibold">{exercise.topic}</h2>
                        <p className="text-sm text-muted-foreground">
                          Clasa {exercise.grade} <span aria-hidden="true">·</span> {exercise.chapter}
                        </p>
                      </div>
                      <Badge variant={isSolved ? "default" : "secondary"} className="gap-1.5">
                        {isSolved
                          ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          : <Circle className="h-3.5 w-3.5" aria-hidden="true" />}
                        {isSolved ? "Rezolvat" : "Nerezolvat"}
                      </Badge>
                    </div>

                    <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6">
                      {exercise.prompt_text}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{exercise.origin}</Badge>
                      <Badge variant="outline">{exercise.answer_type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nu am găsit exerciții pentru filtrele selectate.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
