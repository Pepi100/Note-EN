import { readFile } from "node:fs/promises"
import path from "node:path"
import YearPageClient from "./YearPageClient"
import type { GeneratedDataIndex } from "@/lib/generated-data"

export async function generateStaticParams() {
  const indexPath = path.join(process.cwd(), "public", "generated", "index.json")
  const index = JSON.parse(await readFile(indexPath, "utf8")) as GeneratedDataIndex
  return index.years.map((year) => ({ year }))
}

export default function YearPage({ params }: { params: { year: string } }) {
  return <YearPageClient year={params.year} />
}
