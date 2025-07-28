"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCSV, calculateYearStats } from "@/lib/data-utils"

interface YearStats {
  totalStudents: number
  averageFinalGrade: number
  absenteeCount: number
  absenteePercentage: number
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Record<string, YearStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any[]>([])

  useEffect(() => {
    const loadAllYearStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const debug: any[] = []

        const years = []
        for (let i = 2016; i <= 2025; i++) {
          // Start from 2016
          years.push(i.toString())
        }

        // Add current URL info to debug
        debug.push({
          currentURL: window.location.href,
          baseURL: window.location.origin,
          pathname: window.location.pathname,
          hostname: window.location.hostname,
        })

        const yearStats: Record<string, YearStats> = {}
        for (const year of years) {
          try {
            debug.push(`Se încarcă datele pentru anul ${year}...`)
            const data = await parseCSV(`/${year}.csv`)
            debug.push(`S-au încărcat ${data.length} înregistrări pentru ${year}`)
            yearStats[year] = calculateYearStats(data)
          } catch (error) {
            console.error(`Eroare la încărcarea datelor pentru ${year}:`, error)
            debug.push(`Eroare la încărcarea datelor pentru ${year}: ${error}`)
            yearStats[year] = {
              totalStudents: 0,
              averageFinalGrade: 0,
              absenteeCount: 0,
              absenteePercentage: 0,
            }
          }
        }

        setStats(yearStats)
        setDebugInfo(debug)

        const hasValidData = Object.values(yearStats).some((stat) => stat.totalStudents > 0)
        if (!hasValidData) {
          setError(
            "Nu s-au găsit date valide în fișierele CSV. Vă rugăm să verificați fișierele CSV și accesibilitatea acestora.",
          )
        }
      } catch (error) {
        console.error("Eroare la încărcarea statisticilor anuale:", error)
        setError(
          "Nu s-au putut încărca statisticile. Vă rugăm să verificați dacă fișierele CSV sunt disponibile și accesibile.",
        )
        setDebugInfo((prev) => [...prev, `Eroare generală: ${error}`])
      } finally {
        setLoading(false)
      }
    }

    loadAllYearStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Se încarcă statisticile...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            Asigurați-vă că fișierele CSV (ex: 2016.csv, 2017.csv, ..., 2025.csv) sunt plasate în directorul public/.
          </p>
          <p className="text-sm text-muted-foreground">
            Verificați consola browserului și informațiile de depanare de mai jos pentru mai multe detalii.
          </p>
        </div>

        {/* Debug information */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Informații de Depanare:</h3>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    )
  }

  const hasData = Object.values(stats).some((stat) => stat.totalStudents > 0)

  if (!hasData) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            Nu s-au găsit date în niciun fișier CSV. Vă rugăm să verificați fișierele de date.
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <p className="text-muted-foreground">
            Asigurați-vă că fișierele CSV conțin date valide cu coloanele necesare.
          </p>
        </div>

        {/* Debug information */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Informații de Depanare:</h3>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Prezentare Generală Statistici Studenți</h1>
        <p className="text-muted-foreground mt-2">
          Analiză cuprinzătoare a performanței studenților pe parcursul mai multor ani
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(stats).map(([year, yearStats]) => (
          <Card key={year} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">{year}</CardTitle>
              <CardDescription>Statistici an universitar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Număr Total Studenți:</span>
                  <span className="font-medium">{yearStats.totalStudents.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Medie Finală:</span>
                  <span className="font-medium">
                    {yearStats.averageFinalGrade > 0 ? yearStats.averageFinalGrade.toFixed(2) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Absenți:</span>
                  <span className="font-medium">
                    {yearStats.absenteeCount} ({yearStats.absenteePercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <Link href={`/${year}`}>
                <Button className="w-full">Vizualizați Analiza Detaliată</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Debug information - only show when there are issues */}
      {debugInfo.length > 4 && (
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Informații de Depanare:</h3>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
