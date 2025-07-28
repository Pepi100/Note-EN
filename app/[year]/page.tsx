import YearPageClient from "./YearPageClient"

export async function generateStaticParams() {
  const years = []
  for (let i = 2016; i <= 2025; i++) {
    years.push({ year: i.toString() })
  }
  return years
}

export default function YearPage({ params }: { params: { year: string } }) {
  return <YearPageClient year={params.year} />
}
