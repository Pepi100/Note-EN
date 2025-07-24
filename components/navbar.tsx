"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getBasePath } from "@/lib/path-utils" // Import getBasePath for active link comparison

export function Navbar() {
  const pathname = usePathname()
  const basePath = getBasePath() // Get the base path for comparison

  const links = [
    { href: "/", label: "Overview" },
    { href: "/2023", label: "2023" },
    { href: "/2024", label: "2024" },
    { href: "/2025", label: "2025" },
  ]

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Link to root, Next.js will handle basePath automatically */}
            <Link href="/" className="text-xl font-bold">
              Student Statistics
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href} // Removed manual basePath concatenation
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  // Compare pathname with the link's href, considering the basePath
                  pathname === `${basePath}${link.href}` || (link.href === "/" && pathname === basePath)
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
