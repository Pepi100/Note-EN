"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, Moon, Sun, UserRound } from "lucide-react"
import { useTheme } from "next-themes" // Import useTheme
import { useDemoAuth } from "@/components/auth-provider"

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme() // Initialize useTheme
  const { user } = useDemoAuth()
  const isHome = pathname === "/"
  const isPreparationPage = pathname === "/pregatire"
  const isResultsSection = pathname.startsWith("/rezultate")

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
            {!isPreparationPage && (
              <Link href="/" className="text-xl font-bold">
                Statistici Studenți
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

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
              ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <Link href="/login" aria-label={user ? `Cont: ${user.name}` : "Autentificare"}>
                <UserRound className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{user ? `Cont: ${user.name}` : "Autentificare"}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
