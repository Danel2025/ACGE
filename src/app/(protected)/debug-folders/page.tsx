'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugFoldersPage() {
  const [apiData, setApiData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('🔄 [DebugFoldersPage] Composant rendu')

  const testAPI = async () => {
    console.log('🧪 [DebugFoldersPage] Test API commencé')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/folders', {
        credentials: 'include'
      })

      console.log('📊 [DebugFoldersPage] Réponse:', response.status, response.ok)

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 [DebugFoldersPage] Données reçues:', data)

      setApiData(data)

    } catch (err) {
      console.error('❌ [DebugFoldersPage] Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
      console.log('🧪 [DebugFoldersPage] Test API terminé')
    }
  }

  useEffect(() => {
    console.log('🔄 [DebugFoldersPage] useEffect monté, lancement du test')
    testAPI()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug API Folders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testAPI} disabled={loading}>
              {loading ? 'Test en cours...' : 'Tester API'}
            </Button>
          </div>

          {loading && <div>⏳ Chargement...</div>}

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 rounded">
              <strong>Erreur:</strong> {error}
            </div>
          )}

          {apiData && (
            <div className="space-y-4">
              <div className="p-4 bg-green-100 border border-green-400 rounded">
                <strong>Succès!</strong> {apiData.dossiers?.length || 0} dossier(s) trouvé(s)
              </div>

              {apiData.dossiers && apiData.dossiers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Dossiers:</h3>
                  {apiData.dossiers.map((dossier: any) => (
                    <div key={dossier.id} className="p-2 border rounded mb-2">
                      <div><strong>ID:</strong> {dossier.id}</div>
                      <div><strong>Nom:</strong> {dossier.foldername}</div>
                      <div><strong>Numéro:</strong> {dossier.numeroDossier}</div>
                      <div><strong>Documents:</strong> {dossier._count?.documents || 0}</div>
                    </div>
                  ))}
                </div>
              )}

              <details>
                <summary>Données brutes</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(apiData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}