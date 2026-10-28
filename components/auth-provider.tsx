"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface DemoUser {
  email: string
  name: string
}

interface AuthContextValue {
  user: DemoUser | null
  signIn: (email: string, name?: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null)

  const signIn = (email: string, name?: string) => {
    setUser({ email, name: name?.trim() || email.split("@")[0] })
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useDemoAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useDemoAuth must be used within an AuthProvider")
  }
  return context
}
