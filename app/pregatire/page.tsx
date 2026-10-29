import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const subjects = [
  { id: "matematica", title: "Teste Matematică" },
  { id: "romana", title: "Teste Limba Română" },
  { id: "materna", title: "Teste Limba Maternă" },
]

export default function PregatirePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-28 py-2">
      <Card className="min-h-[268px]">
        <CardHeader>
          <CardTitle className="text-center">Evaluare Națională</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
            {subjects.map((subject) => (
              <section key={subject.id} aria-labelledby={`${subject.id}-title`}>
                <h2 id={`${subject.id}-title`} className="text-center text-lg font-semibold">
                  {subject.title}
                </h2>
                <ul
                  aria-label={`Categorii pentru ${subject.title}`}
                  className="mt-4 max-h-40 space-y-2 overflow-y-auto rounded-md border bg-background p-3"
                >
                  <li className="rounded-md bg-muted px-3 py-2 text-sm">Teste Oficiale</li>
                  <li className="rounded-md bg-muted px-3 py-2 text-sm">Altele</li>
                </ul>
              </section>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[296px]">
        <CardHeader>
          <CardTitle className="text-center">Bacalaureat</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
