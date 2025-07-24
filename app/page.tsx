"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
// import { parseCSV, calculateYearStats } from "@/lib/data-utils"

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

  useEffect(() => {
    const loadAllYearStats = async () => {
      try {
        const years = ["2023", "2024", "2025"]
        const yearStats: Record<string, YearStats> = {}

        for (const year of years) {
          try {
            // const data = await parseCSV(`/${year}.csv`)
            // yearStats[year] = calculateYearStats(data)
          } catch (error) {
            console.error(`Error loading ${year} data:`, error)
            yearStats[year] = {
              totalStudents: 0,
              averageFinalGrade: 0,
              absenteeCount: 0,
              absenteePercentage: 0,
            }
          }
        }

        setStats(yearStats)
        setError(null)
      } catch (error) {
        console.error("Error loading year statistics:", error)
        setError("Failed to load statistics. Please check if CSV files are available.")
      } finally {
        setLoading(false)
      }
    }

    loadAllYearStats()
  }, [])

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
        <div className="text-center">
          <p className="text-muted-foreground">
            Make sure the CSV files (2023.csv, 2024.csv, 2025.csv) are placed in the public/ directory.
          </p>
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
              <Link href={`/${year}`}>
                <Button className="w-full">View Detailed Analysis</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
