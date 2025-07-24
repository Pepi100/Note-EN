import YearPageClient from "./YearPageClient"

export async function generateStaticParams() {
  return [{ year: "2023" }, { year: "2024" }, { year: "2025" }]
}

export default function YearPage({ params }: { params: { year: string } }) {
  return <YearPageClient year={params.year} />
}
