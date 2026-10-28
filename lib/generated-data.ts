import type { OverviewYearMetric, SchoolInfo } from "./data-utils"
import { getAssetPath } from "./path-utils"

export interface GeneratedDataIndex {
  years: string[]
  counties: string[]
  countiesByYear: Record<string, string[]>
}

export interface GeneratedOverviewData {
  counties: string[]
  metricsByCounty: Record<string, OverviewYearMetric[]>
}

export interface GeneratedYearStatistics {
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
  perfect10sTotal: number
  perfect10sRomanian: number
  perfect10sMathematics: number
  highestGrade: number
  lowestGrade: number
}

export interface GeneratedYearData {
  counties: string[]
  statsByCounty: Record<string, GeneratedYearStatistics>
}

export type SchoolDirectoryEntry = Pick<SchoolInfo, "Cod" | "Denumire" | "Localitate" | "Judet">

export async function fetchGeneratedData<T>(path: string): Promise<T> {
  const response = await fetch(getAssetPath(path))
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`)
  }
  return response.json()
}
