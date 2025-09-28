'use client'

import { useState } from 'react'
import { CompactPageLayout, PageHeader, ContentSection } from '@/components/shared/compact-page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Settings,
  Database,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DiagnosisResult {
  success: boolean
  issue?: string
  details?: string
  recommendations?: string[]
  buckets?: number
  documentsBucketExists?: boolean
  message?: string
}

export default function StorageSetupPage() {
  const router = useRouter()
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  const runDiagnosis = async () => {
    setIsLoading(true)
    setDiagnosis(null)

    try {
      const response = await fetch('/api/storage/setup', {
        method: 'GET'
      })

      const result = await response.json()
      setDiagnosis(result)

    } catch (error) {
      setDiagnosis({
        success: false,
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        recommendations: ['Vérifiez la connexion réseau', 'Relancez le serveur de développement']
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fixStorage = async () => {
    setIsFixing(true)

    try {
      const response = await fetch('/api/storage/setup', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        // Re-run diagnosis to verify fix
        await runDiagnosis()
      } else {
        setDiagnosis(result)
      }

    } catch (error) {
      setDiagnosis({
        success: false,
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsFixing(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getIssueColor = (issue?: string) => {
    switch (issue) {
      case 'CONNECTION_ERROR':
        return 'destructive'
      case 'MISSING_BUCKET':
        return 'default'
      case 'PERMISSION_ERROR':
        return 'secondary'
      default:
        return 'destructive'
    }
  }

  return (
    <CompactPageLayout>
      <PageHeader
        title="Configuration du Storage"
        subtitle="Diagnostic et réparation du stockage Supabase"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        }
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Actions */}
        <ContentSection
          title="Actions"
          subtitle="Diagnostiquer et réparer les problèmes de stockage"
        >
          <div className="flex gap-4">
            <Button
              onClick={runDiagnosis}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Diagnostic en cours...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Lancer le diagnostic
                </>
              )}
            </Button>

            {diagnosis && !diagnosis.success && (
              <Button
                onClick={fixStorage}
                disabled={isFixing}
                variant="default"
              >
                {isFixing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Réparation en cours...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Réparer le storage
                  </>
                )}
              </Button>
            )}
          </div>
        </ContentSection>

        {/* Résultats */}
        {diagnosis && (
          <ContentSection
            title="Résultats du diagnostic"
            subtitle="État actuel du stockage Supabase"
          >
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(diagnosis.success)}
                  État du storage: {diagnosis.success ? 'OK' : 'Problème détecté'}
                </CardTitle>
                <CardDescription>
                  {diagnosis.success
                    ? diagnosis.message || 'Le storage fonctionne correctement'
                    : 'Des problèmes ont été détectés et doivent être résolus'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Détails du succès */}
                {diagnosis.success && (
                  <div className="space-y-2">
                    {diagnosis.buckets !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Buckets disponibles:</span>
                        <Badge variant="secondary">{diagnosis.buckets}</Badge>
                      </div>
                    )}
                    {diagnosis.documentsBucketExists !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Bucket "documents":</span>
                        <Badge variant={diagnosis.documentsBucketExists ? "default" : "destructive"}>
                          {diagnosis.documentsBucketExists ? "Existe" : "Manquant"}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Détails du problème */}
                {!diagnosis.success && (
                  <div className="space-y-4">
                    {diagnosis.issue && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Type de problème:</span>
                        <Badge variant={getIssueColor(diagnosis.issue)}>
                          {diagnosis.issue.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}

                    {diagnosis.details && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Détails:</strong> {diagnosis.details}
                        </AlertDescription>
                      </Alert>
                    )}

                    {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommandations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {diagnosis.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </ContentSection>
        )}

        {/* Guide d'aide */}
        <ContentSection
          title="Guide de dépannage"
          subtitle="Solutions aux problèmes courants"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Bucket manquant</CardTitle>
                <CardDescription className="text-sm">
                  Le bucket "documents" n'existe pas
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Cliquez sur "Réparer le storage" pour créer automatiquement le bucket avec les bonnes permissions.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Erreur de connexion</CardTitle>
                <CardDescription className="text-sm">
                  Impossible de se connecter à Supabase
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Vérifiez les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Erreur de permissions</CardTitle>
                <CardDescription className="text-sm">
                  Les permissions RLS bloquent l'accès
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Vérifiez les policies RLS dans Supabase Dashboard ou utilisez la clé service_role.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Configuration manuelle</CardTitle>
                <CardDescription className="text-sm">
                  Créer le bucket dans Supabase Dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Allez dans Storage → Créer un bucket → Nommez-le "documents" → Définir comme privé</p>
              </CardContent>
            </Card>
          </div>
        </ContentSection>
      </div>
    </CompactPageLayout>
  )
}