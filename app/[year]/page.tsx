"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCSV, type StudentData, calculateDetailedStats, getUniqueCounties } from "@/lib/data-utils"
import { GradeHistogram } from "@/components/grade-histogram"

interface DetailedStats {
  totalStudents: number
  averageFinalGrade: number
  absentStats: {
    romanian: { count: number; percentage: number }
    mathematics: { count: number; percentage: number }
    nativeLanguage: { count: number; percentage: number }
  }
  gradeAverages: {
    romanian: number
    mathematics: number
    nativeLanguage: number
  }
  contestations: {
    total: number
    increased: number
    decreased: number
  }
  gradeDistributions: {
    finalGrades: number[]
    romanianGrades: number[]
    mathematicsGrades: number[]
    nativeLanguageGrades: number[]
  }
}

export function generateStaticParams() {
  return [
    { year: "2023" },
    { year: "2024" },
    { year: "2025" },
  ];
}


export default function YearPage() {
  const params = useParams()
  const year = params.year as string

  const [data, setData] = useState<StudentData[]>([])
  const [filteredData, setFilteredData] = useState<StudentData[]>([])
  const [stats, setStats] = useState<DetailedStats | null>(null)
  const [counties, setCounties] = useState<string[]>([])
  const [selectedCounty, setSelectedCounty] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const csvData = await parseCSV(`/${year}.csv`)

        if (csvData.length === 0) {
          setError(`No data found for year ${year}. Please check if the CSV file exists and contains valid data.`)
          return
        }

        setData(csvData)
        setFilteredData(csvData)
        setCounties(getUniqueCounties(csvData))
      } catch (error) {
        console.error(`Error loading ${year} data:`, error)
        setError(
          `Failed to load data for year ${year}. Please check if the CSV file is available and properly formatted.`,
        )
      } finally {
        setLoading(false)
      }
    }

    if (year) {
      loadData()
    }
  }, [year])

  useEffect(() => {
    if (data.length > 0) {
      const filtered = selectedCounty === "all" ? data : data.filter((student) => student.Judet === selectedCounty)
      setFilteredData(filtered)
      setStats(calculateDetailedStats(filtered))
    }
  }, [data, selectedCounty])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading {year} data...</div>
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
            Make sure the {year}.csv file is placed in the public/ directory and contains the required columns.
          </p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">No data available for {year}</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{year} Statistics</h1>
          <p className="text-muted-foreground mt-2">Detailed analysis of student performance</p>
        </div>
        {counties.length > 0 && (
          <div className="w-full sm:w-64">
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by county" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {counties.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Final Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageFinalGrade > 0 ? stats.averageFinalGrade.toFixed(2) : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Contestations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contestations.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              +{stats.contestations.increased} / -{stats.contestations.decreased}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Romanian Absentees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absentStats.romanian.count}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.absentStats.romanian.percentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Absence Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Absence Statistics by Subject</CardTitle>
          <CardDescription>Number and percentage of absent students per subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Romanian</h4>
              <div className="text-2xl font-bold">{stats.absentStats.romanian.count}</div>
              <div className="text-sm text-muted-foreground">
                {stats.absentStats.romanian.percentage.toFixed(1)}% absent
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Mathematics</h4>
              <div className="text-2xl font-bold">{stats.absentStats.mathematics.count}</div>
              <div className="text-sm text-muted-foreground">
                {stats.absentStats.mathematics.percentage.toFixed(1)}% absent
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Native Language</h4>
              <div className="text-2xl font-bold">{stats.absentStats.nativeLanguage.count}</div>
              <div className="text-sm text-muted-foreground">
                {stats.absentStats.nativeLanguage.percentage.toFixed(1)}% absent
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Histograms */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Final Grade Distribution</CardTitle>
            <CardDescription>
              Average: {stats.averageFinalGrade > 0 ? stats.averageFinalGrade.toFixed(2) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GradeHistogram data={stats.gradeDistributions.finalGrades} title="Final Grades" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Romanian Grade Distribution</CardTitle>
            <CardDescription>
              Average: {stats.gradeAverages.romanian > 0 ? stats.gradeAverages.romanian.toFixed(2) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GradeHistogram data={stats.gradeDistributions.romanianGrades} title="Romanian Grades" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mathematics Grade Distribution</CardTitle>
            <CardDescription>
              Average: {stats.gradeAverages.mathematics > 0 ? stats.gradeAverages.mathematics.toFixed(2) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GradeHistogram data={stats.gradeDistributions.mathematicsGrades} title="Mathematics Grades" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Native Language Grade Distribution</CardTitle>
            <CardDescription>
              Average: {stats.gradeAverages.nativeLanguage > 0 ? stats.gradeAverages.nativeLanguage.toFixed(2) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GradeHistogram data={stats.gradeDistributions.nativeLanguageGrades} title="Native Language Grades" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
