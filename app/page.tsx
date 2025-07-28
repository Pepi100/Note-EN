"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  parseCSV, // Importă funcția parseCSV pentru a citi fișierele CSV
  getOverviewYearMetrics, // Importă funcția getOverviewYearMetrics pentru a calcula metricile anuale
  getUniqueCounties, // Importă funcția getUniqueCounties pentru a extrage județele unice
  type OverviewYearMetric, // Importă tipul OverviewYearMetric
  type StudentData, // Importă tipul StudentData
} from "@/lib/data-utils"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { CustomChartTooltip } from "@/components/custom-chart-tooltip" // Re-importă CustomChartTooltip
import { RomaniaMap } from "@/components/romania-map"
import { Button } from "@/components/ui/button"

export default function OverviewPage() {
  // Stochează toate datele brute, organizate pe ani.
  // Utilizată pentru a filtra datele în funcție de județul selectat fără a reîncărca fișierele.
  const [allDataByYear, setAllDataByYear] = useState<Record<string, StudentData[]>>({})
  // Stochează metricile agregate pe an, care sunt afișate în grafice.
  // Acestea sunt recalculate ori de câte ori se schimbă datele brute sau județul selectat.
  const [yearlyMetrics, setYearlyMetrics] = useState<OverviewYearMetric[]>([])
  // Stochează lista de județe unice disponibile în toate datele.
  // Utilizată pentru a popula dropdown-ul de selecție a județului și harta.
  const [counties, setCounties] = useState<string[]>([])
  // Stochează județul selectat curent de utilizator.
  // Valoarea implicită este "all" pentru a afișa datele pentru toate județele.
  const [selectedCounty, setSelectedCounty] = useState<string>("all")
  // Stare pentru a indica dacă datele sunt în curs de încărcare.
  const [loading, setLoading] = useState(true)
  // Stare pentru a stoca orice mesaj de eroare apărut în timpul încărcării datelor.
  const [error, setError] = useState<string | null>(null)
  // Stare pentru a stoca informații de depanare, utile pentru diagnosticarea problemelor.
  const [debugInfo, setDebugInfo] = useState<any[]>([])

  /**
   * @useEffect
   * @description Hook-ul `useEffect` este folosit pentru a încărca toate datele CSV la montarea componentei.
   *              Rulează o singură dată (datorită array-ului de dependențe gol `[]`).
   *              Apelează `parseCSV` pentru fiecare an din intervalul 2016-2025.
   *              Colectează toate datele pentru a extrage județele unice.
   */
  useEffect(() => {
    const loadAllYearData = async () => {
      try {
        setLoading(true)
        setError(null)
        const debug: any[] = []

        const years = []
        for (let i = 2016; i <= 2025; i++) {
          years.push(i.toString())
        }

        debug.push({
          currentURL: window.location.href,
          baseURL: window.location.origin,
          pathname: window.location.pathname,
          hostname: window.location.hostname,
        })

        const loadedData: Record<string, StudentData[]> = {}
        let allStudents: StudentData[] = [] // Colectează toți studenții pentru a găsi județele unice

        for (const year of years) {
          try {
            debug.push(`Se încarcă datele pentru anul ${year}...`)
            // Apelează funcția `parseCSV` din `lib/data-utils.ts` pentru a citi fișierul CSV al anului curent.
            const data = await parseCSV(`/${year}.csv`)
            debug.push(`S-au încărcat ${data.length} înregistrări pentru ${year}`)
            loadedData[year] = data
            allStudents = allStudents.concat(data) // Adaugă la lista generală de studenți
          } catch (error) {
            console.error(`Eroare la încărcarea datelor pentru ${year}:`, error)
            debug.push(`Eroare la încărcarea datelor pentru ${year}: ${error}`)
            loadedData[year] = [] // Asigură că anul există chiar dacă datele sunt goale
          }
        }

        setAllDataByYear(loadedData)
        // Apelează funcția `getUniqueCounties` din `lib/data-utils.ts` pentru a extrage județele unice din toate datele.
        setCounties(getUniqueCounties(allStudents))
        setDebugInfo(debug)

        const hasValidData = Object.values(loadedData).some((dataArray) => dataArray.length > 0)
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

    loadAllYearData()
  }, []) // Array de dependențe gol, rulează o singură dată la montare

  /**
   * @useEffect
   * @description Acest `useEffect` este responsabil pentru recalcularea metricilor anuale ori de câte ori
   *              `allDataByYear` (datele brute încărcate) sau `selectedCounty` (județul selectat) se modifică.
   *              Filtrează datele pentru fiecare an în funcție de județul selectat și apoi apelează
   *              `getOverviewYearMetrics` pentru a obține statisticile necesare graficelor.
   */
  useEffect(() => {
    if (Object.keys(allDataByYear).length > 0) {
      const years = Object.keys(allDataByYear).sort() // Asigură că anii sunt sortați
      const metrics: OverviewYearMetric[] = []

      for (const year of years) {
        const dataForYear = allDataByYear[year] || []
        // Filtrează datele anului curent în funcție de județul selectat
        const filteredDataForYear =
          selectedCounty === "all" ? dataForYear : dataForYear.filter((student) => student.Judet === selectedCounty)
        // Apelează funcția `getOverviewYearMetrics` din `lib/data-utils.ts` pentru a calcula metricile.
        metrics.push(getOverviewYearMetrics(filteredDataForYear, year))
      }
      setYearlyMetrics(metrics)
    }
  }, [allDataByYear, selectedCounty]) // Rulează când se schimbă datele încărcate sau județul selectat

  /**
   * @function handleCountySelect
   * @description Funcție callback pentru a actualiza starea `selectedCounty` atunci când utilizatorul
   *              selectează un județ nou din dropdown sau face click pe hartă.
   * @param {string} county - Codul județului selectat.
   */
  const handleCountySelect = (county: string) => {
    setSelectedCounty(county)
  }

  // Afișează un mesaj de încărcare în timpul preluării datelor
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Se încarcă statisticile...</div>
      </div>
    )
  }

  // Afișează un mesaj de eroare dacă a apărut o problemă la încărcarea datelor
  if (error) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            Asigurați-vă că fișierele CSV (ex: 2016.csv, ..., 2025.csv) sunt plasate în directorul public/.
          </p>
          <p className="text-sm text-muted-foreground">
            Verificați consola browserului și informațiile de depanare de mai jos pentru mai multe detalii.
          </p>
        </div>

        {/* Informații de depanare */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Informații de Depanare:</h3>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    )
  }

  // Verifică dacă există date de afișat după filtrare
  const hasData = yearlyMetrics.some((metric) => metric.totalStudents > 0)

  // Afișează un mesaj dacă nu există date deloc (chiar și pentru "Toate Județele")
  if (!hasData && selectedCounty === "all") {
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

        {/* Informații de depanare */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Informații de Depanare:</h3>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
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
                  <CardTitle className="text-3xl font-bold tracking-tight">
                    Prezentare Generală Statistici Studenți
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Analiză cuprinzătoare a performanței studenților pe parcursul mai multor ani
                  </CardDescription>
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

      {/* Afișează un mesaj dacă nu există date pentru județul selectat */}
      {!hasData && selectedCounty !== "all" && (
        <Alert>
          <AlertDescription>
            Nu s-au găsit date pentru județul selectat ({selectedCounty}) în niciunul dintre anii disponibili.
          </AlertDescription>
        </Alert>
      )}

      {/* Graficele de prezentare generală - se randează doar dacă există date de afișat */}
      {hasData && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Grafic: Număr Total Participanți */}
          <Card>
            <CardHeader>
              <CardTitle>Număr Total Participanți pe An</CardTitle>
              <CardDescription>Evoluția numărului de studenți înscriși la examen</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  totalStudents: {
                    label: "Număr Studenți",
                    color: "#2563eb",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      domain={["dataMin - 5000", "dataMax + 5000"]}
                    />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{ stroke: "#2563eb", strokeWidth: 1, strokeDasharray: "3 3" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalStudents"
                      stroke="#2563eb"
                      strokeWidth={3}
                      name="Total Studenți"
                      dot={{ fill: "#2563eb", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Grafic: Medie Generală și pe Materii */}
          <Card>
            <CardHeader>
              <CardTitle>Medie Generală și pe Materii pe An</CardTitle>
              <CardDescription>Evoluția mediilor finale la examen</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  averageFinalGrade: {
                    label: "Medie Generală",
                    color: "#2563eb",
                  },
                  averageRomanian: {
                    label: "Medie Română",
                    color: "#dc2626",
                  },
                  averageMathematics: {
                    label: "Medie Matematică",
                    color: "#16a34a",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={[5, 8]} />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{ stroke: "#666", strokeWidth: 1, strokeDasharray: "3 3" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="averageFinalGrade"
                      stroke="#2563eb"
                      strokeWidth={3}
                      name="Medie Generală"
                      dot={{ fill: "#2563eb", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="averageRomanian"
                      stroke="#dc2626"
                      strokeWidth={3}
                      name="Medie Română"
                      dot={{ fill: "#dc2626", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#b91c1c", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="averageMathematics"
                      stroke="#16a34a"
                      strokeWidth={3}
                      name="Medie Matematică"
                      dot={{ fill: "#16a34a", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#15803d", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Grafic: Număr de 10 Perfecte */}
          <Card>
            <CardHeader>
              <CardTitle>Număr de Note de 10 Perfecte pe An</CardTitle>
              <CardDescription>Evoluția numărului de note maxime obținute</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  perfect10sTotal: {
                    label: "Total 10",
                    color: "#7c3aed",
                  },
                  perfect10sRomanian: {
                    label: "10 Română",
                    color: "#dc2626",
                  },
                  perfect10sMathematics: {
                    label: "10 Matematică",
                    color: "#16a34a",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={[0, "dataMax + 500"]} />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{ stroke: "#666", strokeWidth: 1, strokeDasharray: "3 3" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="perfect10sTotal"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      name="Total 10"
                      dot={{ fill: "#7c3aed", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#6d28d9", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="perfect10sRomanian"
                      stroke="#dc2626"
                      strokeWidth={3}
                      name="10 Română"
                      dot={{ fill: "#dc2626", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#b91c1c", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="perfect10sMathematics"
                      stroke="#16a34a"
                      strokeWidth={3}
                      name="10 Matematică"
                      dot={{ fill: "#16a34a", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#15803d", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Grafic: Număr de Contestații */}
          <Card>
            <CardHeader>
              <CardTitle>Număr Total Contestații pe An</CardTitle>
              <CardDescription>Evoluția numărului de contestații înregistrate</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  totalContestations: {
                    label: "Număr Contestații",
                    color: "#ea580c",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={["dataMin - 4000", "dataMax + 4000"]} />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{ stroke: "#666", strokeWidth: 1, strokeDasharray: "3 3" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalContestations"
                      stroke="#ea580c"
                      strokeWidth={3}
                      name="Total Contestații"
                      dot={{ fill: "#ea580c", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#c2410c", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Grafic: Număr de Absenți */}
          <Card>
            <CardHeader>
              <CardTitle>Număr Total Absenți pe An</CardTitle>
              <CardDescription>Evoluția numărului de studenți absenți la examen</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  totalAbsentees: {
                    label: "Număr Absenți",
                    color: "#be123c",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} domain={["dataMin - 2000", "dataMax + 2000"]} />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{ stroke: "#666", strokeWidth: 1, strokeDasharray: "3 3" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalAbsentees"
                      stroke="#be123c"
                      strokeWidth={3}
                      name="Total Absenți"
                      dot={{ fill: "#be123c", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#9f1239", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
