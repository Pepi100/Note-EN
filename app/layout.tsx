import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { ThemeProvider } from "@/components/theme-provider" // Import ThemeProvider
import Link from "next/link" // Added Link import

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tablou de Bord Statistici Studenți", // Translated title
  description: "Tablou de bord pentru analiza datelor de performanță ale studenților pe parcursul anilor", // Translated description
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro" suppressHydrationWarning>
      {" "}
      {/* Changed lang to "ro" */}
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="container mx-auto px-4 py-8">{children}</main>
          <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-16">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  © 2024 Statistici Studenți. Toate drepturile rezervate.
                </div>
                <div className="flex items-center gap-4">
                  <Link href="/despre" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Despre
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
