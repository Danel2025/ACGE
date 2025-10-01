'use client'

import { use, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertTriangle, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface VerificationResult {
  valid: boolean
  quitus?: any
  error?: string
  message?: string
}

export default function VerifyQuitusPage({ params }: { params: Promise<{ numeroQuitus: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const hash = searchParams.get('hash')

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyQuitus = async () => {
      try {
        setLoading(true)

        const response = await fetch(`/api/verify-quitus/${resolvedParams.numeroQuitus}?hash=${hash}`)
        const data = await response.json()

        setVerificationResult(data)
      } catch (error) {
        console.error('Erreur vérification quitus:', error)
        setVerificationResult({
          valid: false,
          error: 'Erreur lors de la vérification'
        })
      } finally {
        setLoading(false)
      }
    }

    verifyQuitus()
  }, [resolvedParams.numeroQuitus, hash])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Vérification en cours...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle>Vérification de Quitus</CardTitle>
                <CardDescription>
                  Quitus N° {resolvedParams.numeroQuitus}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {verificationResult?.valid ? (
              <>
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Document authentique</strong>
                    <p className="mt-1">
                      Ce quitus est authentique et n'a pas été modifié depuis sa génération.
                    </p>
                  </AlertDescription>
                </Alert>

                {verificationResult.quitus && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Dossier</div>
                        <div className="font-medium">{verificationResult.quitus.dossier?.numero}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Bénéficiaire</div>
                        <div className="font-medium">{verificationResult.quitus.dossier?.beneficiaire}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Date de génération</div>
                        <div className="font-medium">
                          {new Date(verificationResult.quitus.dateGeneration).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Statut</div>
                        <Badge variant={verificationResult.quitus.conclusion?.conforme ? 'default' : 'destructive'}>
                          {verificationResult.quitus.conclusion?.conforme ? 'CONFORME' : 'NON CONFORME'}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-sm text-muted-foreground mb-2">Hash de vérification</div>
                      <div className="font-mono text-xs bg-gray-100 p-3 rounded break-all">
                        {verificationResult.quitus.securite?.hash}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertDescription>
                  <strong>Document non authentique</strong>
                  <p className="mt-1">
                    {verificationResult?.error || verificationResult?.message || 'Ce quitus n\'est pas authentique ou a été modifié.'}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Cette vérification permet de s'assurer que le document n'a pas été modifié depuis sa génération
                  par l'Agence Comptable des Grandes Écoles du Gabon. En cas de doute, contactez directement l'ACGE.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
