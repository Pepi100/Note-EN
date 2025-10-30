"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  parseCSV, // Importă funcția parseCSV pentru a citi fișierul CSV
  type StudentData, // Importă tipul StudentData
  calculateDetailedStats, // Importă funcția calculateDetailedStats pentru a calcula statisticile detaliate
  getUniqueCounties, // Importă funcția getUniqueCounties pentru a extrage județele unice
} from "@/lib/data-utils"
import { GradeHistogram } from "@/components/grade-histogram"
import { RomaniaMap } from "@/components/romania-map"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


// Interfață pentru statisticile detaliate calculate de `calculateDetailedStats`
interface DetailedStats {
  totalStudents: number
  averageFinalGrade: number
  absentStats: {
    romanian: { count: number; percentage: number }
    mathematics: { count: number; percentage: number }
    nativeLanguage: { count: number; percentage: number; totalTaking: number }
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
  totalAbsenteesAnySubject: number
  passRate: number
}

interface YearPageClientProps {
  year: string
}

export default function YearPageClient({ year }: YearPageClientProps) {
  // Stochează toate datele brute pentru anul curent.
  const [data, setData] = useState<StudentData[]>([])
  // Stochează datele filtrate în funcție de județul selectat.
  const [filteredData, setFilteredData] = useState<StudentData[]>([])
  // Stochează statisticile detaliate calculate din `filteredData`.
  const [stats, setStats] = useState<DetailedStats | null>(null)
  // Stochează lista de județe unice disponibile în datele anului curent.
  const [counties, setCounties] = useState<string[]>([])
  // Stochează județul selectat curent de utilizator.
  const [selectedCounty, setSelectedCounty] = useState<string>("all")
  // Stare pentru a indica dacă datele sunt în curs de încărcare.
  const [loading, setLoading] = useState(true)
  // Stare pentru a stoca orice mesaj de eroare apărut în timpul încărcării datelor.
  const [error, setError] = useState<string | null>(null)

  /**
   * @useEffect
   * @description Acest `useEffect` este responsabil pentru încărcarea datelor CSV specifice anului.
   *              Rulează ori de câte ori prop-ul `year` se modifică.
   *              Apelează `parseCSV` pentru a citi fișierul CSV corespunzător anului.
   *              Populează stările `data`, `filteredData` și `counties`.
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Apelează funcția `parseCSV` din `lib/data-utils.ts` pentru a citi fișierul CSV al anului curent.
        const csvData = await parseCSV(`/${year}.csv`)

        if (csvData.length === 0) {
          setError(
            `Nu s-au găsit date pentru anul ${year}. Vă rugăm să verificați dacă fișierul CSV există și conține date valide.`,
          )
          return
        }

        setData(csvData)
        setFilteredData(csvData) // Inițial, datele filtrate sunt toate datele
        // Apelează funcția `getUniqueCounties` din `lib/data-utils.ts` pentru a extrage județele unice.
        setCounties(getUniqueCounties(csvData))
      } catch (error) {
        console.error(`Eroare la încărcarea datelor pentru ${year}:`, error)
        setError(
          `Nu s-au putut încărca datele pentru anul ${year}. Vă rugăm să verificați dacă fișierul CSV este disponibil și formatat corect.`,
        )
      } finally {
        setLoading(false)
      }
    }

    if (year) {
      loadData()
    }
  }, [year]) // Rulează când se schimbă anul

  /**
   * @useEffect
   * @description Acest `useEffect` este responsabil pentru filtrarea datelor și recalcularea statisticilor
   *              ori de câte ori `data` (datele brute) sau `selectedCounty` (județul selectat) se modifică.
   *              Filtrează `data` în funcție de `selectedCounty` și apoi apelează `calculateDetailedStats`.
   */
  useEffect(() => {
    if (data.length > 0) {
      // Filtrează datele în funcție de județul selectat
      const filtered = selectedCounty === "all" ? data : data.filter((student) => student.Judet === selectedCounty)
      setFilteredData(filtered)
      // Apelează funcția `calculateDetailedStats` din `lib/data-utils.ts` pentru a obține statisticile detaliate.
      setStats(calculateDetailedStats(filtered))
    }
  }, [data, selectedCounty]) // Rulează când se schimbă datele sau județul selectat

  /**
   * @function handleCountySelect
   * @description Funcție callback pentru a actualiza starea `selectedCounty` atunci când utilizatorul
   *              selectează un județ nou din dropdown sau face click pe hartă.
   * @param {string} county - Codul județului selectat.
   */
  const handleCountySelect = (county: string) => {
    setSelectedCounty(county)
  }

  // Afișează un mesaj de încărcare
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Se încarcă datele pentru anul {year}...</div>
      </div>
    )
  }

  // Afișează un mesaj de eroare
  if (error) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center">
          <p className="text-muted-foreground">
            Asigurați-vă că fișierul {year}.csv este plasat în directorul public/ și conține coloanele necesare.
          </p>
        </div>
      </div>
    )
  }

  // Afișează un mesaj dacă nu sunt date disponibile după încărcare/filtrare
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Nu sunt date disponibile pentru anul {year}</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {/* Header compact cu titlu, dropdown și hartă */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Titlu și controale */}
              <div className="space-y-4 lg:flex-1">
                <div>
                  <CardTitle className="text-3xl font-bold tracking-tight">Statistici {year}</CardTitle>
                  <CardDescription className="mt-2">Analiză detaliată a performanței studenților</CardDescription>
                </div>

                {/* Text explicativ și controale pentru județ */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Selectați județul</h4>
                    <p className="text-xs text-muted-foreground">
                      Filtrați datele după județ folosind dropdown-ul sau făcând click pe hartă
                    </p>
                  </div>

                  {counties.length > 0 && (
                    <div className="space-y-2">
                      <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                        <SelectTrigger className="w-full sm:w-64">
                          <SelectValue placeholder="Filtrați după județ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toate Județele</SelectItem>
                          {counties.map((county) => (
                            <SelectItem key={county} value={county}>
                              {county}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Buton Reset mai mic */}
                      {selectedCounty !== "all" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCounty("all")}
                          className="text-xs h-8"
                        >
                          Resetează Județul
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Hartă pe dreapta */}
              <div className="lg:w-80 xl:w-96 lg:flex-shrink-0">
                <RomaniaMap
                  selectedCounty={selectedCounty}
                  onCountySelect={setSelectedCounty}
                  availableCounties={counties}
                />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Număr Total Studenți</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Medie Finală</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageFinalGrade > 0 ? stats.averageFinalGrade.toFixed(2) : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contestații Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contestations.total}</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-xs text-muted-foreground mt-1">
                    +{stats.contestations.increased} / -{stats.contestations.decreased}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Numarul contestatiilor pentru care nota a crescut, respectiv scazut.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata de Promovabilitate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Absenți Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAbsenteesAnySubject}</div>
          </CardContent>
        </Card>
      </div>

      {/* Absence Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistici Absențe pe Materie</CardTitle>
          <CardDescription>Numărul și procentul studenților absenți pe materie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Română</h4>
              <div className="text-2xl font-bold">{stats.absentStats.romanian.count}</div>
              <div className="text-sm text-muted-foreground">
                {stats.absentStats.romanian.percentage.toFixed(1)}% absenți
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Matematică</h4>
              <div className="text-2xl font-bold">{stats.absentStats.mathematics.count}</div>
              <div className="text-sm text-muted-foreground">
                {stats.absentStats.mathematics.percentage.toFixed(1)}% absenți
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Limba Maternă</h4>
              <div className="text-2xl font-bold">{stats.absentStats.nativeLanguage.count}</div>
              <div className="text-sm text-muted-foreground">
                {stats.absentStats.nativeLanguage.percentage.toFixed(1)}% absenți
              </div>
              {stats.absentStats.nativeLanguage.totalTaking > 0 && (
                <div className="text-xs text-muted-foreground">
                  (din {stats.absentStats.nativeLanguage.totalTaking} studenți)
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Histograms */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuția Notelor Finale</CardTitle>
            <CardDescription>
              Medie: {stats.averageFinalGrade > 0 ? stats.averageFinalGrade.toFixed(2) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GradeHistogram data={stats.gradeDistributions.finalGrades} title="Note Finale" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuția Notelor la Română</CardTitle>
            <CardDescription>
              Medie: {stats.gradeAverages.romanian > 0 ? stats.gradeAverages.romanian.toFixed(2) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GradeHistogram data={stats.gradeDistributions.romanianGrades} title="Note Română" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuția Notelor la Matematică</CardTitle>
            <CardDescription>
              Medie: {stats.gradeAverages.mathematics > 0 ? stats.gradeAverages.mathematics.toFixed(2) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GradeHistogram data={stats.gradeDistributions.mathematicsGrades} title="Note Matematică" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuția Notelor la Limba Maternă</CardTitle>
            <CardDescription>
              Medie: {stats.gradeAverages.nativeLanguage > 0 ? stats.gradeAverages.nativeLanguage.toFixed(2) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GradeHistogram data={stats.gradeDistributions.nativeLanguageGrades} title="Note Limba Maternă" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
