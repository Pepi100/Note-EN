import { createReadStream } from "node:fs"
import { access } from "node:fs/promises"
import path from "node:path"
import Papa from "papaparse"
import { NextResponse } from "next/server"
import {
  transformStudentHeader,
  transformStudentValue,
  type StudentData,
} from "@/lib/data-utils"

export const runtime = "nodejs"

function findStudentsForSchool(filePath: string, schoolCode: string): Promise<StudentData[]> {
  return new Promise((resolve, reject) => {
    const students: StudentData[] = []

    Papa.parse(createReadStream(filePath), {
      header: true,
      skipEmptyLines: true,
      transformHeader: transformStudentHeader,
      transform: transformStudentValue,
      step: (result, parser) => {
        if (result.errors.length > 0) {
          parser.abort()
          reject(new Error(`Unable to parse ${filePath}: ${result.errors[0].message}`))
          return
        }

        const student = result.data as StudentData
        if (student.SIIIR === schoolCode) {
          students.push(student)
        }
      },
      complete: () => resolve(students),
      error: reject,
    })
  })
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const year = searchParams.get("year")
  const schoolCode = searchParams.get("schoolCode")

  if (!year || !/^\d{4}$/.test(year)) {
    return NextResponse.json({ error: "A valid four-digit year is required." }, { status: 400 })
  }
  if (!schoolCode || schoolCode.length > 100) {
    return NextResponse.json({ error: "A valid school code is required." }, { status: 400 })
  }

  const csvPath = path.join(process.cwd(), "public", `${year}.csv`)
  try {
    await access(csvPath)
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return NextResponse.json({ error: `No data is available for ${year}.` }, { status: 404 })
    }
    console.error(`Unable to access student data for ${year}:`, error)
    return NextResponse.json({ error: "Unable to access student data." }, { status: 500 })
  }

  try {
    const students = await findStudentsForSchool(csvPath, schoolCode)
    return NextResponse.json(students, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    console.error(`Unable to load records for school ${schoolCode} in ${year}:`, error)
    return NextResponse.json({ error: "Unable to load school records." }, { status: 500 })
  }
}
