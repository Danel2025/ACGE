'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RefreshCw, Home, Bug } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="bg-background text-foreground">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <Card className="border-destructive/20 shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Bug className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-3xl font-title-bold text-foreground">
                  Erreur Critique
                </h1>
                <p className="text-muted-foreground">
                  Une erreur critique s'est produite dans l'application
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Message d'erreur */}
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Bug className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Détails de l'erreur critique :
                      </p>
                      <p className="text-xs text-muted-foreground font-mono break-words bg-muted/50 p-2 rounded">
                        {error.message || 'Une erreur critique inattendue s\'est produite'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <Button 
                    onClick={reset}
                    className="w-full"
                    size="lg"
                    variant="destructive"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Redémarrer l'application
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/'}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Retour à l'accueil
                  </Button>
                </div>

                {/* Message d'aide */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Si le problème persiste après le redémarrage :
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Vérifiez votre connexion internet</li>
                    <li>• Actualisez la page (F5 ou Ctrl+R)</li>
                    <li>• Contactez le support technique</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </body>
    </html>
  )
}
