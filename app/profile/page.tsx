"use client"

import { useState } from "react"
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

  const fullName = user.user_metadata?.full_name
  const displayName = typeof fullName === "string" && fullName.trim()
    ? fullName
    : user.email?.split("@")[0] ?? "Utilizator"
  const createdAt = new Date(user.created_at)

  return (
    <section className="mx-auto max-w-lg">
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
              <dd className="font-medium">{displayName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email ?? "Nedisponibil"}</dd>
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
    </section>
  )
}
