import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { ThemeProvider } from "@/components/theme-provider" // Import ThemeProvider
import { Analytics } from "@vercel/analytics/react"; //Vercel Analytics

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
        </ThemeProvider>
        <Analytics /> {/* Vercel Analytics */}
      </body>
    </html>
  )
}
