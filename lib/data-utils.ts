import Papa from "papaparse"

export interface StudentData {
  Judet: string
  Medie_en: number
  Nota_finala_ro: number
  Nota_finala_mate: number
  Nota_finala_lm: number
  Absent_ro: string
  Absent_mate: string
  Absent_lm: string
  Contestatie_ro: string
  Contestatie_mate: string
  Contestatie_lm: string
  [key: string]: any
}

export async function parseCSV(filePath: string): Promise<StudentData[]> {
  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`)
    }

    const csvText = await response.text()

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transform: (value: string, field: string) => {
          // Convert numeric fields
          if (["Medie_en", "Nota_finala_ro", "Nota_finala_mate", "Nota_finala_lm"].includes(field)) {
            const num = Number.parseFloat(value?.toString() || "0")
            return isNaN(num) ? 0 : num
          }
          return value?.toString() || ""
        },
        complete: (results: Papa.ParseResult<StudentData>) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors)
          }
          resolve(results.data || [])
        },
        error: (error: Error) => {
          reject(error)
        },
      })
    })
  } catch (error) {
    console.error(`Error parsing CSV ${filePath}:`, error)
    return []
  }
}

export function calculateYearStats(data: StudentData[]) {
  if (!data || data.length === 0) {
    return {
      totalStudents: 0,
      averageFinalGrade: 0,
      absenteeCount: 0,
      absenteePercentage: 0,
    }
  }

  const totalStudents = data.length
  const validGrades = data.filter((student) => student.Medie_en > 0)
  const averageFinalGrade =
    validGrades.length > 0 ? validGrades.reduce((sum, student) => sum + student.Medie_en, 0) / validGrades.length : 0

  // Count absentees (any subject)
  const absenteeCount = data.filter(
    (student) => student.Absent_ro === "Absent" || student.Absent_mate === "Absent" || student.Absent_lm === "Absent",
  ).length

  const absenteePercentage = totalStudents > 0 ? (absenteeCount / totalStudents) * 100 : 0

  return {
    totalStudents,
    averageFinalGrade,
    absenteeCount,
    absenteePercentage,
  }
}

export function calculateDetailedStats(data: StudentData[]) {
  if (!data || data.length === 0) {
    return {
      totalStudents: 0,
      averageFinalGrade: 0,
      absentStats: {
        romanian: { count: 0, percentage: 0 },
        mathematics: { count: 0, percentage: 0 },
        nativeLanguage: { count: 0, percentage: 0 },
      },
      gradeAverages: {
        romanian: 0,
        mathematics: 0,
        nativeLanguage: 0,
      },
      contestations: {
        total: 0,
        increased: 0,
        decreased: 0,
      },
      gradeDistributions: {
        finalGrades: [],
        romanianGrades: [],
        mathematicsGrades: [],
        nativeLanguageGrades: [],
      },
    }
  }

  const totalStudents = data.length

  // Calculate averages for valid grades only
  const validFinalGrades = data.filter((student) => student.Medie_en > 0)
  const validRomanianGrades = data.filter((student) => student.Nota_finala_ro > 0)
  const validMathGrades = data.filter((student) => student.Nota_finala_mate > 0)
  const validNativeGrades = data.filter((student) => student.Nota_finala_lm > 0)

  const averageFinalGrade =
    validFinalGrades.length > 0
      ? validFinalGrades.reduce((sum, student) => sum + student.Medie_en, 0) / validFinalGrades.length
      : 0

  const averageRomanian =
    validRomanianGrades.length > 0
      ? validRomanianGrades.reduce((sum, student) => sum + student.Nota_finala_ro, 0) / validRomanianGrades.length
      : 0

  const averageMathematics =
    validMathGrades.length > 0
      ? validMathGrades.reduce((sum, student) => sum + student.Nota_finala_mate, 0) / validMathGrades.length
      : 0

  const averageNativeLanguage =
    validNativeGrades.length > 0
      ? validNativeGrades.reduce((sum, student) => sum + student.Nota_finala_lm, 0) / validNativeGrades.length
      : 0

  // Calculate absence statistics
  const romanianAbsent = data.filter((student) => student.Absent_ro === "Absent").length
  const mathematicsAbsent = data.filter((student) => student.Absent_mate === "Absent").length
  const nativeLanguageAbsent = data.filter((student) => student.Absent_lm === "Absent").length

  // Calculate contestations
  let totalContestations = 0
  let increasedContestations = 0
  let decreasedContestations = 0

  data.forEach((student) => {
    ;["Contestatie_ro", "Contestatie_mate", "Contestatie_lm"].forEach((field) => {
      const contestation = student[field]?.toString() || ""
      if (contestation.trim() !== "") {
        totalContestations++
        if (contestation.includes("+") || contestation.toLowerCase().includes("increase")) {
          increasedContestations++
        } else if (contestation.includes("-") || contestation.toLowerCase().includes("decrease")) {
          decreasedContestations++
        }
      }
    })
  })

  // Prepare grade distributions
  const finalGrades = validFinalGrades.map((student) => student.Medie_en)
  const romanianGrades = validRomanianGrades.map((student) => student.Nota_finala_ro)
  const mathematicsGrades = validMathGrades.map((student) => student.Nota_finala_mate)
  const nativeLanguageGrades = validNativeGrades.map((student) => student.Nota_finala_lm)

  return {
    totalStudents,
    averageFinalGrade,
    absentStats: {
      romanian: {
        count: romanianAbsent,
        percentage: totalStudents > 0 ? (romanianAbsent / totalStudents) * 100 : 0,
      },
      mathematics: {
        count: mathematicsAbsent,
        percentage: totalStudents > 0 ? (mathematicsAbsent / totalStudents) * 100 : 0,
      },
      nativeLanguage: {
        count: nativeLanguageAbsent,
        percentage: totalStudents > 0 ? (nativeLanguageAbsent / totalStudents) * 100 : 0,
      },
    },
    gradeAverages: {
      romanian: averageRomanian,
      mathematics: averageMathematics,
      nativeLanguage: averageNativeLanguage,
    },
    contestations: {
      total: totalContestations,
      increased: increasedContestations,
      decreased: decreasedContestations,
    },
    gradeDistributions: {
      finalGrades,
      romanianGrades,
      mathematicsGrades,
      nativeLanguageGrades,
    },
  }
}

export function getUniqueCounties(data: StudentData[]): string[] {
  if (!data || data.length === 0) return []

  const counties = [...new Set(data.map((student) => student.Judet?.toString() || ""))]
  return counties.filter((county) => county.trim() !== "").sort()
}
