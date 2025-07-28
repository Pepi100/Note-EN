import Papa from "papaparse"
import { getAssetPath } from "./path-utils"

export interface StudentData {
  Cod: string
  Sex: string
  Mediu: string
  Judet: string
  SIIIR: string
  Nota_ro: number
  Con_ro: string // Contestatie_ro
  Fin_ro: number | string // Nota_finala_ro
  Nota_mate: number
  Con_mate: string // Contestatie_mate
  Fin_mate: number | string // Nota_finala_mate
  Lb_mat: string // Limba_materna
  Nota_lm: number
  Con_lm: string // Contestatie_lm
  Fin_lm: number | string // Nota_finala_lm
  Medie_en: number
  Medie_5_8: number // Medie_5-8
  Admitere: number
  [key: string]: any // Keep for flexibility with other columns
}

export async function parseCSV(filePath: string): Promise<StudentData[]> {
  try {
    const fullPath = getAssetPath(filePath)
    console.log(`Attempting to fetch: ${fullPath}`)

    const response = await fetch(fullPath, {
      headers: {
        Accept: "text/csv,text/plain,*/*",
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch ${fullPath}: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch ${fullPath}: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()
    console.log(`CSV text length: ${csvText.length}`)

    if (csvText.length === 0) {
      throw new Error(`CSV file ${filePath} is empty`)
    }

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (header: string) => {
          // Map new CSV headers to internal interface names if necessary
          // For "Medie_5-8" to "Medie_5_8"
          if (header === "Medie_5-8") return "Medie_5_8"
          return header // Use header as is for others
        },
        transform: (value: string, field: string) => {
          // Fields that can be '-' but should be numbers if not '-'
          if (["Fin_ro", "Fin_mate", "Fin_lm"].includes(field)) {
            if (value === "-") {
              return "-" // Keep as string if it's '-'
            }
            const num = Number.parseFloat(value?.toString() || "0")
            return isNaN(num) ? 0 : num // Parse as number otherwise
          }
          // Fields that are always numbers (initial grades, final average, new numeric fields)
          if (["Nota_ro", "Nota_mate", "Nota_lm", "Medie_en", "Medie_5_8", "Admitere"].includes(field)) {
            const num = Number.parseFloat(value?.toString() || "0")
            return isNaN(num) ? 0 : num
          }
          // All other fields (Cod, Sex, Mediu, Judet, SIIIR, Con_ro, Con_mate, Con_lm, Lb_mat) are strings
          return value?.toString() || ""
        },
        complete: (results: Papa.ParseResult<StudentData>) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors)
          }
          console.log(`Parsed ${results.data.length} rows`)
          resolve(results.data || [])
        },
        error: (error: Error) => {
          console.error("CSV parsing error:", error)
          reject(error)
        },
      })
    })
  } catch (error) {
    console.error(`Error parsing CSV ${filePath}:`, error)
    throw error
  }
}

// This function is for the simplified stats on the overview page (old behavior)
export function calculateYearStats(data: StudentData[]) {
  console.log(`Calculating stats for ${data.length} students`)

  if (!data || data.length === 0) {
    return {
      totalStudents: 0,
      averageFinalGrade: 0,
      absenteeCount: 0,
      absenteePercentage: 0,
    }
  }

  const totalStudents = data.length
  const validGrades = data.filter((student) => typeof student.Medie_en === "number" && student.Medie_en > 0)
  const averageFinalGrade =
    validGrades.length > 0 ? validGrades.reduce((sum, student) => sum + student.Medie_en, 0) / validGrades.length : 0

  // Count absentees (any subject) - this is for the overview page, using the old logic for simplicity
  // The detailed page will use the new logic
  const absenteeCount = data.filter(
    (student) => student.Con_ro !== "-" || student.Con_mate !== "-" || student.Con_lm !== "-",
  ).length

  const absenteePercentage = totalStudents > 0 ? (absenteeCount / totalStudents) * 100 : 0

  const stats = {
    totalStudents,
    averageFinalGrade,
    absenteeCount,
    absenteePercentage,
  }

  console.log("Calculated stats:", stats)
  return stats
}

// New interface for metrics needed on the overview page charts
export interface OverviewYearMetric {
  year: string
  totalStudents: number
  averageFinalGrade: number
  averageRomanian: number
  averageMathematics: number
  perfect10sTotal: number
  perfect10sRomanian: number
  perfect10sMathematics: number
  totalContestations: number
  totalAbsentees: number
}

// New function to get detailed metrics for overview charts
export function getOverviewYearMetrics(data: StudentData[], year: string): OverviewYearMetric {
  if (!data || data.length === 0) {
    return {
      year,
      totalStudents: 0,
      averageFinalGrade: 0,
      averageRomanian: 0,
      averageMathematics: 0,
      perfect10sTotal: 0,
      perfect10sRomanian: 0,
      perfect10sMathematics: 0,
      totalContestations: 0,
      totalAbsentees: 0,
    }
  }

  const totalStudents = data.length

  // Averages
  const validFinalGrades = data.filter((student) => typeof student.Medie_en === "number" && student.Medie_en > 0)
  const validRomanianGrades = data.filter((student) => typeof student.Fin_ro === "number" && student.Fin_ro > 0)
  const validMathGrades = data.filter((student) => typeof student.Fin_mate === "number" && student.Fin_mate > 0)

  const averageFinalGrade =
    validFinalGrades.length > 0
      ? validFinalGrades.reduce((sum, student) => sum + student.Medie_en, 0) / validFinalGrades.length
      : 0
  const averageRomanian =
    validRomanianGrades.length > 0
      ? validRomanianGrades.reduce((sum, student) => sum + (student.Fin_ro as number), 0) / validRomanianGrades.length
      : 0
  const averageMathematics =
    validMathGrades.length > 0
      ? validMathGrades.reduce((sum, student) => sum + (student.Fin_mate as number), 0) / validMathGrades.length
      : 0

  // Perfect 10s
  const perfect10sTotal = data.filter(
    (student) => typeof student.Medie_en === "number" && student.Medie_en === 10,
  ).length
  const perfect10sRomanian = data.filter(
    (student) => typeof student.Fin_ro === "number" && student.Fin_ro === 10,
  ).length
  const perfect10sMathematics = data.filter(
    (student) => typeof student.Fin_mate === "number" && student.Fin_mate === 10,
  ).length

  // Contestations
  let totalContestations = 0
  data.forEach((student) => {
    if (student.Con_ro !== "-" && student.Con_ro !== "" && student.Con_ro != null) {
      totalContestations++
    }
    if (student.Con_mate !== "-" && student.Con_mate !== "" && student.Con_mate != null) {
      totalContestations++
    }
    if (student.Con_lm !== "-" && student.Con_lm !== "" && student.Con_lm != null) {
      totalContestations++
    }
  })

  // Absentees (reusing logic from calculateDetailedStats)
  let totalAbsenteesAnySubject = 0
  data.forEach((student) => {
    const isAbsentRomanian = student.Fin_ro === "-"
    const isAbsentMathematics = student.Fin_mate === "-"
    const isAbsentNativeLanguage = student.Fin_lm === "-" && student.Lb_mat !== "-" // Only count if they had to take it

    if (isAbsentRomanian || isAbsentMathematics || isAbsentNativeLanguage) {
      totalAbsenteesAnySubject++
    }
  })

  return {
    year,
    totalStudents,
    averageFinalGrade,
    averageRomanian,
    averageMathematics,
    perfect10sTotal,
    perfect10sRomanian,
    perfect10sMathematics,
    totalContestations,
    totalAbsentees: totalAbsenteesAnySubject,
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
        nativeLanguage: { count: 0, percentage: 0, totalTaking: 0 },
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
      totalAbsenteesAnySubject: 0, // New property
    }
  }

  const totalStudents = data.length

  // Calculate averages for valid grades only
  // Filter out students where Fin_X is '-' or 0 (if 0 means invalid/absent)
  const validFinalGrades = data.filter((student) => typeof student.Medie_en === "number" && student.Medie_en > 0)
  const validRomanianGrades = data.filter((student) => typeof student.Fin_ro === "number" && student.Fin_ro > 0)
  const validMathGrades = data.filter((student) => typeof student.Fin_mate === "number" && student.Fin_mate > 0)
  const validNativeGrades = data.filter((student) => typeof student.Fin_lm === "number" && student.Fin_lm > 0)

  const averageFinalGrade =
    validFinalGrades.length > 0
      ? validFinalGrades.reduce((sum, student) => sum + student.Medie_en, 0) / validFinalGrades.length
      : 0

  const averageRomanian =
    validRomanianGrades.length > 0
      ? validRomanianGrades.reduce((sum, student) => sum + (student.Fin_ro as number), 0) / validRomanianGrades.length
      : 0

  const averageMathematics =
    validMathGrades.length > 0
      ? validMathGrades.reduce((sum, student) => sum + (student.Fin_mate as number), 0) / validMathGrades.length
      : 0

  const averageNativeLanguage =
    validNativeGrades.length > 0
      ? validNativeGrades.reduce((sum, student) => sum + (student.Fin_lm as number), 0) / validNativeGrades.length
      : 0

  // Calculate absence statistics based on new rules
  const romanianAbsent = data.filter((student) => student.Fin_ro === "-").length
  const mathematicsAbsent = data.filter((student) => student.Fin_mate === "-").length

  // New logic for Native Language Absentees
  const studentsTakingNativeLanguage = data.filter((student) => student.Lb_mat !== "-").length
  const nativeLanguageAbsent = data.filter((student) => student.Fin_lm === "-" && student.Lb_mat !== "-").length

  // Calculate total absentees for the card
  let totalAbsenteesAnySubject = 0
  data.forEach((student) => {
    const isAbsentRomanian = student.Fin_ro === "-"
    const isAbsentMathematics = student.Fin_mate === "-"
    const isAbsentNativeLanguage = student.Fin_lm === "-" && student.Lb_mat !== "-" // Only count if they had to take it

    if (isAbsentRomanian || isAbsentMathematics || isAbsentNativeLanguage) {
      totalAbsenteesAnySubject++
    }
  })

  // Calculate contestations based on new logic - count any non-"-" value
  let totalContestations = 0
  let increasedContestations = 0
  let decreasedContestations = 0

  data.forEach((student) => {
    // Romanian Contestations - count if Con_ro is not "-"
    if (student.Con_ro !== "-" && student.Con_ro !== "" && student.Con_ro != null) {
      totalContestations++
      // Only compare grades if both initial and final are valid numbers
      const initialRo = typeof student.Nota_ro === "number" ? student.Nota_ro : 0
      const finalRo = typeof student.Fin_ro === "number" ? student.Fin_ro : 0

      if (finalRo > 0 && initialRo > 0) {
        if (finalRo > initialRo) {
          increasedContestations++
        } else if (finalRo < initialRo) {
          decreasedContestations++
        }
      }
    }

    // Mathematics Contestations - count if Con_mate is not "-"
    if (student.Con_mate !== "-" && student.Con_mate !== "" && student.Con_mate != null) {
      totalContestations++
      // Only compare grades if both initial and final are valid numbers
      const initialMate = typeof student.Nota_mate === "number" ? student.Nota_mate : 0
      const finalMate = typeof student.Fin_mate === "number" ? student.Fin_mate : 0

      if (finalMate > 0 && initialMate > 0) {
        if (finalMate > initialMate) {
          increasedContestations++
        } else if (finalMate < initialMate) {
          decreasedContestations++
        }
      }
    }

    // Native Language Contestations - count if Con_lm is not "-"
    if (student.Con_lm !== "-" && student.Con_lm !== "" && student.Con_lm != null) {
      totalContestations++
      // Only compare grades if both initial and final are valid numbers
      const initialLm = typeof student.Nota_lm === "number" ? student.Nota_lm : 0
      const finalLm = typeof student.Fin_lm === "number" ? student.Fin_lm : 0

      if (finalLm > 0 && initialLm > 0) {
        if (finalLm > initialLm) {
          increasedContestations++
        } else if (finalLm < initialLm) {
          decreasedContestations++
        }
      }
    }
  })

  // Prepare grade distributions
  const finalGrades = validFinalGrades.map((student) => student.Medie_en)
  const romanianGrades = validRomanianGrades.map((student) => student.Fin_ro as number)
  const mathematicsGrades = validMathGrades.map((student) => student.Fin_mate as number)
  const nativeLanguageGrades = validNativeGrades.map((student) => student.Fin_lm as number)

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
        percentage: studentsTakingNativeLanguage > 0 ? (nativeLanguageAbsent / studentsTakingNativeLanguage) * 100 : 0,
        totalTaking: studentsTakingNativeLanguage,
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
    totalAbsenteesAnySubject, // New property
  }
}

export function getUniqueCounties(data: StudentData[]): string[] {
  if (!data || data.length === 0) return []

  const counties = [...new Set(data.map((student) => student.Judet?.toString() || ""))]
  return counties.filter((county) => county.trim() !== "").sort()
}
