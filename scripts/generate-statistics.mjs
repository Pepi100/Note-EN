import { createReadStream } from "node:fs"
import { mkdir, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import Papa from "papaparse"

const publicDirectory = path.join(process.cwd(), "public")
const generatedDirectory = path.join(publicDirectory, "generated")
const yearsDirectory = path.join(generatedDirectory, "years")
const years = (await readdir(publicDirectory))
  .map((fileName) => fileName.match(/^(\d{4})\.csv$/)?.[1])
  .filter(Boolean)
  .sort()

if (years.length === 0) {
  throw new Error(`No annual CSV files found in ${publicDirectory}`)
}

await mkdir(yearsDirectory, { recursive: true })

const overviewByCounty = { all: [] }
const countiesByYear = {}
const countySet = new Set()

function getValue(row, field) {
  return row[field] == null ? "" : String(row[field])
}

function getNumber(row, field) {
  const parsed = Number.parseFloat(getValue(row, field) || "0")
  return Number.isNaN(parsed) ? 0 : parsed
}

function getFinalGrade(row, field) {
  const value = getValue(row, field)
  if (value === "-") return "-"
  const parsed = Number.parseFloat(value || "0")
  return Number.isNaN(parsed) ? 0 : parsed
}

function createAccumulator() {
  return {
    totalStudents: 0,
    sumFinal: 0,
    countFinal: 0,
    sumRomanian: 0,
    countRomanian: 0,
    sumMathematics: 0,
    countMathematics: 0,
    sumNativeLanguage: 0,
    countNativeLanguage: 0,
    perfect10sTotal: 0,
    perfect10sRomanian: 0,
    perfect10sMathematics: 0,
    totalContestations: 0,
    increasedContestations: 0,
    decreasedContestations: 0,
    romanianAbsent: 0,
    mathematicsAbsent: 0,
    studentsTakingNativeLanguage: 0,
    nativeLanguageAbsent: 0,
    totalAbsenteesAnySubject: 0,
    promotedStudents: 0,
    highestGrade: 0,
    lowestGrade: Number.POSITIVE_INFINITY,
    finalGradeBins: Array(19).fill(0),
    romanianGradeBins: Array(19).fill(0),
    mathematicsGradeBins: Array(19).fill(0),
    nativeLanguageGradeBins: Array(19).fill(0),
  }
}

function addGradeToBins(bins, grade) {
  if (typeof grade !== "number" || grade <= 0) return

  const roundedGrade = Number.parseFloat(grade.toFixed(2))
  if (roundedGrade === 10) {
    bins[18]++
  } else if (roundedGrade >= 1 && roundedGrade < 10) {
    bins[Math.floor(roundedGrade * 2) - 2]++
  }
}

function countContestations(accumulator, row, initialField, contestationField, finalGrade) {
  const contestation = row[contestationField]
  if (contestation === "-" || contestation === "" || contestation == null) return

  accumulator.totalContestations++
  const initialGrade = getNumber(row, initialField)
  if (typeof finalGrade === "number" && finalGrade > 0 && initialGrade > 0) {
    if (finalGrade > initialGrade) accumulator.increasedContestations++
    if (finalGrade < initialGrade) accumulator.decreasedContestations++
  }
}

function addStudent(accumulator, row) {
  const finalGrade = getNumber(row, "Medie_en")
  const romanianGrade = getFinalGrade(row, "Fin_ro")
  const mathematicsGrade = getFinalGrade(row, "Fin_mate")
  const nativeLanguageGrade = getFinalGrade(row, "Fin_lm")
  const nativeLanguage = getValue(row, "Lb_mat")

  accumulator.totalStudents++
  if (finalGrade > 0) {
    accumulator.sumFinal += finalGrade
    accumulator.countFinal++
    accumulator.highestGrade = Math.max(accumulator.highestGrade, finalGrade)
    accumulator.lowestGrade = Math.min(accumulator.lowestGrade, finalGrade)
    addGradeToBins(accumulator.finalGradeBins, finalGrade)
  }

  if (typeof romanianGrade === "number" && romanianGrade > 0) {
    accumulator.sumRomanian += romanianGrade
    accumulator.countRomanian++
    addGradeToBins(accumulator.romanianGradeBins, romanianGrade)
  }
  if (typeof mathematicsGrade === "number" && mathematicsGrade > 0) {
    accumulator.sumMathematics += mathematicsGrade
    accumulator.countMathematics++
    addGradeToBins(accumulator.mathematicsGradeBins, mathematicsGrade)
  }
  if (typeof nativeLanguageGrade === "number" && nativeLanguageGrade > 0) {
    accumulator.sumNativeLanguage += nativeLanguageGrade
    accumulator.countNativeLanguage++
    addGradeToBins(accumulator.nativeLanguageGradeBins, nativeLanguageGrade)
  }

  if (finalGrade === 10) accumulator.perfect10sTotal++
  if (romanianGrade === 10) accumulator.perfect10sRomanian++
  if (mathematicsGrade === 10) accumulator.perfect10sMathematics++

  countContestations(accumulator, row, "Nota_ro", "Con_ro", romanianGrade)
  countContestations(accumulator, row, "Nota_mate", "Con_mate", mathematicsGrade)
  countContestations(accumulator, row, "Nota_lm", "Con_lm", nativeLanguageGrade)

  const isRomanianAbsent = romanianGrade === "-"
  const isMathematicsAbsent = mathematicsGrade === "-"
  const isNativeLanguageAbsent = nativeLanguageGrade === "-" && nativeLanguage !== "-"
  if (isRomanianAbsent) accumulator.romanianAbsent++
  if (isMathematicsAbsent) accumulator.mathematicsAbsent++
  if (nativeLanguage !== "-") accumulator.studentsTakingNativeLanguage++
  if (isNativeLanguageAbsent) accumulator.nativeLanguageAbsent++
  if (isRomanianAbsent || isMathematicsAbsent || isNativeLanguageAbsent) accumulator.totalAbsenteesAnySubject++

  const passedOverall = finalGrade >= 5
  const passedRomanian = romanianGrade >= 5
  const passedMathematics = mathematicsGrade >= 5
  const passedNativeLanguage = nativeLanguage === "-" || nativeLanguageGrade >= 5
  if (passedOverall && passedRomanian && passedMathematics && passedNativeLanguage) {
    accumulator.promotedStudents++
  }
}

function average(sum, count) {
  return count > 0 ? sum / count : 0
}

function overviewMetrics(accumulator, year) {
  return {
    year,
    totalStudents: accumulator.totalStudents,
    averageFinalGrade: average(accumulator.sumFinal, accumulator.countFinal),
    averageRomanian: average(accumulator.sumRomanian, accumulator.countRomanian),
    averageMathematics: average(accumulator.sumMathematics, accumulator.countMathematics),
    perfect10sTotal: accumulator.perfect10sTotal,
    perfect10sRomanian: accumulator.perfect10sRomanian,
    perfect10sMathematics: accumulator.perfect10sMathematics,
    totalContestations: accumulator.totalContestations,
    totalAbsentees: accumulator.totalAbsenteesAnySubject,
  }
}

function yearStatistics(accumulator) {
  const totalStudents = accumulator.totalStudents
  return {
    totalStudents,
    averageFinalGrade: average(accumulator.sumFinal, accumulator.countFinal),
    absentStats: {
      romanian: {
        count: accumulator.romanianAbsent,
        percentage: totalStudents > 0 ? (accumulator.romanianAbsent / totalStudents) * 100 : 0,
      },
      mathematics: {
        count: accumulator.mathematicsAbsent,
        percentage: totalStudents > 0 ? (accumulator.mathematicsAbsent / totalStudents) * 100 : 0,
      },
      nativeLanguage: {
        count: accumulator.nativeLanguageAbsent,
        percentage:
          accumulator.studentsTakingNativeLanguage > 0
            ? (accumulator.nativeLanguageAbsent / accumulator.studentsTakingNativeLanguage) * 100
            : 0,
        totalTaking: accumulator.studentsTakingNativeLanguage,
      },
    },
    gradeAverages: {
      romanian: average(accumulator.sumRomanian, accumulator.countRomanian),
      mathematics: average(accumulator.sumMathematics, accumulator.countMathematics),
      nativeLanguage: average(accumulator.sumNativeLanguage, accumulator.countNativeLanguage),
    },
    contestations: {
      total: accumulator.totalContestations,
      increased: accumulator.increasedContestations,
      decreased: accumulator.decreasedContestations,
    },
    gradeDistributions: {
      finalGrades: accumulator.finalGradeBins,
      romanianGrades: accumulator.romanianGradeBins,
      mathematicsGrades: accumulator.mathematicsGradeBins,
      nativeLanguageGrades: accumulator.nativeLanguageGradeBins,
    },
    totalAbsenteesAnySubject: accumulator.totalAbsenteesAnySubject,
    passRate: totalStudents > 0 ? (accumulator.promotedStudents / totalStudents) * 100 : 0,
    perfect10sTotal: accumulator.perfect10sTotal,
    perfect10sRomanian: accumulator.perfect10sRomanian,
    perfect10sMathematics: accumulator.perfect10sMathematics,
    highestGrade: accumulator.countFinal > 0 ? accumulator.highestGrade : 0,
    lowestGrade: accumulator.countFinal > 0 ? accumulator.lowestGrade : 0,
  }
}

function parseStudentCsv(filePath, onRow) {
  return new Promise((resolve, reject) => {
    let settled = false
    Papa.parse(createReadStream(filePath), {
      header: true,
      skipEmptyLines: true,
      step: (result, parser) => {
        if (result.errors.length > 0) {
          settled = true
          parser.abort()
          reject(new Error(`Unable to parse ${filePath}: ${result.errors[0].message}`))
          return
        }
        onRow(result.data)
      },
      complete: () => {
        if (!settled) resolve()
      },
      error: (error) => {
        if (!settled) {
          settled = true
          reject(error)
        }
      },
    })
  })
}

for (const year of years) {
  const filePath = path.join(publicDirectory, `${year}.csv`)
  const allStudents = createAccumulator()
  const countyAccumulators = new Map()
  const yearCounties = new Set()

  await parseStudentCsv(filePath, (row) => {
    addStudent(allStudents, row)
    const county = getValue(row, "Judet")
    if (!county.trim()) return

    countySet.add(county)
    yearCounties.add(county)
    let accumulator = countyAccumulators.get(county)
    if (!accumulator) {
      accumulator = createAccumulator()
      countyAccumulators.set(county, accumulator)
    }
    addStudent(accumulator, row)
  })

  const countyMetrics = { all: overviewMetrics(allStudents, year) }
  for (const [county, accumulator] of countyAccumulators) {
    countyMetrics[county] = overviewMetrics(accumulator, year)
  }
  const previousYearCount = overviewByCounty.all.length
  overviewByCounty.all.push(countyMetrics.all)
  for (const county of countySet) {
    if (!overviewByCounty[county]) {
      overviewByCounty[county] = years
        .slice(0, previousYearCount)
        .map((previousYear) => overviewMetrics(createAccumulator(), previousYear))
    }
    overviewByCounty[county].push(countyMetrics[county] ?? overviewMetrics(createAccumulator(), year))
  }

  const statsByCounty = { all: yearStatistics(allStudents) }
  for (const [county, accumulator] of countyAccumulators) {
    statsByCounty[county] = yearStatistics(accumulator)
  }

  const sortedYearCounties = [...yearCounties].sort()
  countiesByYear[year] = sortedYearCounties
  await writeFile(
    path.join(yearsDirectory, `${year}.json`),
    `${JSON.stringify({ counties: sortedYearCounties, statsByCounty })}\n`,
  )

  console.log(`Generated ${year}: ${allStudents.totalStudents.toLocaleString()} students`)
}

const schoolFile = path.join(publicDirectory, "scoli.csv")
const schools = []
await new Promise((resolve, reject) => {
  Papa.parse(createReadStream(schoolFile), {
    header: true,
    skipEmptyLines: true,
    step: (result, parser) => {
      if (result.errors.length > 0) {
        parser.abort()
        reject(new Error(`Unable to parse ${schoolFile}: ${result.errors[0].message}`))
        return
      }
      const row = result.data
      schools.push({
        Cod: row.Cod ?? "",
        Denumire: row.Denumire ?? "",
        Localitate: row.Localitate ?? "",
        Judet: row.Judet ?? "",
      })
    },
    complete: resolve,
    error: reject,
  })
})

await writeFile(path.join(generatedDirectory, "overview.json"), `${JSON.stringify({
  counties: [...countySet].sort(),
  metricsByCounty: overviewByCounty,
})}\n`)
await writeFile(path.join(generatedDirectory, "index.json"), `${JSON.stringify({
  years,
  counties: [...countySet].sort(),
  countiesByYear,
})}\n`)
await writeFile(path.join(generatedDirectory, "schools.json"), `${JSON.stringify(schools)}\n`)

console.log(`Generated summaries for ${years.length} years and ${schools.length.toLocaleString()} schools`)
