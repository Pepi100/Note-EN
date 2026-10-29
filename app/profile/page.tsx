"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, authError, signOut } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [exercisesSolved, setExercisesSolved] = useState<number | null>(null)
  const [problemCounts, setProblemCounts] = useState<number[]>([])
  const [name, setName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const controller = new AbortController()

    const loadProfile = async () => {
      setProfileLoading(true)
      setProfileError(null)

      try {
        const response = await fetch("/api/profile", { signal: controller.signal })
        const result: {
          name?: unknown
          dateOfBirth?: unknown
          exercisesSolved?: unknown
          problemCounts?: unknown
          error?: unknown
        } = await response.json()

        if (!response.ok) {
          throw new Error(typeof result.error === "string" ? result.error : "Unable to load profile.")
        }
        if (typeof result.exercisesSolved !== "number" || !Number.isSafeInteger(result.exercisesSolved) || result.exercisesSolved < 0) {
          throw new Error("The profile contains an invalid solved-problem count.")
        }
        if (
          typeof result.name !== "string"
          || (result.dateOfBirth !== "" && (
            typeof result.dateOfBirth !== "string"
            || !/^\d{4}-\d{2}-\d{2}$/.test(result.dateOfBirth)
          ))
          || !Array.isArray(result.problemCounts)
          || result.problemCounts.some((count) => (
            typeof count !== "number" || !Number.isSafeInteger(count) || count < 0
          ))
        ) {
          throw new Error("The profile response contains invalid data.")
        }

        setName(result.name)
        setExercisesSolved(result.exercisesSolved)
        setDateOfBirth(typeof result.dateOfBirth === "string" ? result.dateOfBirth : "")
        setProblemCounts(result.problemCounts)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Unable to load profile details and problem counts:", error)
        setProfileError("Datele profilului nu au putut fi încărcate.")
      } finally {
        if (!controller.signal.aborted) setProfileLoading(false)
      }
    }

    void loadProfile()
    return () => controller.abort()
  }, [user])

  const handleProfileSave = async () => {
    setSavingProfile(true)
    setProfileError(null)
    setProfileMessage(null)
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dateOfBirth: dateOfBirth || null }),
      })
      const result: { name?: unknown; dateOfBirth?: unknown; error?: unknown } = await response.json()

      if (!response.ok || typeof result.name !== "string" || typeof result.dateOfBirth !== "string") {
        throw new Error(typeof result.error === "string" ? result.error : "Unable to update profile.")
      }

      setName(result.name)
      setDateOfBirth(result.dateOfBirth)
      setProfileMessage("Profilul a fost actualizat.")
    } catch (error) {
      console.error("Unable to save profile:", error)
      setProfileError("Profilul nu a putut fi actualizat.")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    setError(null)
    try {
      const result = await signOut()
      if (result.error) {
        setError("Deconectarea nu a putut fi finalizată. Încearcă din nou.")
        return
      }
      router.replace("/login")
    } catch (error) {
      console.error("Supabase sign-out request failed:", error)
      setError("Deconectarea nu a putut fi finalizată. Încearcă din nou.")
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-[300px] items-center justify-center">Se verifică sesiunea...</div>
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-md space-y-4">
        <Alert>
          <AlertDescription>
            Nu ești autentificat. Conectează-te pentru a-ți vedea profilul.
          </AlertDescription>
        </Alert>
        {authError && (
          <Alert variant="destructive">
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}
        <Button className="w-full" onClick={() => router.replace("/login")}>
          Mergi la autentificare
        </Button>
      </section>
    )
  }

  const createdAt = new Date(user.created_at)

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profilul meu</CardTitle>
          <CardDescription>Detaliile contului tău autentificat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-green-500" />
            <span className="font-medium text-green-700 dark:text-green-400">Ești autentificat</span>
          </div>

          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">Nume</dt>
              <dd className="mt-1">
                <input
                  aria-label="Nume"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setProfileMessage(null)
                  }}
                  disabled={profileLoading || savingProfile}
                  required
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email ?? "Nedisponibil"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Data nașterii</dt>
              <dd className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  aria-label="Data nașterii"
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  type="date"
                  value={dateOfBirth}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => {
                    setDateOfBirth(event.target.value)
                    setProfileMessage(null)
                  }}
                  disabled={profileLoading || savingProfile}
                />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Probleme rezolvate</dt>
              <dd className="font-medium">
                {profileLoading ? "Se încarcă..." : exercisesSolved ?? "Nedisponibil"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Cont creat</dt>
              <dd className="font-medium">
                {Number.isNaN(createdAt.getTime())
                  ? "Nedisponibil"
                  : createdAt.toLocaleDateString("ro-RO", { dateStyle: "long" })}
              </dd>
            </div>
          </dl>

          <Button
            type="button"
            className="w-full"
            onClick={handleProfileSave}
            disabled={profileLoading || savingProfile || !name.trim()}
          >
            {savingProfile ? "Se salvează..." : "Salvează profilul"}
          </Button>

          {profileMessage && (
            <Alert>
              <AlertDescription>{profileMessage}</AlertDescription>
            </Alert>
          )}

          {profileError && (
            <Alert variant="destructive">
              <AlertDescription>{profileError}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Se deconectează..." : "Deconectare"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Probleme rezolvate de utilizatori</CardTitle>
          <CardDescription>
            Numărul de probleme rezolvate, afișat anonim. Datele personale nu sunt incluse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <p className="text-sm text-muted-foreground">Se încarcă statisticile...</p>
          ) : problemCounts.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {problemCounts.map((count, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                >
                  <span>Utilizator {index + 1}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nu există statistici disponibile.</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
