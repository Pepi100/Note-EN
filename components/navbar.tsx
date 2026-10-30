"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, Moon, Sun, UserRound } from "lucide-react"
import { useTheme } from "next-themes" // Import useTheme
import { useAuth } from "@/components/auth-provider"

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme() // Initialize useTheme
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const isHome = pathname === "/"
  const isPreparationSection = pathname.startsWith("/pregatire")
  const isResultsSection = pathname.startsWith("/rezultate")

  useEffect(() => {
    if (loading || !user) {
      setIsAdmin(false)
      return
    }

    const controller = new AbortController()
    const checkAdminAccess = async () => {
      try {
        const response = await fetch("/api/admin/exercises", { signal: controller.signal })
        setIsAdmin(response.ok)
        if (!response.ok && response.status !== 401 && response.status !== 403) {
          console.error("Unable to check admin access for the navigation menu.")
        }
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Unable to check admin access for the navigation menu:", error)
        setIsAdmin(false)
      }
    }

    void checkAdminAccess()
    return () => controller.abort()
  }, [loading, user])

  const allYears = []
  for (let i = 2016; i <= 2026; i++) {
    // Start from 2016
    allYears.push(i.toString())
  }

  const visibleYears = ["2023", "2024", "2025", "2026"]
  const dropdownYears = allYears
    .filter((year) => !visibleYears.includes(year))
    .sort((a, b) => Number.parseInt(b) - Number.parseInt(a)) // Sort descending for dropdown

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isPreparationSection && (
              <Link href="/" className="text-xl font-bold">
                Educație.ro
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-6">
            {isHome && (
              <Link
                href="/rezultate"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  "text-muted-foreground",
                )}
              >
                Rezultate
              </Link>
            )}

            {isHome && (
              <Link href="/pregatire" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Pregătire
              </Link>
            )}

            {isPreparationSection && (
              <>
                <Link
                  href="/pregatire"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/pregatire" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  Pregătire
                </Link>
                <Link
                  href="/pregatire/exercitii"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname.startsWith("/pregatire/exercitii") ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  Exerciții
                </Link>
              </>
            )}

            {isResultsSection && (
              <>
                {/* Dropdown for Older Years */}
                {dropdownYears.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
                      >
                        Ani Anteriori
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {dropdownYears.map((year) => (
                        <DropdownMenuItem key={year} asChild>
                          <Link href={`/rezultate/${year}`}>{year}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {visibleYears.map((year) => (
                  <Link
                    key={year}
                    href={`/rezultate/${year}`}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      pathname === `/rezultate/${year}` ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {year}
                  </Link>
                ))}

                <Link
                  href="/rezultate/cauta-scoala"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/rezultate/cauta-scoala" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  Caută Școala Ta
                </Link>

                <Link
                  href="/rezultate/gasteste-locul"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/rezultate/gasteste-locul" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  Găsește-ți Locul
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                href="/admin/exercises"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/admin/exercises" ? "text-primary" : "text-muted-foreground",
                )}
              >
                Admin
              </Link>
            )}

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
              ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <Link
                href={user ? "/profile" : "/login"}
                aria-label={user ? `Profil autentificat: ${user.email ?? "utilizator"}` : "Autentificare"}
                aria-busy={loading}
                title={user ? "Profil (autentificat)" : "Autentificare"}
                className="relative"
              >
                <UserRound className="h-[1.2rem] w-[1.2rem]" />
                {user && (
                  <span
                    aria-hidden="true"
                    className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500"
                  />
                )}
                <span className="sr-only">{user ? `Profil autentificat: ${user.email ?? "utilizator"}` : "Autentificare"}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
