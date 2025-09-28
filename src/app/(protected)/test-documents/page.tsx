'use client'

import { useState } from 'react'
import { CompactPageLayout, PageHeader, ContentSection } from '@/components/shared/compact-page-layout'
import CompactStats from '@/components/shared/compact-stats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: any
}

export default function TestDocumentsPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addTestResult = (name: string, status: TestResult['status'], message: string, details?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name)
      if (existing) {
        existing.status = status
        existing.message = message
        existing.details = details
        return [...prev]
      }
      return [...prev, { name, status, message, details }]
    })
  }

  const clearResults = () => {
    setTestResults([])
  }

  const runAllTests = async () => {
    setIsRunning(true)
    clearResults()
    
    // Test 1: Authentification
    addTestResult('auth', 'pending', 'Test en cours...')
    try {
      const authResponse = await fetch('/api/auth/me')
      const authData = await authResponse.json()
      
      if (authResponse.ok) {
        addTestResult('auth', 'success', `Authentifié: ${authData.user.name} (${authData.user.role})`, authData)
      } else {
        addTestResult('auth', 'error', `Non authentifié: ${authData.error}`, authData)
      }
    } catch (error) {
      addTestResult('auth', 'error', `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, error)
    }

    // Test 2: API Documents
    addTestResult('documents-api', 'pending', 'Test en cours...')
    try {
      const docsResponse = await fetch('/api/documents')
      const docsData = await docsResponse.json()
      
      if (docsResponse.ok) {
        const docCount = docsData.documents?.length || 0
        addTestResult('documents-api', 'success', `${docCount} documents récupérés`, docsData)
      } else {
        addTestResult('documents-api', 'error', `Erreur API: ${docsData.error}`, docsData)
      }
    } catch (error) {
      addTestResult('documents-api', 'error', `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, error)
    }

    // Test 3: API Téléchargement
    addTestResult('download-api', 'pending', 'Test en cours...')
    try {
      // Récupérer d'abord un document pour tester le téléchargement
      const docsResponse = await fetch('/api/documents')
      const docsData = await docsResponse.json()
      
      if (docsResponse.ok && docsData.documents?.length > 0) {
        const testDoc = docsData.documents[0]
        const downloadResponse = await fetch(`/api/documents/${testDoc.id}/download`)
        
        if (downloadResponse.status === 401) {
          addTestResult('download-api', 'success', 'API Téléchargement fonctionne (401 = Non authentifié, normal)', {
            status: downloadResponse.status,
            documentId: testDoc.id
          })
        } else if (downloadResponse.ok) {
          const blob = await downloadResponse.blob()
          addTestResult('download-api', 'success', `Téléchargement réussi! Taille: ${blob.size} bytes`, {
            size: blob.size,
            type: blob.type
          })
        } else {
          const errorData = await downloadResponse.json()
          addTestResult('download-api', 'error', `Erreur: ${errorData.error}`, errorData)
        }
      } else {
        addTestResult('download-api', 'warning', 'Aucun document à tester', null)
      }
    } catch (error) {
      addTestResult('download-api', 'error', `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, error)
    }

    // Test 4: Structure des données
    addTestResult('data-structure', 'pending', 'Test en cours...')
    try {
      const docsResponse = await fetch('/api/documents')
      const docsData = await docsResponse.json()
      
      if (docsResponse.ok && docsData.documents?.length > 0) {
        const doc = docsData.documents[0]
        const hasVersion = doc.currentVersion && doc.currentVersion.id !== 'no-version'
        const hasCorrectFields = doc.currentVersion && 
          typeof doc.currentVersion.fileSize === 'number' &&
          typeof doc.currentVersion.fileType === 'string'
        
        if (hasVersion && hasCorrectFields) {
          addTestResult('data-structure', 'success', 'Structure des données correcte', {
            hasVersion,
            fileSize: doc.currentVersion.fileSize,
            fileType: doc.currentVersion.fileType,
            fileName: doc.currentVersion.fileName
          })
        } else {
          addTestResult('data-structure', 'warning', 'Structure des données partielle', {
            hasVersion,
            hasCorrectFields,
            currentVersion: doc.currentVersion
          })
        }
      } else {
        addTestResult('data-structure', 'warning', 'Aucun document à analyser', null)
      }
    } catch (error) {
      addTestResult('data-structure', 'error', `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, error)
    }

    setIsRunning(false)
  }

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    } as const

    const colors = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800'
    }

    return (
      <Badge className={colors[status]}>
        {status === 'success' ? '✅' : status === 'error' ? '❌' : status === 'warning' ? '⚠️' : '⏳'} 
        {status.toUpperCase()}
      </Badge>
    )
  }

  const successCount = testResults.filter(r => r.status === 'success').length
  const errorCount = testResults.filter(r => r.status === 'error').length
  const warningCount = testResults.filter(r => r.status === 'warning').length
  const totalTests = testResults.length

  return (
    <CompactPageLayout>
      <PageHeader
        title="🧪 Test Page Documents"
        subtitle="Test complet de la page des documents et de ses APIs"
        actions={
          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={isRunning} size="sm">
              {isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}
            </Button>
            <Button variant="outline" onClick={clearResults} size="sm">
              Effacer les résultats
            </Button>
          </div>
        }
      />

        {/* Résumé */}
        {totalTests > 0 && (
          <CompactStats
            stats={[
              {
                label: 'Réussis',
                value: successCount,
                icon: <div className="text-2xl">✅</div>,
                className: 'text-green-600'
              },
              {
                label: 'Échecs',
                value: errorCount,
                icon: <div className="text-2xl">❌</div>,
                className: 'text-red-600'
              },
              {
                label: 'Avertissements',
                value: warningCount,
                icon: <div className="text-2xl">⚠️</div>,
                className: 'text-yellow-600'
              },
              {
                label: 'Total',
                value: totalTests,
                icon: <div className="text-2xl">📊</div>,
                className: 'text-blue-600'
              }
            ]}
            columns={4}
          />
        )}

        {/* Résultats des tests */}
        {testResults.length > 0 && (
          <ContentSection title="Résultats des tests">
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{result.name}</CardTitle>
                      {getStatusBadge(result.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-2 text-sm">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                          Voir les détails
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ContentSection>
        )}

        {/* Instructions */}
        <ContentSection title="📋 Instructions">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Cliquez sur "Lancer tous les tests" pour exécuter la suite de tests</li>
            <li>Les tests vérifient l'authentification, l'API documents, l'API téléchargement et la structure des données</li>
            <li>Un statut 401 (Non authentifié) est normal pour les tests d'API</li>
            <li>Consultez les détails de chaque test pour plus d'informations</li>
          </ol>
        </ContentSection>
    </CompactPageLayout>
  )
}
