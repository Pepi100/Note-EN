import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DesprePage() {
  return (
    <div className="space-y-12 max-w-3xl mx-auto text-center">
      {/* Despre Website Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Despre Website</CardTitle>
          {/* De mentionat ca sunt pasionat de statistica si cum de la asta a plecat */}
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none mx-auto text-center">
          <p>
            Acest site oferă o analiză detaliată și interactivă a rezultatelor examenului național din România, pe mai mulți ani.
            Poți explora statistici complexe și compara performanțe pe județe pentru a găsi informații utile despre școlile și elevii din zona ta.
          </p>
          <p>
            Funcționalitățile principale includ vizualizări grafice interactive, filtre după județe, comparații între ani și regiuni, plus analiza absenteismului și contestărilor.
            Toate acestea sunt accesibile printr-o interfață prietenoasă și responsive.
          </p>
        </CardContent>
      </Card>

      {/* Despre Creator Section */}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Despre Mine</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none mx-auto text-center">
          <p>
            Sunt un pasionat de calculatoare și tehnologie, cu experiență în dezvoltare web front-end folosind HTML5, CSS3 și JavaScript,
            dar și în back-end cu limbaje precum Python și C++.
          </p>
          <p>
            Pe lângă programare, am diverse pasiuni, printre care modelarea 3D și imprimarea 3D, fotografia digitală și editarea video cu Adobe Premiere Pro și After Effects.
          </p>
          <p>
            În prezent, îmi dezvolt abilitățile în Next.js pentru a crea aplicații web moderne și eficiente, abordând toate proiectele într-un mod sistematic și detaliat.
          </p>
        </CardContent>
      </Card>

      {/* Link GitHub Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Alte Proiecte</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-gray dark:prose-invert max-w-none mx-auto text-center">
          <p>
            Poți explora mai multe proiecte și cod sursă pe [translate:GitHub]-ul meu accesând linkul de mai jos:
          </p>
          <p>
            <a 
              href="https://github.com/Pepi100" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline"
            >
              https://github.com/Pepi100
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
