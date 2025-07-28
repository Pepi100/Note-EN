"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()

  const allYears = []
  for (let i = 2016; i <= 2025; i++) {
    // Start from 2016
    allYears.push(i.toString())
  }

  const visibleYears = ["2022", "2023", "2024", "2025"]
  const dropdownYears = allYears
    .filter((year) => !visibleYears.includes(year))
    .sort((a, b) => Number.parseInt(b) - Number.parseInt(a)) // Sort descending for dropdown

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold">
              Statistici Studenți
            </Link>
          </div>
          <div className="flex items-center space-x-6">
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
                      <Link href={`/${year}`}>{year}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Visible Years */}
            {visibleYears.map((year) => (
              <Link
                key={year}
                href={`/${year}`}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === `/${year}` ? "text-primary" : "text-muted-foreground",
                )}
              >
                {year}
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
