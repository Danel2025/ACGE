'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingState } from '@/components/ui/loading-states'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Eye,
  Download
} from 'lucide-react'
import { useErrorHandler } from '@/components/ui/error-display'
import { useLoadingStates } from '@/components/ui/loading-states'
import { DocumentPreviewModal } from '@/components/ui/document-preview-modal'
import { toast } from 'sonner'

interface RapportVerificationProps {
  dossierId: string
  onValidationComplete?: (validated: boolean) => void
  folderId?: string
  onValidateRef?: React.MutableRefObject<(() => void) | null>
  onRejectRef?: React.MutableRefObject<(() => void) | null>
  canValidateRef?: React.MutableRefObject<boolean>
}

// Hook pour charger les documents d'un dossier
const useFolderDocuments = (folderId?: string, dossierId?: string) => {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    const queryParam = folderId ? `folderId=${folderId}` : dossierId ? `dossierId=${dossierId}` : null

    if (!queryParam) {
      console.warn('⚠️ Aucun folderId ou dossierId fourni pour charger les documents')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log(`📄 Chargement des documents avec: ${queryParam}`)
      const response = await fetch(`/api/documents?${queryParam}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des documents')
      const data = await response.json()
      console.log(`✅ ${data.documents?.length || 0} documents chargés`)
      setDocuments(data.documents || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [folderId, dossierId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  return { documents, loading, error, loadDocuments }
}

// Composant pour afficher les documents du dossier
const DocumentsList = ({
  documents,
  loading,
  onViewDocument
}: {
  documents: any[]
  loading: boolean
  onViewDocument: (doc: any) => void
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <LoadingState isLoading={true} message="Chargement des documents..." />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-500">
        <FileText className="h-10 w-10 mb-2 opacity-50" />
        <p className="text-sm">Aucun document dans ce dossier</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onViewDocument(doc)}
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.fileName || doc.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} Mo` : 'N/A'}
                </span>
                {doc.category && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {doc.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Eye className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function RapportVerification({
  dossierId,
  onValidationComplete,
  folderId,
  onValidateRef,
  onRejectRef,
  canValidateRef
}: RapportVerificationProps) {
  const [rapport, setRapport] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const { handleError } = useErrorHandler()
  const { isLoading, setLoading: setLoadingState } = useLoadingStates()
  const { documents, loading: documentsLoading } = useFolderDocuments(folderId, dossierId)
  const [showDocuments, setShowDocuments] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const loadRapport = React.useCallback(async () => {
    try {
      setLoading(true)
      setLoadingState('rapport', true)

      // Vérifier d'abord le statut du dossier
      const dossierResponse = await fetch(`/api/dossiers/${dossierId}`, {
        credentials: 'include'
      })

      if (dossierResponse.ok) {
        const dossierData = await dossierResponse.json()
        const dossier = dossierData.dossier

        // Bloquer l'accès si le dossier n'est pas validé définitivement
        if (dossier.statut !== 'VALIDÉ_DÉFINITIVEMENT' && dossier.statut !== 'TERMINÉ') {
          handleError('Le rapport de vérification n\'est accessible qu\'après la validation définitive du dossier', 'validation')
          return
        }
      }

      const response = await fetch(`/api/dossiers/${dossierId}/rapport-verification`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setRapport(data.rapport)
      } else {
        const errorData = await response.json()
        handleError(errorData.error || 'Erreur lors du chargement du rapport', 'server')
      }
    } catch (error) {
      console.error('Erreur chargement rapport:', error)
      handleError('Erreur de connexion', 'network')
    } finally {
      setLoading(false)
      setLoadingState('rapport', false)
    }
  }, [dossierId, handleError, setLoadingState])

  React.useEffect(() => {
    loadRapport()
  }, [loadRapport])

  const handleViewDocument = useCallback((doc: any) => {
    setSelectedDocument(doc)
    setPreviewOpen(true)
  }, [])

  const handleValidate = useCallback(() => {
    onValidationComplete?.(true)
  }, [onValidationComplete])

  const handleReject = useCallback(() => {
    onValidationComplete?.(false)
  }, [onValidationComplete])

  // Exposer les fonctions de validation au parent via refs
  React.useEffect(() => {
    if (onValidateRef) {
      onValidateRef.current = handleValidate
    }
  }, [onValidateRef, handleValidate])

  React.useEffect(() => {
    if (onRejectRef) {
      onRejectRef.current = handleReject
    }
  }, [onRejectRef, handleReject])

  // Exposer la possibilité de valider au parent via ref
  React.useEffect(() => {
    if (canValidateRef && rapport) {
      canValidateRef.current = rapport.incoherences.length === 0
    }
  }, [canValidateRef, rapport])

  const getSeveriteColor = (severite: string) => {
    switch (severite) {
      case 'HAUTE': return 'destructive'
      case 'MOYENNE': return 'default'
      case 'FAIBLE': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'VALIDÉ': return 'bg-green-100 text-green-800 border-green-200'
      case 'REJETÉ': return 'bg-red-100 text-red-800 border-red-200'
      case 'EN_COURS': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading || isLoading('rapport')) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingState isLoading={true} message="Génération du rapport de vérification..." />
      </div>
    )
  }

  if (!rapport) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Impossible de générer le rapport de vérification pour ce dossier.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid gap-4 md:grid-cols-2 h-[calc(100vh-12rem)]">
          {/* Colonne gauche: Rapport */}
          <div className="space-y-6 overflow-y-auto pr-2">
      {/* En-tête du rapport */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapport de Vérification - {rapport.dossier.numeroDossier}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Objet</div>
              <div className="font-medium">{rapport.dossier.objetOperation}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Bénéficiaire</div>
              <div className="font-medium">{rapport.dossier.beneficiaire}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Poste Comptable</div>
              <div className="font-medium">{rapport.dossier.poste_comptable?.intitule}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Date de génération</div>
              <div className="font-medium">
                {new Date(rapport.dateGeneration).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <Card>
        <CardHeader>
          <CardTitle>Synthèse Globale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {rapport.statistiquesGlobales.cb.total + rapport.statistiquesGlobales.ordonnateur.total}
              </div>
              <div className="text-sm text-blue-700">Total Vérifications</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {rapport.statistiquesGlobales.cb.valides + rapport.statistiquesGlobales.ordonnateur.valides}
              </div>
              <div className="text-sm text-green-700">Validées</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {rapport.statistiquesGlobales.incoherences}
              </div>
              <div className="text-sm text-red-700">Incohérences</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incohérences détectées */}
      {rapport.incoherences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Incohérences Détectées ({rapport.incoherences.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rapport.incoherences.map((incoherence: any, index: number) => (
              <Alert key={index} className="border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getSeveriteColor(incoherence.severite)}>
                      {incoherence.severite}
                    </Badge>
                    <span className="font-medium">{incoherence.type}</span>
                  </div>
                  <AlertDescription>
                    {incoherence.description}
                  </AlertDescription>
                  {incoherence.details && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <pre>{JSON.stringify(incoherence.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Volet CB */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Volet Contrôleur Budgétaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistiques CB */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-xl font-bold text-blue-600">
                {rapport.statistiquesGlobales.cb.total}
              </div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-xl font-bold text-green-600">
                {rapport.statistiquesGlobales.cb.valides}
              </div>
              <div className="text-xs text-green-700">Validés</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-xl font-bold text-red-600">
                {rapport.statistiquesGlobales.cb.rejetes}
              </div>
              <div className="text-xs text-red-700">Rejetés</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <Badge variant="outline" className={getStatutColor(rapport.statistiquesGlobales.cb.statut)}>
                {rapport.statistiquesGlobales.cb.statut}
              </Badge>
            </div>
          </div>

          {/* Contrôles CB par catégorie */}
          {rapport.voletCB.controlesParCategorie.map((categorie: any) => (
            <div key={categorie.categorie.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-title-medium">{categorie.categorie.nom}</h4>
                <Badge variant="outline">
                  {categorie.controles.filter((c: any) => c.valide).length} / {categorie.controles.length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {categorie.controles.map((controle: any) => (
                  <div key={controle.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {controle.valide ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">{controle.controle.nom}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(controle.valide_le).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Volet Ordonnateur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Volet Ordonnateur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistiques Ordonnateur */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-xl font-bold text-blue-600">
                {rapport.statistiquesGlobales.ordonnateur.total}
              </div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-xl font-bold text-green-600">
                {rapport.statistiquesGlobales.ordonnateur.valides}
              </div>
              <div className="text-xs text-green-700">Validés</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-xl font-bold text-red-600">
                {rapport.statistiquesGlobales.ordonnateur.rejetes}
              </div>
              <div className="text-xs text-red-700">Rejetés</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <Badge variant="outline" className={getStatutColor(rapport.statistiquesGlobales.ordonnateur.statut)}>
                {rapport.statistiquesGlobales.ordonnateur.statut}
              </Badge>
            </div>
          </div>

          {/* Vérifications Ordonnateur par catégorie */}
          {rapport.voletOrdonnateur.verificationsParCategorie.map((categorie: any) => (
            <div key={categorie.categorie.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-title-medium">{categorie.categorie.nom}</h4>
                <Badge variant="outline">
                  {categorie.verifications.filter((v: any) => v.valide).length} / {categorie.verifications.length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {categorie.verifications.map((verification: any) => (
                  <div key={verification.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {verification.valide ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">{verification.verification.nom}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(verification.valide_le).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

          </div>

          {/* Colonne droite: Documents */}
          <div className="overflow-y-auto pr-2">
            <Card className="w-full h-full">
              <CardHeader className="pb-4 sticky top-0 bg-white z-10">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FileText className="h-4 w-4" />
                  <span>Documents du dossier</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {documentsLoading ? 'Chargement...' : `${documents.length} document${documents.length > 1 ? 's' : ''}`}
                  {!folderId && (
                    <span className="text-orange-500 ml-2">(via dossierId)</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showDocuments ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Documents masqués
                  </div>
                ) : (
                  <DocumentsList
                    documents={documents}
                    loading={documentsLoading}
                    onViewDocument={handleViewDocument}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de prévisualisation des documents */}
      {selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          isOpen={previewOpen}
          onClose={() => {
            setPreviewOpen(false)
            setSelectedDocument(null)
          }}
        />
      )}
    </>
  )
}
