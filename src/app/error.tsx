'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

export default function Error({
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-destructive/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-title-bold text-foreground">
              Oups ! Une erreur s'est produite
            </h1>
            <p className="text-muted-foreground text-sm">
              Nous nous excusons pour la gêne occasionnée
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Message d'erreur */}
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-start gap-3">
                <Bug className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Détails de l'erreur :
                  </p>
                  <p className="text-xs text-muted-foreground font-mono break-words">
                    {error.message || 'Une erreur inattendue s\'est produite'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={reset}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  asChild
                >
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Accueil
                  </Link>
                </Button>
              </div>
            </div>

            {/* Message d'aide */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Si le problème persiste, contactez le support technique
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
