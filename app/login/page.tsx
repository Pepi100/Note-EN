"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, authError, signIn, signUp, signInWithGoogle, signOut } = useAuth()
  const [isRegistering, setIsRegistering] = useState(false)
  const [name, setName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const today = new Date()
  const latestDateOfBirth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("auth_error") === "callback") {
      setError("Autentificarea nu a putut fi finalizată. Încearcă din nou.")
    }
  }, [])

  useEffect(() => {
    if (user) {
      router.replace("/")
    }
  }, [router, user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (isRegistering && password !== confirmPassword) {
      setError("Parolele nu coincid.")
      return
    }

    setSubmitting(true)
    try {
      const result = isRegistering
        ? await signUp(name, dateOfBirth, email, password)
        : await signIn(email, password)
      if (result.error) {
        setError(result.error)
      } else if (result.needsEmailConfirmation) {
        setMessage("Verifică-ți emailul și confirmă adresa pentru a activa contul.")
      }
    } catch (error) {
      console.error("Supabase authentication request failed:", error)
      setError("Cererea de autentificare nu a putut fi finalizată. Încearcă din nou.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const result = await signInWithGoogle()
      if (result.error) setError(result.error)
    } catch (error) {
      console.error("Google OAuth request failed:", error)
      setError("Autentificarea Google nu a putut fi pornită. Încearcă din nou.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setError(null)
    try {
      const result = await signOut()
      if (result.error) setError(result.error)
    } catch (error) {
      console.error("Supabase sign-out request failed:", error)
      setError("Deconectarea nu a putut fi finalizată. Încearcă din nou.")
    }
  }

  if (loading) {
    return <div className="flex min-h-[300px] items-center justify-center">Se verifică sesiunea...</div>
  }

  if (user) {
    const fullName = user.user_metadata?.full_name
    return (
      <section className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Contul tău</CardTitle>
            <CardDescription>Autentificare gestionată de Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              {typeof fullName === "string" && <p className="font-medium">{fullName}</p>}
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              Deconectare
            </Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{isRegistering ? "Creează un cont" : "Autentificare"}</CardTitle>
          <CardDescription>
            {isRegistering
              ? "Înregistrează-te cu email și parolă."
              : "Conectează-te cu email și parolă sau continuă cu Google."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={submitting}
          >
            Continuă cu Google
          </Button>

          <div className="relative py-1 text-center text-xs text-muted-foreground">
            <span className="bg-card px-2">sau cu email</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="account-name">Nume</Label>
                <Input
                  id="account-name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
            )}
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="account-date-of-birth">Data nașterii (opțional)</Label>
                <Input
                  id="account-date-of-birth"
                  type="date"
                  autoComplete="bday"
                  max={latestDateOfBirth}
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="account-email">Email</Label>
              <Input
                id="account-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-password">Parolă</Label>
              <Input
                id="account-password"
                type="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="account-password-confirm">Confirmă parola</Label>
                <Input
                  id="account-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {authError && !error && (
              <Alert variant="destructive">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Se procesează..." : isRegistering ? "Creează cont" : "Conectare"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isRegistering ? "Ai deja un cont?" : "Nu ai un cont?"}{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setIsRegistering(!isRegistering)
                setError(null)
                setMessage(null)
              }}
            >
              {isRegistering ? "Autentifică-te" : "Înregistrează-te"}
            </button>
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
