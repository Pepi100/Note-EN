"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCSV, calculateYearStats } from "@/lib/data-utils"
import { getBasePath } from "@/lib/path-utils" // Import getBasePath for Link href

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
  const basePath = getBasePath() // Get the base path for Link href

  useEffect(() => {
    const loadAllYearStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const debug: any[] = []

        const years = ["2023", "2024", "2025"]
        const yearStats: Record<string, YearStats> = {}

        // Add current URL info to debug
        debug.push({
          currentURL: window.location.href,
          baseURL: window.location.origin,
          pathname: window.location.pathname,
          environment: process.env.NODE_ENV,
          basePathConfig: basePath,
        })

        for (const year of years) {
          try {
            debug.push(`Loading data for year ${year}...`)
            const data = await parseCSV(`/${year}.csv`)
            debug.push(`Loaded ${data.length} records for ${year}`)
            yearStats[year] = calculateYearStats(data)
          } catch (error) {
            console.error(`Error loading ${year} data:`, error)
            debug.push(`Error loading ${year}: ${error}`)
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
          setError("No valid data found in any CSV files. Please check the CSV files and their accessibility.")
        }
      } catch (error) {
        console.error("Error loading year statistics:", error)
        setError("Failed to load statistics. Please check if CSV files are available and accessible.")
        setDebugInfo((prev) => [...prev, `General error: ${error}`])
      } finally {
        setLoading(false)
      }
    }

    loadAllYearStats()
  }, [basePath]) // Depend on basePath to re-run if it changes (though it's static)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading statistics...</div>
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
            Make sure the CSV files (2023.csv, 2024.csv, 2025.csv) are placed in the public/ directory.
          </p>
          <p className="text-sm text-muted-foreground">
            Check the browser console and debug information below for more details.
          </p>
        </div>

        {/* Debug information */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Debug Information:</h3>
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
          <AlertDescription>No data found in any CSV files. Please check your data files.</AlertDescription>
        </Alert>
        <div className="text-center">
          <p className="text-muted-foreground">Ensure your CSV files contain valid data with the required columns.</p>
        </div>

        {/* Debug information */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Debug Information:</h3>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Student Statistics Overview</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive analysis of student performance across multiple years
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(stats).map(([year, yearStats]) => (
          <Card key={year} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">{year}</CardTitle>
              <CardDescription>Academic year statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Students:</span>
                  <span className="font-medium">{yearStats.totalStudents.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average Final Grade:</span>
                  <span className="font-medium">
                    {yearStats.averageFinalGrade > 0 ? yearStats.averageFinalGrade.toFixed(2) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Absentees:</span>
                  <span className="font-medium">
                    {yearStats.absenteeCount} ({yearStats.absenteePercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              {/* Use getAssetPath for Link href to ensure correct base path */}
              <Link href={basePath + `/${year}`}>
                <Button className="w-full">View Detailed Analysis</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Debug information - only show in development or when there are issues */}
      {(process.env.NODE_ENV === "development" || debugInfo.length > 4) && (
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Debug Information:</h3>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
