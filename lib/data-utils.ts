import Papa from "papaparse"
import { getAssetPath } from "./path-utils" // Assuming path-utils is the file where getAssetPath is declared

/**
 * @interface StudentData
 * @description Definește structura datelor pentru un singur student, așa cum sunt parsate din fișierele CSV.
 *              Numele câmpurilor sunt mapate direct la coloanele din CSV, cu excepția "Medie_5-8" care devine "Medie_5_8".
 *              Tipurile de date sunt specificate pentru a asigura siguranța tipurilor în aplicație.
 */
export interface StudentData {
  Cod: string // Codul unic al studentului
  Sex: string // Sexul studentului (M/F)
  Mediu: string // Mediul de proveniență (URBAN/RURAL)
  Judet: string // Județul de proveniență (cod de 2 litere, ex: AB, BH, CJ)
  SIIIR: string // Codul SIIIR (Sistemul Informatic Integrat al Învățământului din România)
  Nota_ro: number // Nota inițială la Limba și Literatura Română
  Con_ro: string // Status contestație Română ('+' pentru creștere, '-' pentru nicio modificare/absență, sau valoare numerică dacă e cazul)
  Fin_ro: number | string // Nota finală la Limba și Literatura Română (poate fi '-' dacă studentul a fost absent)
  Nota_mate: number // Nota inițială la Matematică
  Con_mate: string // Status contestație Matematică
  Fin_mate: number | string // Nota finală la Matematică
  Lb_mat: string // Limba maternă (ex: 'Engleza', 'Germana', sau '-' dacă nu e cazul)
  Nota_lm: number // Nota inițială la Limba Maternă
  Con_lm: string // Status contestație Limba Maternă
  Fin_lm: number | string // Nota finală la Limba Maternă
  Medie_en: number // Media finală de admitere (media examenului național)
  Medie_5_8: number // Media generală a anilor V-VIII
  Admitere: number // Nota de admitere la liceu
  [key: string]: any // Permite adăugarea altor coloane neprevăzute, pentru flexibilitate
}

/**
 * @interface OverviewYearMetric
 * @description Definește structura metricilor agregate pe an, utilizate pentru graficele din pagina de prezentare generală (`app/page.tsx`).
 *              Aceste metrici sunt calculate din datele brute ale studenților.
 */
export interface OverviewYearMetric {
  year: string // Anul pentru care sunt calculate metricile
  totalStudents: number // Numărul total de studenți
  averageFinalGrade: number // Media finală generală a tuturor studenților
  averageRomanian: number // Media notelor finale la Română
  averageMathematics: number // Media notelor finale la Matematică
  perfect10sTotal: number // Numărul total de studenți cu media finală 10
  perfect10sRomanian: number // Numărul de note de 10 la Română
  perfect10sMathematics: number // Numărul de note de 10 la Matematică
  totalContestations: number // Numărul total de contestații înregistrate
  totalAbsentees: number // Numărul total de studenți absenți la cel puțin o materie
}

/**
 * @function parseCSV
 * @description Parsează un fișier CSV de la o cale dată și returnează un array de obiecte StudentData.
 *              Gestionează încărcarea fișierului, parsarea cu PapaParse și transformarea tipurilor de date.
 * @param {string} filePath - Calea către fișierul CSV (ex: '/2023.csv').
 * @returns {Promise<StudentData[]>} - O promisiune care se rezolvă cu un array de obiecte StudentData.
 * @throws {Error} - Aruncă o eroare dacă fișierul nu poate fi încărcat sau parsarea eșuează.
 *
 * @usedIn
 * - `app/page.tsx`: Utilizată în `useEffect` pentru a încărca datele pentru fiecare an și a le stoca.
 * - `app/[year]/YearPageClient.tsx`: Utilizată în `useEffect` pentru a încărca datele specifice anului curent.
 */
export async function parseCSV(filePath: string): Promise<StudentData[]> {
  try {
    // Construiește calea completă a fișierului, ținând cont de `basePath` din next.config.mjs
    const fullPath = getAssetPath(filePath)
    console.log(`Attempting to fetch: ${fullPath}`)

    // Efectuează cererea HTTP pentru a prelua conținutul CSV
    const response = await fetch(fullPath, {
      headers: {
        Accept: "text/csv,text/plain,*/*", // Specifică tipurile de conținut acceptate
      },
    })

    // Verifică dacă răspunsul HTTP este OK (status 2xx)
    if (!response.ok) {
      console.error(`Failed to fetch ${fullPath}: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch ${fullPath}: ${response.status} ${response.statusText}`)
    }

    // Citește conținutul răspunsului ca text
    const csvText = await response.text()
    console.log(`CSV text length: ${csvText.length}`)

    // Verifică dacă fișierul CSV este gol
    if (csvText.length === 0) {
      throw new Error(`CSV file ${filePath} is empty`)
    }

    // Returnează o promisiune pentru a gestiona parsarea asincronă cu PapaParse
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true, // Consideră prima linie ca antet
        skipEmptyLines: true, // Ignoră liniile goale
        dynamicTyping: false, // Dezactivează detectarea automată a tipurilor (le vom gestiona manual)
        /**
         * @function transformHeader
         * @description Funcție de transformare a antetului.
         *              Este folosită pentru a mapa numele coloanelor din CSV la numele proprietăților din interfața StudentData.
         *              Ex: "Medie_5-8" din CSV devine "Medie_5_8" în obiectul StudentData.
         * @param {string} header - Numele antetului din CSV.
         * @returns {string} - Numele transformat al antetului.
         */
        transformHeader: (header: string) => {
          if (header === "Medie_5-8") return "Medie_5_8"
          return header // Pentru celelalte anteturi, folosește-le ca atare
        },
        /**
         * @function transform
         * @description Funcție de transformare a valorilor celulelor.
         *              Este folosită pentru a converti valorile din șiruri de caractere în tipurile de date corespunzătoare (numere, șiruri).
         *              Gestionează și cazurile speciale, cum ar fi valorile '-' pentru notele finale.
         * @param {string} value - Valoarea celulei din CSV.
         * @param {string} field - Numele câmpului (coloanei) căruia îi aparține valoarea.
         * @returns {any} - Valoarea transformată.
         */
        transform: (value: string, field: string) => {
          // Câmpuri care pot fi '-' dar ar trebui să fie numere dacă nu sunt '-'
          if (["Fin_ro", "Fin_mate", "Fin_lm"].includes(field)) {
            if (value === "-") {
              return "-" // Păstrează ca șir dacă este '-'
            }
            const num = Number.parseFloat(value?.toString() || "0")
            return isNaN(num) ? 0 : num // Parsează ca număr, altfel 0
          }
          // Câmpuri care sunt întotdeauna numere (note inițiale, medii finale, etc.)
          if (["Nota_ro", "Nota_mate", "Nota_lm", "Medie_en", "Medie_5_8", "Admitere"].includes(field)) {
            const num = Number.parseFloat(value?.toString() || "0")
            return isNaN(num) ? 0 : num
          }
          // Toate celelalte câmpuri sunt șiruri de caractere
          return value?.toString() || ""
        },
        /**
         * @function complete
         * @description Callback apelat la finalizarea parsării.
         * @param {Papa.ParseResult<StudentData>} results - Rezultatele parsării.
         */
        complete: (results: Papa.ParseResult<StudentData>) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors)
          }
          console.log(`Parsed ${results.data.length} rows`)
          resolve(results.data || []) // Rezolvă promisiunea cu datele parsate
        },
        /**
         * @function error
         * @description Callback apelat în caz de eroare la parsare.
         * @param {Error} error - Obiectul eroare.
         */
        error: (error: Error) => {
          console.error("CSV parsing error:", error)
          reject(error) // Respinge promisiunea cu eroarea
        },
      })
    })
  } catch (error) {
    console.error(`Error parsing CSV ${filePath}:`, error)
    throw error // Propagă eroarea
  }
}

/**
 * @function calculateYearStats
 * @deprecated Această funcție a fost utilizată anterior pentru statisticile simplificate din pagina de overview.
 *             Acum este înlocuită de `getOverviewYearMetrics` pentru o analiză mai detaliată și consistentă.
 *             Păstrată pentru referință, dar nu mai este utilizată activ.
 * @param {StudentData[]} data - Un array de obiecte StudentData.
 * @returns {object} - Un obiect cu statistici agregate (total studenți, medie finală, număr absenți, procent absenți).
 */
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

/**
 * @function getOverviewYearMetrics
 * @description Calculează metrici detaliate agregate pentru un an specific, utilizate în graficele din pagina de prezentare generală (`app/page.tsx`).
 *              Această funcție filtrează și procesează datele pentru a extrage informații cheie despre performanța studenților.
 * @param {StudentData[]} data - Un array de obiecte StudentData pentru un an și un județ specific (sau toate județele).
 * @param {string} year - Anul pentru care se calculează metricile.
 * @returns {OverviewYearMetric} - Un obiect cu metricile calculate pentru anul respectiv.
 *
 * @usedIn
 * - `app/page.tsx`: Utilizată în `useEffect` pentru a calcula metricile anuale după încărcarea și filtrarea datelor.
 */
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

  // Calculează mediile doar pentru notele valide (care sunt numere și mai mari decât 0)
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

  // Calculează numărul de note de 10 perfecte
  const perfect10sTotal = data.filter(
    (student) => typeof student.Medie_en === "number" && student.Medie_en === 10,
  ).length
  const perfect10sRomanian = data.filter(
    (student) => typeof student.Fin_ro === "number" && student.Fin_ro === 10,
  ).length
  const perfect10sMathematics = data.filter(
    (student) => typeof student.Fin_mate === "number" && student.Fin_mate === 10,
  ).length

  // Calculează numărul total de contestații
  let totalContestations = 0
  data.forEach((student) => {
    // O contestație este înregistrată dacă câmpul Con_X nu este '-' (sau gol/null)
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

  // Calculează numărul total de absenți (la orice materie)
  let totalAbsenteesAnySubject = 0
  data.forEach((student) => {
    const isAbsentRomanian = student.Fin_ro === "-"
    const isAbsentMathematics = student.Fin_mate === "-"
    // Pentru limba maternă, se consideră absent doar dacă trebuia să susțină examenul (Lb_mat nu e '-')
    const isAbsentNativeLanguage = student.Fin_lm === "-" && student.Lb_mat !== "-"

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

/**
 * @function calculateDetailedStats
 * @description Calculează statistici detaliate pentru o anumită selecție de date (ex: pentru un an și un județ specific).
 *              Această funcție este utilizată în pagina detaliată a fiecărui an (`app/[year]/YearPageClient.tsx`).
 * @param {StudentData[]} data - Un array de obiecte StudentData, deja filtrat după necesitate.
 * @returns {object} - Un obiect complex cu diverse statistici: număr total studenți, medie finală, statistici absențe pe materie,
 *                     medii pe materii, statistici contestații (total, crescute, scăzute) și distribuții de note pentru histograme.
 *
 * @usedIn
 * - `app/[year]/YearPageClient.tsx`: Utilizată în `useEffect` pentru a calcula statisticile detaliate după încărcarea și filtrarea datelor.
 */
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
      totalAbsenteesAnySubject: 0,
    }
  }

  const totalStudents = data.length

  // Calculează mediile pentru notele valide (care sunt numere și mai mari decât 0)
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

  // Calculează statisticile de absență
  const romanianAbsent = data.filter((student) => student.Fin_ro === "-").length
  const mathematicsAbsent = data.filter((student) => student.Fin_mate === "-").length

  // Pentru limba maternă, numărăm studenții care trebuiau să susțină examenul (Lb_mat nu e '-')
  const studentsTakingNativeLanguage = data.filter((student) => student.Lb_mat !== "-").length
  // Dintre aceștia, numărăm pe cei care au Fin_lm === '-'
  const nativeLanguageAbsent = data.filter((student) => student.Fin_lm === "-" && student.Lb_mat !== "-").length

  // Calculează numărul total de absenți la orice materie pentru cardul "Absenți Total"
  let totalAbsenteesAnySubject = 0
  data.forEach((student) => {
    const isAbsentRomanian = student.Fin_ro === "-"
    const isAbsentMathematics = student.Fin_mate === "-"
    const isAbsentNativeLanguage = student.Fin_lm === "-" && student.Lb_mat !== "-"

    if (isAbsentRomanian || isAbsentMathematics || isAbsentNativeLanguage) {
      totalAbsenteesAnySubject++
    }
  })

  // Calculează statisticile de contestații
  let totalContestations = 0
  let increasedContestations = 0
  let decreasedContestations = 0

  data.forEach((student) => {
    // Verifică contestațiile pentru Română
    if (student.Con_ro !== "-" && student.Con_ro !== "" && student.Con_ro != null) {
      totalContestations++
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

    // Verifică contestațiile pentru Matematică
    if (student.Con_mate !== "-" && student.Con_mate !== "" && student.Con_mate != null) {
      totalContestations++
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

    // Verifică contestațiile pentru Limba Maternă
    if (student.Con_lm !== "-" && student.Con_lm !== "" && student.Con_lm != null) {
      totalContestations++
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

  // Pregătește distribuțiile de note pentru histograme
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
    totalAbsenteesAnySubject,
  }
}

/**
 * @function getUniqueCounties
 * @description Extrage o listă de județe unice din datele studenților și le returnează sortate alfabetic.
 * @param {StudentData[]} data - Un array de obiecte StudentData.
 * @returns {string[]} - Un array de șiruri de caractere reprezentând județele unice.
 *
 * @usedIn
 * - `app/page.tsx`: Utilizată în `useEffect` pentru a popula lista de județe disponibile pentru filtrare în pagina de overview.
 * - `app/[year]/YearPageClient.tsx`: Utilizată în `useEffect` pentru a popula lista de județe disponibile pentru filtrare în pagina specifică anului.
 */
export function getUniqueCounties(data: StudentData[]): string[] {
  if (!data || data.length === 0) return []

  // Folosește un Set pentru a obține județele unice, apoi le convertește într-un array și le sortează.
  const counties = [...new Set(data.map((student) => student.Judet?.toString() || ""))]
  return counties.filter((county) => county.trim() !== "").sort()
}
