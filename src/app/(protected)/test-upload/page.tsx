'use client'

import { useState, useEffect } from 'react'
import { CompactPageLayout, PageHeader, ContentSection } from '@/components/shared/compact-page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useFolders } from '@/hooks/use-folders'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Database,
  ArrowLeft,
  Folder,
  Upload
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TestUploadPage() {
  const router = useRouter()
  const { folders, isLoading: foldersLoading, error: foldersError } = useFolders()
  const [apiTest, setApiTest] = useState<any>(null)
  const [isTestingAPI, setIsTestingAPI] = useState(false)

  const testFoldersAPI = async () => {
    setIsTestingAPI(true)
    setApiTest(null)

    try {
      const response = await fetch('/api/folders')
      const data = await response.json()

      setApiTest({
        success: response.ok,
        status: response.status,
        data: data,
        folderCount: data.dossiers?.length || 0
      })

    } catch (error) {
      setApiTest({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsTestingAPI(false)
    }
  }

  useEffect(() => {
    testFoldersAPI()
  }, [])

  return (
    <CompactPageLayout>
      <PageHeader
        title="Test Upload & Dossiers"
        subtitle="Diagnostic des fonctionnalités d'upload et de gestion des dossiers"
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
        {/* Test Hook useFolders */}
        <ContentSection
          title="Hook useFolders"
          subtitle="Test du hook de récupération des dossiers"
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Folder className="w-5 h-5" />
                Résultats useFolders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">État:</span>
                <Badge variant={foldersLoading ? "secondary" : foldersError ? "destructive" : "default"}>
                  {foldersLoading ? "Chargement..." : foldersError ? "Erreur" : "Succès"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nombre de dossiers:</span>
                <Badge variant="secondary">{folders.length}</Badge>
              </div>

              {foldersError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{foldersError}</AlertDescription>
                </Alert>
              )}

              {folders.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Premiers dossiers:</h4>
                  <div className="space-y-1">
                    {folders.slice(0, 3).map((folder) => (
                      <div key={folder.id} className="text-xs bg-muted/50 p-2 rounded">
                        <div><strong>ID:</strong> {folder.id}</div>
                        <div><strong>Nom:</strong> {folder.name}</div>
                        <div><strong>Documents:</strong> {folder.documentCount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ContentSection>

        {/* Test API directe */}
        <ContentSection
          title="API /folders"
          subtitle="Test direct de l'API des dossiers"
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="w-5 h-5" />
                Résultats API directe
                <Button
                  onClick={testFoldersAPI}
                  disabled={isTestingAPI}
                  size="sm"
                  variant="outline"
                  className="ml-auto h-7"
                >
                  {isTestingAPI ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Retester"
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiTest && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Succès:</span>
                    <Badge variant={apiTest.success ? "default" : "destructive"}>
                      {apiTest.success ? "OUI" : "NON"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status HTTP:</span>
                    <Badge variant="secondary">{apiTest.status}</Badge>
                  </div>

                  {apiTest.success && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Dossiers API:</span>
                      <Badge variant="secondary">{apiTest.folderCount}</Badge>
                    </div>
                  )}

                  {apiTest.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{apiTest.error}</AlertDescription>
                    </Alert>
                  )}

                  {apiTest.success && apiTest.data && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Données brutes (aperçu):</h4>
                      <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(apiTest.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </ContentSection>

        {/* Actions rapides */}
        <ContentSection
          title="Actions"
          subtitle="Navigation vers les fonctionnalités"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              onClick={() => router.push('/upload')}
              variant="outline"
              className="h-12"
            >
              <Upload className="w-4 h-4 mr-2" />
              Page Upload
            </Button>

            <Button
              onClick={() => router.push('/folders')}
              variant="outline"
              className="h-12"
            >
              <Folder className="w-4 h-4 mr-2" />
              Gestion Dossiers
            </Button>

            <Button
              onClick={() => router.push('/storage-setup')}
              variant="outline"
              className="h-12"
            >
              <Database className="w-4 h-4 mr-2" />
              Config Storage
            </Button>
          </div>
        </ContentSection>
      </div>
    </CompactPageLayout>
  )
}