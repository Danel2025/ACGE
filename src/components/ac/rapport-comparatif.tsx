'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingState } from '@/components/ui/loading-states'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  MessageSquare,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { useErrorHandler } from '@/components/ui/error-display'
import { useLoadingStates } from '@/components/ui/loading-states'

interface RapportComparatifProps {
  dossierId: string
}

interface ValidationCB {
  id: string
  controle_id: string
  valide: boolean
  commentaire: string | null
  valide_le: string
  controle: {
    nom: string
    description: string
    categorie: {
      nom: string
      icone: string
      couleur: string
    }
  }
}

interface ValidationOrdonnateur {
  id: string
  verification_id: string
  valide: boolean
  commentaire: string | null
  valide_le: string
  verification: {
    nom: string
    description: string
    question: string
    categorie: {
      nom: string
      icone: string
      couleur: string
    }
  }
}

interface SyntheseCB {
  commentaire_general: string | null
  statut: string
  valide_le: string
  total_controles: number
  controles_valides: number
  controles_rejetes: number
}

interface SyntheseOrdonnateur {
  commentaire_general: string | null
  statut: string
  valide_le: string
  total_verifications: number
  verifications_validees: number
  verifications_rejetees: number
}

export function RapportComparatif({ dossierId }: RapportComparatifProps) {
  const [validationsCB, setValidationsCB] = useState<ValidationCB[]>([])
  const [validationsOrdonnateur, setValidationsOrdonnateur] = useState<ValidationOrdonnateur[]>([])
  const [syntheseCB, setSyntheseCB] = useState<SyntheseCB | null>(null)
  const [syntheseOrdonnateur, setSyntheseOrdonnateur] = useState<SyntheseOrdonnateur | null>(null)
  const [loading, setLoading] = useState(true)
  const { handleError } = useErrorHandler()
  const { isLoading, setLoading: setLoadingState } = useLoadingStates()

  const loadRapportComparatif = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingState('rapport-comparatif', true)

      // Charger les validations CB
      const cbResponse = await fetch(`/api/dossiers/${dossierId}/validation-controles-fond`, {
        credentials: 'include'
      })

      if (cbResponse.ok) {
        const cbData = await cbResponse.json()
        setValidationsCB(cbData.validations || [])

        // Construire la synthèse CB
        if (cbData.validations && cbData.validations.length > 0) {
          const totalControles = cbData.validations.length
          const controlesValides = cbData.validations.filter((v: ValidationCB) => v.valide).length
          const controlesRejetes = totalControles - controlesValides

          setSyntheseCB({
            commentaire_general: cbData.commentaire_general || null,
            statut: controlesRejetes === 0 ? 'VALIDÉ' : 'REJETÉ',
            valide_le: cbData.validations[0].valide_le,
            total_controles: totalControles,
            controles_valides: controlesValides,
            controles_rejetes: controlesRejetes
          })
        }
      } else if (cbResponse.status === 404) {
        // Aucune validation CB trouvée, c'est normal si le CB n'a pas encore validé
        console.log('ℹ️ Aucune validation CB trouvée pour ce dossier')
        setValidationsCB([])
        setSyntheseCB(null)
      } else {
        console.error('Erreur chargement validations CB:', cbResponse.status)
      }

      // Charger les vérifications Ordonnateur
      const ordoResponse = await fetch(`/api/dossiers/${dossierId}/verifications-ordonnateur`, {
        credentials: 'include'
      })

      if (ordoResponse.ok) {
        const ordoData = await ordoResponse.json()
        setValidationsOrdonnateur(ordoData.validations || [])
        setSyntheseOrdonnateur(ordoData.synthese || null)
      } else if (ordoResponse.status === 404) {
        // Aucune vérification Ordonnateur trouvée
        console.log('ℹ️ Aucune vérification Ordonnateur trouvée pour ce dossier')
        setValidationsOrdonnateur([])
        setSyntheseOrdonnateur(null)
      } else {
        console.error('Erreur chargement vérifications Ordonnateur:', ordoResponse.status)
      }

    } catch (error) {
      console.error('Erreur chargement rapport comparatif:', error)
      handleError('Erreur lors du chargement du rapport comparatif', 'network')
    } finally {
      setLoading(false)
      setLoadingState('rapport-comparatif', false)
    }
  }, [dossierId, handleError, setLoadingState])

  useEffect(() => {
    loadRapportComparatif()
  }, [loadRapportComparatif])

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'VALIDÉ': return 'bg-green-100 text-green-800 border-green-200'
      case 'REJETÉ': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading || isLoading('rapport-comparatif')) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingState isLoading={true} message="Chargement du rapport comparatif..." />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapport Comparatif des Validations
          </CardTitle>
          <CardDescription>
            Comparaison des validations et commentaires du CB et de l'Ordonnateur
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Synthèses côte à côte */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Volet CB */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <User className="h-5 w-5" />
              Contrôleur Budgétaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {syntheseCB ? (
              <>
                {/* Statistiques CB */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-xl font-bold text-blue-600">
                      {syntheseCB.total_controles}
                    </div>
                    <div className="text-xs text-blue-700">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-xl font-bold text-green-600">
                      {syntheseCB.controles_valides}
                    </div>
                    <div className="text-xs text-green-700">Validés</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-xl font-bold text-red-600">
                      {syntheseCB.controles_rejetes}
                    </div>
                    <div className="text-xs text-red-700">Rejetés</div>
                  </div>
                </div>

                {/* Statut */}
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className={getStatutColor(syntheseCB.statut)}>
                    {syntheseCB.statut}
                  </Badge>
                </div>

                {/* Date de validation */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <Calendar className="h-4 w-4" />
                  <span>Validé le {new Date(syntheseCB.valide_le).toLocaleDateString('fr-FR')}</span>
                </div>

                <Separator />

                {/* Commentaire général CB */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span>Commentaire général</span>
                  </div>
                  {syntheseCB.commentaire_general ? (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">
                        {syntheseCB.commentaire_general}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Aucun commentaire général
                    </p>
                  )}
                </div>

                <Separator />

                {/* Liste des contrôles CB */}
                <div className="space-y-2">
                  <div className="font-medium text-sm">Détails des contrôles</div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {validationsCB.map((validation) => (
                      <div
                        key={validation.id}
                        className="p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-start gap-2">
                          {validation.valide ? (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {validation.controle?.nom || 'Contrôle sans nom'}
                            </div>
                            {validation.commentaire && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                💬 {validation.commentaire}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Aucune validation CB trouvée pour ce dossier
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Volet Ordonnateur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <User className="h-5 w-5" />
              Ordonnateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {syntheseOrdonnateur ? (
              <>
                {/* Statistiques Ordonnateur */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-xl font-bold text-blue-600">
                      {syntheseOrdonnateur.total_verifications}
                    </div>
                    <div className="text-xs text-blue-700">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-xl font-bold text-green-600">
                      {syntheseOrdonnateur.verifications_validees}
                    </div>
                    <div className="text-xs text-green-700">Validées</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-xl font-bold text-red-600">
                      {syntheseOrdonnateur.verifications_rejetees}
                    </div>
                    <div className="text-xs text-red-700">Rejetées</div>
                  </div>
                </div>

                {/* Statut */}
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className={getStatutColor(syntheseOrdonnateur.statut)}>
                    {syntheseOrdonnateur.statut}
                  </Badge>
                </div>

                {/* Date de validation */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <Calendar className="h-4 w-4" />
                  <span>Validé le {new Date(syntheseOrdonnateur.valide_le).toLocaleDateString('fr-FR')}</span>
                </div>

                <Separator />

                {/* Commentaire général Ordonnateur */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span>Commentaire général</span>
                  </div>
                  {syntheseOrdonnateur.commentaire_general ? (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-900 whitespace-pre-wrap">
                        {syntheseOrdonnateur.commentaire_general}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Aucun commentaire général
                    </p>
                  )}
                </div>

                <Separator />

                {/* Liste des vérifications Ordonnateur */}
                <div className="space-y-2">
                  <div className="font-medium text-sm">Détails des vérifications</div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {validationsOrdonnateur.map((validation) => (
                      <div
                        key={validation.id}
                        className="p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-start gap-2">
                          {validation.valide ? (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {validation.verification?.nom || 'Vérification sans nom'}
                            </div>
                            {validation.commentaire && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                💬 {validation.commentaire}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Aucune vérification Ordonnateur trouvée pour ce dossier
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analyse comparative */}
      {syntheseCB && syntheseOrdonnateur && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Analyse Comparative
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900 mb-2">Taux de validation CB</div>
                <div className="text-2xl font-bold text-blue-600">
                  {syntheseCB.total_controles > 0
                    ? Math.round((syntheseCB.controles_valides / syntheseCB.total_controles) * 100)
                    : 0}%
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-medium text-green-900 mb-2">Taux de validation Ordonnateur</div>
                <div className="text-2xl font-bold text-green-600">
                  {syntheseOrdonnateur.total_verifications > 0
                    ? Math.round((syntheseOrdonnateur.verifications_validees / syntheseOrdonnateur.total_verifications) * 100)
                    : 0}%
                </div>
              </div>
            </div>

            {(syntheseCB.controles_rejetes > 0 || syntheseOrdonnateur.verifications_rejetees > 0) && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900">
                  <strong>Points d'attention :</strong>
                  {syntheseCB.controles_rejetes > 0 && (
                    <div>• {syntheseCB.controles_rejetes} contrôle(s) rejeté(s) par le CB</div>
                  )}
                  {syntheseOrdonnateur.verifications_rejetees > 0 && (
                    <div>• {syntheseOrdonnateur.verifications_rejetees} vérification(s) rejetée(s) par l'Ordonnateur</div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
