"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchGeneratedData, type GeneratedDataIndex } from "@/lib/generated-data"

export default function GasesteLoculPage() {
  // State pentru inputurile utilizatorului
  const [notaRomana, setNotaRomana] = useState<string>("")
  const [notaMatematica, setNotaMatematica] = useState<string>("")
  const [notaLimbaMaterna, setNotaLimbaMaterna] = useState<string>("")
  const [selectedCounty, setSelectedCounty] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>("")

  const [dataIndex, setDataIndex] = useState<GeneratedDataIndex | null>(null)
  const [counties, setCounties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const availableYears = dataIndex?.years.slice().reverse() ?? []

  useEffect(() => {
    const loadIndex = async () => {
      try {
        const index = await fetchGeneratedData<GeneratedDataIndex>("/generated/index.json")
        setDataIndex(index)
        const latestYear = index.years.at(-1)
        setCounties(latestYear ? index.countiesByYear[latestYear] ?? [] : [])
        setSelectedYear(latestYear ?? "")
      } catch (error) {
        console.error("Unable to load the generated data index:", error)
        setError("Nu s-au putut încărca județele disponibile.")
      } finally {
        setLoading(false)
      }
    }

    loadIndex()
  }, [])

  // Funcție pentru validarea și formatarea notelor
  const handleGradeChange = (value: string, setter: (value: string) => void) => {
    // Permite doar numere cu maxim 2 zecimale
    const regex = /^\d*\.?\d{0,2}$/
    if (regex.test(value) || value === "") {
      const numValue = Number.parseFloat(value)
      if (value === "" || (numValue >= 0 && numValue <= 10)) {
        setter(value)
      }
    }
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
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Găsește-ți Locul</CardTitle>
          <CardDescription>Introdu notele tale și descoperă unde te-ai fi clasat în examenul național</CardDescription>
        </CardHeader>
      </Card>

      {/* Formularul de input */}
      <Card>
        <CardHeader>
          <CardTitle>Introdu Notele Tale</CardTitle>
          <CardDescription>Completează toate câmpurile pentru a vedea rezultatele</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Nota Română */}
            <div className="space-y-2">
              <Label htmlFor="nota-romana">Nota Română</Label>
              <Input
                id="nota-romana"
                type="text"
                placeholder="ex: 8.50"
                value={notaRomana}
                onChange={(e) => handleGradeChange(e.target.value, setNotaRomana)}
                className="text-center"
              />
              <p className="text-xs text-muted-foreground">Valoare între 0 și 10</p>
            </div>

            {/* Nota Matematică */}
            <div className="space-y-2">
              <Label htmlFor="nota-matematica">Nota Matematică</Label>
              <Input
                id="nota-matematica"
                type="text"
                placeholder="ex: 9.25"
                value={notaMatematica}
                onChange={(e) => handleGradeChange(e.target.value, setNotaMatematica)}
                className="text-center"
              />
              <p className="text-xs text-muted-foreground">Valoare între 0 și 10</p>
            </div>

            {/* Nota Limba Maternă */}
            <div className="space-y-2">
              <Label htmlFor="nota-limba-materna">Nota Limba Maternă</Label>
              <Input
                id="nota-limba-materna"
                type="text"
                placeholder="ex: 7.75"
                value={notaLimbaMaterna}
                onChange={(e) => handleGradeChange(e.target.value, setNotaLimbaMaterna)}
                className="text-center"
              />
              <p className="text-xs text-muted-foreground">Valoare între 0 și 10 (opțional)</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Selectarea județului */}
            <div className="space-y-2">
              <Label htmlFor="judet">Județul</Label>
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
            </div>

            {/* Selectarea anului */}
            <div className="space-y-2">
              <Label htmlFor="an">Anul</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Placeholder pentru rezultate */}
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p>Completează toate câmpurile pentru a vedea unde te-ai fi clasat.</p>
            <p className="text-sm mt-2">Funcționalitatea va fi implementată în curând.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
