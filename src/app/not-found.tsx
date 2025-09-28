'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FileX, Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-muted shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
              <FileX className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-title-bold text-foreground">
              Page non trouvée
            </h1>
            <p className="text-muted-foreground text-sm">
              La page que vous recherchez n'existe pas ou a été déplacée
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Code d'erreur */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-muted/30 rounded-full">
                <span className="text-2xl font-bold text-muted-foreground">404</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="w-full"
                size="lg"
                asChild
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Précédent
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1"
                  asChild
                >
                  <Link href="/documents">
                    <Search className="w-4 h-4 mr-2" />
                    Documents
                  </Link>
                </Button>
              </div>
            </div>

            {/* Message d'aide */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Vérifiez l'URL ou utilisez la navigation pour trouver ce que vous cherchez
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
