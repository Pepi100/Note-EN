"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type AccessState = "checking" | "allowed" | "denied" | "error"

export default function AdminExercisesPage() {
  const [access, setAccess] = useState<AccessState>("checking")
  const [accessMessage, setAccessMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [optionsText, setOptionsText] = useState("")

  useEffect(() => {
    const controller = new AbortController()

    const checkAccess = async () => {
      try {
        const response = await fetch("/api/admin/exercises", { signal: controller.signal })
        const result: { error?: unknown } = await response.json()

        if (response.ok) {
          setAccess("allowed")
        } else if (response.status === 401 || response.status === 403) {
          setAccess("denied")
          setAccessMessage(typeof result.error === "string" ? result.error : "Nu ai acces la această pagină.")
        } else {
          setAccess("error")
          setAccessMessage(typeof result.error === "string" ? result.error : "Accesul nu a putut fi verificat.")
        }
      } catch (requestError) {
        if (controller.signal.aborted) return
        console.error("Unable to check exercise administration access:", requestError)
        setAccess("error")
        setAccessMessage("Accesul nu a putut fi verificat. Încearcă din nou.")
      }
    }

    void checkAccess()
    return () => controller.abort()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setSaving(true)
    setError(null)
    setSuccess(false)

    let options: unknown = null
    if (optionsText.trim()) {
      try {
        options = JSON.parse(optionsText)
      } catch {
        setError("Opțiunile trebuie să fie JSON valid, de exemplu: [\"A\", \"B\"].")
        setSaving(false)
        return
      }
    }

    const formData = new FormData(form)
    const payload = {
      topic: formData.get("topic"),
      chapter: formData.get("chapter"),
      grade: Number(formData.get("grade")),
      origin: formData.get("origin"),
      prompt_text: formData.get("prompt_text"),
      additional_text: formData.get("additional_text"),
      image_url: formData.get("image_url"),
      answer_type: formData.get("answer_type"),
      options,
      correct_answer: formData.get("correct_answer"),
    }

    try {
      const response = await fetch("/api/admin/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result: { error?: unknown } = await response.json()

      if (!response.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "Exercițiul nu a putut fi salvat.")
      }

      form.reset()
      setOptionsText("")
      setSuccess(true)
    } catch (requestError) {
      console.error("Unable to save exercise:", requestError)
      setError(requestError instanceof Error ? requestError.message : "Exercițiul nu a putut fi salvat.")
    } finally {
      setSaving(false)
    }
  }

  if (access === "checking") {
    return <p className="mx-auto max-w-3xl text-sm text-muted-foreground">Se verifică accesul de administrator...</p>
  }

  if (access !== "allowed") {
    return (
      <section className="mx-auto max-w-3xl space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{accessMessage}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/profile">Înapoi la profil</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Adaugă un exercițiu</CardTitle>
          <CardDescription>
            Completează detaliile exercițiului. Câmpurile marcate cu * sunt obligatorii.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="topic">Materie / subiect *</Label>
                <Input id="topic" name="topic" maxLength={120} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapter">Capitol *</Label>
                <Input id="chapter" name="chapter" maxLength={120} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Clasă *</Label>
                <Input id="grade" name="grade" type="number" min={-32768} max={32767} step={1} defaultValue={8} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin">Sursă / origine *</Label>
                <Input id="origin" name="origin" maxLength={120} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer_type">Tipul răspunsului *</Label>
                <Input id="answer_type" name="answer_type" maxLength={60} placeholder="ex. multiple_choice" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correct_answer">Răspuns corect *</Label>
                <Input id="correct_answer" name="correct_answer" maxLength={1000} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt_text">Enunț *</Label>
              <Textarea id="prompt_text" name="prompt_text" maxLength={10000} rows={5} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_text">Text suplimentar</Label>
              <Textarea id="additional_text" name="additional_text" maxLength={10000} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL imagine</Label>
              <Input id="image_url" name="image_url" type="url" maxLength={2048} placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="options">Opțiuni (JSON, opțional)</Label>
              <Textarea
                id="options"
                maxLength={10000}
                placeholder={'["Varianta A", "Varianta B", "Varianta C"]'}
                rows={4}
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Pentru tipurile cu variante, introdu o listă JSON, de exemplu ["A", "B", "C"].
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>Exercițiul a fost adăugat în baza de date.</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? "Se salvează..." : "Adaugă exercițiul"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
