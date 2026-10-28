"use client"

import { useState, type FormEvent } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDemoAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const { user, signIn, signOut } = useDemoAuth()
  const [isRegistering, setIsRegistering] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Parola trebuie să conțină cel puțin 8 caractere.")
      return
    }

    if (isRegistering && password !== confirmPassword) {
      setError("Parolele nu coincid.")
      return
    }

    signIn(email, isRegistering ? name : undefined)
  }

  const handleGoogleDemo = () => {
    signIn("cont.demo@gmail.com", "Utilizator Google demo")
  }

  if (user) {
    return (
      <section className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Contul tău</CardTitle>
            <CardDescription>Sesiune demonstrativă, disponibilă doar până reîncarci pagina.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={signOut}>
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
            Demo de interfață. Conturile și parolele nu sunt salvate și nu există încă autentificare reală.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleDemo}>
            Continuă cu Google (demo)
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
                minLength={8}
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
                  minLength={8}
                  required
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full">
              {isRegistering ? "Creează cont demo" : "Conectare demo"}
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
