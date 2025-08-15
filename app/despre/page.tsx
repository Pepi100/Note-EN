import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DesprePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Despre</CardTitle>
          <CardDescription>Informații despre acest site și creatorul său</CardDescription>
        </CardHeader>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Despre Site</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <p>
            Acest site a fost creat pentru a oferi o analiză detaliată și interactivă a rezultatelor examenului național
            din România pe parcursul mai multor ani.
          </p>

          <p>
            Platforma permite utilizatorilor să exploreze statistici comprehensive, să compare performanțele pe județe
            și să găsească informații specifice despre școlile lor.
          </p>

          <h3>Funcționalități</h3>
          <ul>
            <li>Vizualizare statistici generale pe ani</li>
            <li>Analiză detaliată pe județe</li>
            <li>Căutare informații despre școli specifice</li>
            <li>Grafice interactive și histograme</li>
            <li>Comparații între ani și regiuni</li>
          </ul>
        </CardContent>
      </Card>

      {/* About Creator */}
      <Card>
        <CardHeader>
          <CardTitle>Despre Creator</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
          <p>
            [Aici poți adăuga informații despre tine - numele, background-ul, motivația pentru crearea acestui site,
            etc.]
          </p>

          <p>
            Site-ul a fost dezvoltat folosind tehnologii moderne precum Next.js, TypeScript, Tailwind CSS și shadcn/ui
            pentru a oferi o experiență de utilizare optimă.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
