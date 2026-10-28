"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GradeHistogram } from "@/components/grade-histogram"
import {
  calculateSchoolStats,
  getSchoolsForCounty,
  parseStudentsForSchool,
  type SchoolStats,
} from "@/lib/data-utils"
import { RomaniaMap } from "@/components/romania-map"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { removeRomanianDiacritics } from "@/lib/utils"
import { fetchGeneratedData, type GeneratedDataIndex, type SchoolDirectoryEntry } from "@/lib/generated-data"

export default function CautaScoalaPage() {
  const [allSchools, setAllSchools] = useState<SchoolDirectoryEntry[]>([])
  const [counties, setCounties] = useState<string[]>([])
  const [dataIndex, setDataIndex] = useState<GeneratedDataIndex | null>(null)
  const [schoolsForCounty, setSchoolsForCounty] = useState<SchoolDirectoryEntry[]>([])
  const [selectedCounty, setSelectedCounty] = useState<string>("")
  const [selectedSchool, setSelectedSchool] = useState<SchoolDirectoryEntry | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [schoolSearchTerm, setSchoolSearchTerm] = useState<string>("")
  const [filteredSchools, setFilteredSchools] = useState<SchoolDirectoryEntry[]>([])
  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingSchoolStats, setLoadingSchoolStats] = useState(false)
  const [schoolStatsError, setSchoolStatsError] = useState<string | null>(null)
  const availableYears = dataIndex?.years.slice().reverse() ?? []

  useEffect(() => {
    const loadDirectory = async () => {
      try {
        setLoading(true)
        setError(null)
        const [index, schools] = await Promise.all([
          fetchGeneratedData<GeneratedDataIndex>("/generated/index.json"),
          fetchGeneratedData<SchoolDirectoryEntry[]>("/generated/schools.json"),
        ])
        setDataIndex(index)
        setCounties(index.counties)
        setSelectedYear(index.years.at(-1) ?? "")
        setAllSchools(schools)
      } catch (error) {
        console.error("Unable to load the school directory:", error)
        setError("Nu s-au putut încărca datele școlilor. Verificați dacă datele generate sunt disponibile.")
      } finally {
        setLoading(false)
      }
    }

    loadDirectory()
  }, [])

  // Actualizează lista de școli când se schimbă județul
  useEffect(() => {
    if (selectedCounty && allSchools.length > 0) {
      const schools = getSchoolsForCounty(allSchools, selectedCounty)
      // const schools = allSchools
      setSchoolsForCounty(schools)
      setSelectedSchool(null)
      setSchoolSearchTerm("")
      setFilteredSchools([])
    } else {
      setSchoolsForCounty([])
      setSelectedSchool(null)
      setSchoolSearchTerm("")
      setFilteredSchools([])
    }
  }, [selectedCounty, allSchools])

  // Filtrează școlile pe baza termenului de căutare
  useEffect(() => {
    if (!selectedSchool && schoolSearchTerm.length >= 2) {
      const filtered = schoolsForCounty.filter((school) =>
        removeRomanianDiacritics(school.Denumire).toLowerCase().includes(removeRomanianDiacritics(schoolSearchTerm).toLowerCase()),
      )
      setFilteredSchools(filtered.slice(0, 10)) // Limitează la 10 sugestii
    } else {
      setFilteredSchools([])
    }
  }, [schoolSearchTerm, schoolsForCounty, selectedSchool])

  useEffect(() => {
    let cancelled = false
    if (!selectedSchool || !selectedYear) {
      setSchoolStats(null)
      setLoadingSchoolStats(false)
      setSchoolStatsError(null)
      return
    }

    const loadSchoolStats = async () => {
      setSchoolStats(null)
      setSchoolStatsError(null)
      setLoadingSchoolStats(true)
      try {
        const students = await parseStudentsForSchool(`/${selectedYear}.csv`, selectedSchool.Cod)
        if (!cancelled) {
          setSchoolStats(calculateSchoolStats(students, selectedSchool.Denumire, selectedYear))
        }
      } catch (error) {
        console.error(`Unable to load records for ${selectedSchool.Cod} in ${selectedYear}:`, error)
        if (!cancelled) setSchoolStatsError("Nu s-au putut încărca datele pentru această școală.")
      } finally {
        if (!cancelled) setLoadingSchoolStats(false)
      }
    }

    loadSchoolStats()
    return () => {
      cancelled = true
    }
  }, [selectedSchool, selectedYear])

  const handleCountySelect = (county: string) => {
    setSelectedCounty(county)
  }

  const handleSchoolSelect = (school: SchoolDirectoryEntry) => {
    setSelectedSchool(school)
    setSchoolSearchTerm(school.Denumire)
    setFilteredSchools([]) // Această linie există deja și este corectă
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Se încarcă datele...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Caută Școala Ta</CardTitle>
          <CardDescription>Găsește statisticile detaliate pentru școala ta din examenul național</CardDescription>
        </CardHeader>
      </Card>

      {/* Controale de căutare */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Selecția județului și harta */}
        <Card>
          <CardHeader>
            <CardTitle>Selectează Județul</CardTitle>
            <CardDescription>Alege județul în care se află școala</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger>
                <SelectValue placeholder="Selectează județul" />
              </SelectTrigger>
              <SelectContent>
                {counties.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {counties.length > 0 && (
              <div className="mt-4">
                <RomaniaMap
                  selectedCounty={selectedCounty}
                  onCountySelect={handleCountySelect}
                  availableCounties={counties}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Căutarea școlii */}
        <Card>
          <CardHeader>
            <CardTitle>Caută Școala</CardTitle>
            <CardDescription>Introdu numele școlii pentru a vedea sugestii</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Introdu numele școlii..."
                value={schoolSearchTerm}
                onChange={(e) => {
                  setSelectedSchool(null)
                  setSchoolSearchTerm(e.target.value)
                }}
                onBlur={() => {
                  // Întârzie puțin închiderea pentru a permite click-ul pe opțiuni
                  setTimeout(() => setFilteredSchools([]), 200)
                }}
                onFocus={() => {
                  // Reafișează sugestiile dacă există text și nu e selectată o școală
                  if (schoolSearchTerm.length >= 2 && !selectedSchool) {
                    const filtered = schoolsForCounty.filter((school) =>
                      removeRomanianDiacritics(school.Denumire)
                        .toLowerCase()
                        .includes(removeRomanianDiacritics(schoolSearchTerm).toLowerCase()),
                    )
                    setFilteredSchools(filtered.slice(0, 10))
                  }
                }}
                disabled={!selectedCounty}
              />

              {filteredSchools.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredSchools.map((school, index) => (
                    <button
                      key={index}
                      className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      onClick={() => handleSchoolSelect(school)}
                      onMouseDown={(e) => e.preventDefault()} // Previne blur-ul înainte de click
                    >
                      <div className="font-medium">{school.Denumire}</div>
                      <div className="text-sm text-muted-foreground">{school.Localitate}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSchool && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Școala selectată:</p>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedSchool.Denumire}</p>
                  <p className="text-sm text-muted-foreground">{selectedSchool.Localitate}</p>
                  <p className="text-xs text-muted-foreground">Cod SIIIR: {selectedSchool.Cod}</p>
                </div>

                <div className="pt-2">
                  <label className="text-sm font-medium">Selectează anul:</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {loadingSchoolStats && (
        <div className="text-center text-muted-foreground">Se încarcă datele pentru școala selectată...</div>
      )}
      {schoolStatsError && (
        <Alert>
          <AlertDescription>{schoolStatsError}</AlertDescription>
        </Alert>
      )}

      {/* Statisticile școlii */}
      {schoolStats && (
        <div className="space-y-6">
          {/* Statistici generale */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Număr Total Studenți</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schoolStats.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rata de Promovabilitate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schoolStats.passRate.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Medie Finală</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {schoolStats.averageFinalGrade > 0 ? schoolStats.averageFinalGrade.toFixed(2) : "N/A"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Note de 10</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schoolStats.perfect10sTotal}</div>
              </CardContent>
            </Card>
          </div>

          {/* Note maxime și minime */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Nota cea mai mare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {schoolStats.highestGrade > 0 ? schoolStats.highestGrade.toFixed(2) : "N/A"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Nota cea mai mică</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {schoolStats.lowestGrade > 0 ? schoolStats.lowestGrade.toFixed(2) : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medii pe materii */}
          <Card>
            <CardHeader>
              <CardTitle>Medii pe Materii</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Română</h4>
                  <div className="text-2xl font-bold">
                    {schoolStats.gradeAverages.romanian > 0 ? schoolStats.gradeAverages.romanian.toFixed(2) : "N/A"}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Matematică</h4>
                  <div className="text-2xl font-bold">
                    {schoolStats.gradeAverages.mathematics > 0
                      ? schoolStats.gradeAverages.mathematics.toFixed(2)
                      : "N/A"}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Limba Maternă</h4>
                  <div className="text-2xl font-bold">
                    {schoolStats.gradeAverages.nativeLanguage > 0
                      ? schoolStats.gradeAverages.nativeLanguage.toFixed(2)
                      : "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histograme pentru distribuția notelor */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuția Notelor Finale</CardTitle>
                <CardDescription>
                  Medie: {schoolStats.averageFinalGrade > 0 ? schoolStats.averageFinalGrade.toFixed(2) : "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GradeHistogram
                  data={schoolStats.students
                    .filter((student) => typeof student.Medie_en === "number" && student.Medie_en > 0)
                    .map((student) => student.Medie_en)}
                  title="Note Finale"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuția Notelor la Română</CardTitle>
                <CardDescription>
                  Medie:{" "}
                  {schoolStats.gradeAverages.romanian > 0 ? schoolStats.gradeAverages.romanian.toFixed(2) : "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GradeHistogram
                  data={schoolStats.students
                    .filter((student) => typeof student.Fin_ro === "number" && student.Fin_ro > 0)
                    .map((student) => student.Fin_ro as number)}
                  title="Note Română"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuția Notelor la Matematică</CardTitle>
                <CardDescription>
                  Medie:{" "}
                  {schoolStats.gradeAverages.mathematics > 0 ? schoolStats.gradeAverages.mathematics.toFixed(2) : "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GradeHistogram
                  data={schoolStats.students
                    .filter((student) => typeof student.Fin_mate === "number" && student.Fin_mate > 0)
                    .map((student) => student.Fin_mate as number)}
                  title="Note Matematică"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuția Notelor la Limba Maternă</CardTitle>
                <CardDescription>
                  Medie:{" "}
                  {schoolStats.gradeAverages.nativeLanguage > 0
                    ? schoolStats.gradeAverages.nativeLanguage.toFixed(2)
                    : "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GradeHistogram
                  data={schoolStats.students
                    .filter((student) => typeof student.Fin_lm === "number" && student.Fin_lm > 0)
                    .map((student) => student.Fin_lm as number)}
                  title="Note Limba Maternă"
                />
              </CardContent>
            </Card>
          </div>

          {/* Tabel cu toți studenții */}
          <Card>
            <CardHeader>
              <CardTitle>Toți Studenții din {selectedYear}</CardTitle>
              <CardDescription>Lista completă a studenților de la {selectedSchool?.Denumire ?? schoolStats.schoolName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cod</TableHead>
                      <TableHead>Sex</TableHead>
                      <TableHead>Mediu</TableHead>
                      <TableHead>Medie Finală</TableHead>
                      <TableHead>Nota Română</TableHead>
                      <TableHead>Nota Matematică</TableHead>
                      <TableHead>Limba Maternă</TableHead>
                      <TableHead>Nota Limba Maternă</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolStats.students
                      .sort((a, b) => {
                        const gradeA = typeof a.Medie_en === "number" ? a.Medie_en : 0
                        const gradeB = typeof b.Medie_en === "number" ? b.Medie_en : 0
                        return gradeB - gradeA // Sortare descrescătoare
                      })
                      .map((student, index) => {
                        // Determină statusul de promovare
                        const finalGrade = typeof student.Medie_en === "number" ? student.Medie_en : 0
                        const finalRo = typeof student.Fin_ro === "number" ? student.Fin_ro : 0
                        const finalMate = typeof student.Fin_mate === "number" ? student.Fin_mate : 0
                        const finalLm = typeof student.Fin_lm === "number" ? student.Fin_lm : 0

                        const passedOverall = finalGrade >= 5
                        const passedRomanian = finalRo >= 5
                        const passedMathematics = finalMate >= 5
                        let passedNativeLanguage = true
                        if (student.Lb_mat !== "-") {
                          passedNativeLanguage = finalLm >= 5
                        }

                        const isPromoted = passedOverall && passedRomanian && passedMathematics && passedNativeLanguage

                        return (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">{student.Cod}</TableCell>
                            <TableCell>{student.Sex}</TableCell>
                            <TableCell>{student.Mediu}</TableCell>
                            <TableCell className="font-semibold">
                              {finalGrade > 0 ? finalGrade.toFixed(2) : "N/A"}
                            </TableCell>
                            <TableCell>{student.Fin_ro === "-" ? "Absent" : finalRo.toFixed(2)}</TableCell>
                            <TableCell>{student.Fin_mate === "-" ? "Absent" : finalMate.toFixed(2)}</TableCell>
                            <TableCell>{student.Lb_mat === "-" ? "N/A" : student.Lb_mat}</TableCell>
                            <TableCell>
                              {student.Lb_mat === "-" ? "N/A" : student.Fin_lm === "-" ? "Absent" : finalLm.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isPromoted
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                              >
                                {isPromoted ? "Promovat" : "Nepromovat"}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mesaj când nu sunt găsiți studenți pentru școala selectată */}
      {selectedSchool && selectedYear && schoolStats && schoolStats.totalStudents === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>
                Nu s-au găsit studenți pentru {selectedSchool.Denumire} în anul {selectedYear}.
              </p>
              <p className="text-sm mt-2">
                Încercați să selectați un alt an sau verificați dacă școala a participat la examen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mesaj când nu este selectată nicio școală */}
      {!selectedSchool && selectedCounty && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>Selectează o școală pentru a vedea statisticile detaliate.</p>
              <p className="text-sm mt-2">
                Introdu cel puțin 2 caractere în câmpul de căutare pentru a vedea sugestii.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mesaj când nu este selectat niciun județ */}
      {!selectedCounty && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>Selectează mai întâi un județ pentru a putea căuta școli.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
