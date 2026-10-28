import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Statistici despre Evaluarea Națională</h1>
      <p className="text-muted-foreground">Explorează rezultatele și statisticile pe ani și județe.</p>
      <Button asChild>
        <Link href="/rezultate">Vezi rezultatele</Link>
      </Button>
    </section>
  )
}
