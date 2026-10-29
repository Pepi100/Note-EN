"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface AuthActionResult {
  error: string | null
  needsEmailConfirmation?: boolean
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  authError: string | null
  signIn: (email: string, password: string) => Promise<AuthActionResult>
  signUp: (
    name: string,
    dateOfBirth: string,
    email: string,
    password: string,
  ) => Promise<AuthActionResult>
  signInWithGoogle: () => Promise<AuthActionResult>
  signOut: () => Promise<AuthActionResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null)
        setLoading(false)
        setAuthError(null)
      }
    })

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return
      setUser(data.user)
      setLoading(false)
      if (error) {
        if (error.name === "AuthSessionMissingError") {
          setAuthError(null)
        } else {
          console.error("Unable to load the Supabase session:", error)
          setAuthError("Nu s-a putut verifica sesiunea. Încearcă să reîncarci pagina.")
        }
      }
    }).catch((error: unknown) => {
      if (!active) return
      console.error("Unable to load the Supabase session:", error)
      setLoading(false)
      setAuthError("Nu s-a putut verifica sesiunea. Încearcă să reîncarci pagina.")
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<AuthActionResult> => {
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (
    name: string,
    dateOfBirth: string,
    email: string,
    password: string,
  ): Promise<AuthActionResult> => {
    const origin = window.location.origin
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim(), date_of_birth: dateOfBirth },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })
    return {
      error: error?.message ?? null,
      needsEmailConfirmation: !error && !data.session,
    }
  }

  const signInWithGoogle = async (): Promise<AuthActionResult> => {
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async (): Promise<AuthActionResult> => {
    const { error } = await createClient().auth.signOut()
    return { error: error?.message ?? null }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, authError, signIn, signUp, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
