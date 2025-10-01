'use client'

import { LoadingState } from '@/components/ui/loading-states'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestLoadersPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Test d'alignement des loaders</h1>
        <p className="text-muted-foreground">
          Cette page teste l'alignement des différents loaders avec leur texte
        </p>
      </div>

      {/* Test des différentes tailles */}
      <Card>
        <CardHeader>
          <CardTitle>Tailles de loaders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Taille SM:</span>
            <LoadingState isLoading={true} size="sm" message="Chargement petit" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Taille MD:</span>
            <LoadingState isLoading={true} size="md" message="Chargement moyen" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Taille LG:</span>
            <LoadingState isLoading={true} size="lg" message="Chargement grand" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Taille XL:</span>
            <LoadingState isLoading={true} size="xl" message="Chargement très grand" />
          </div>
        </CardContent>
      </Card>

      {/* Test des variantes */}
      <Card>
        <CardHeader>
          <CardTitle>Variantes de loaders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Bars (défaut):</span>
            <LoadingState isLoading={true} variant="bars" message="Animation en barres" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Spinner:</span>
            <LoadingState isLoading={true} variant="spinner" message="Animation circulaire" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Dots:</span>
            <LoadingState isLoading={true} variant="dots" message="Points qui bougent" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Pulse:</span>
            <LoadingState isLoading={true} variant="pulse" message="Animation pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Test dans les boutons */}
      <Card>
        <CardHeader>
          <CardTitle>Loaders dans les boutons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button variant="default" className="h-8">
              <div className="h-4 w-4 mr-2">
                <LoadingState isLoading={true} size="sm" showText={false} noPadding={true} />
              </div>
              Bouton avec loader
            </Button>

            <Button variant="outline" className="h-8">
              <div className="h-4 w-4 mr-2">
                <LoadingState isLoading={true} size="sm" showText={false} noPadding={true} />
              </div>
              Loader outline
            </Button>

            <Button variant="secondary" className="h-8">
              <div className="h-4 w-4 mr-2">
                <LoadingState isLoading={true} size="sm" showText={false} noPadding={true} />
              </div>
              Loader secondary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test des couleurs */}
      <Card>
        <CardHeader>
          <CardTitle>Couleurs des loaders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Primary:</span>
            <LoadingState isLoading={true} color="primary" message="Couleur primaire" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">White:</span>
            <div className="bg-slate-800 p-4 rounded">
              <LoadingState isLoading={true} color="white" message="Couleur blanche" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Destructive:</span>
            <LoadingState isLoading={true} color="destructive" message="Couleur erreur" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">Muted:</span>
            <LoadingState isLoading={true} color="muted" message="Couleur atténuée" />
          </div>
        </CardContent>
      </Card>

      {/* Test sans texte */}
      <Card>
        <CardHeader>
          <CardTitle>Loaders sans texte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">SM sans texte:</span>
            <LoadingState isLoading={true} size="sm" showText={false} />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">MD sans texte:</span>
            <LoadingState isLoading={true} size="md" showText={false} />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm font-medium">LG sans texte:</span>
            <LoadingState isLoading={true} size="lg" showText={false} />
          </div>
        </CardContent>
      </Card>

      {/* Test d'alignement vertical */}
      <Card>
        <CardHeader>
          <CardTitle>Test d'alignement vertical</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Observez comment le texte est parfaitement aligné avec le centre du loader :
          </p>

          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <LoadingState isLoading={true} size="md" message="Texte parfaitement centré" />
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <LoadingState isLoading={true} size="lg" message="Loader plus grand avec texte aligné" />
          </div>

          <div className="text-center p-8">
            <LoadingState isLoading={true} size="xl" message="Loader très grand centré dans la page" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
