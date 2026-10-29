import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PregatirePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-28 py-2">
      <Card className="min-h-[268px]">
        <CardHeader>
          <CardTitle className="text-center">Evaluare Națională</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5 text-center sm:grid-cols-3 sm:gap-4">
            <h2 className="text-lg font-semibold">Teste Matematică</h2>
            <h2 className="text-lg font-semibold">Teste Limba Română</h2>
            <h2 className="text-lg font-semibold">Teste Limba Maternă</h2>
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
