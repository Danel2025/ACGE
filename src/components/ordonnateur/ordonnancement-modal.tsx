'use client'

import React, { useCallback, memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import CompactStats from '@/components/shared/compact-stats'
import { LoadingState } from '@/components/ui/loading-states'
import {
  CheckCircle,
  XCircle,
  ClipboardCheck,
  FileCheck,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

// Types pour la sécurité et la validation
interface VerificationSummary {
  statistiques: {
    validees: number
    rejetees: number
    total: number
  }
  validationsParCategorie: Record<string, {
    categorie: {
      id: string
      nom: string
      couleur: string
    }
    validations: Array<{
      id: string
      verification: {
        nom: string
      }
      valide: boolean
      valide_le: string
    }>
  }>
}

interface DossierComptable {
  id: string
  numeroDossier: string
  objetOperation: string
  beneficiaire: string
  statut: string
}

interface OrdonnancementModalProps {
  /** État d'ouverture de la modale */
  isOpen: boolean
  /** Fonction de fermeture de la modale */
  onClose: () => void
  /** Dossier comptable à ordonnancer */
  dossier: DossierComptable | null
  /** Résumé des vérifications */
  verificationSummary: VerificationSummary | null
  /** Fonction d'ordonnancement */
  onOrdonnance: (dossierId: string) => Promise<void>
  /** État de chargement */
  isLoading?: boolean
  /** Erreur d'ordonnancement */
  error?: string | null
}

/**
 * Composant modal pour l'ordonnancement des dépenses
 *
 * @description
 * Cette modale affiche un résumé des vérifications et permet d'ordonnancer
 * un dossier comptable.
 *
 * @example
 * ```tsx
 * <OrdonnancementModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   dossier={selectedDossier}
 *   verificationSummary={verificationsData}
 *   onOrdonnance={(dossierId) => handleOrdonnance(dossierId)}
 *   isLoading={loading}
 *   error={error}
 * />
 * ```
 */
const OrdonnancementModal = memo<OrdonnancementModalProps>(({
  isOpen,
  onClose,
  dossier,
  verificationSummary,
  onOrdonnance,
  isLoading = false,
  error = null
}) => {
  /**
   * Gestionnaire d'ordonnancement
   */
  const handleOrdonnance = useCallback(async () => {
    if (!dossier || isLoading) return

    try {
      await onOrdonnance(dossier.id)
      onClose()
    } catch (error) {
      // L'erreur est gérée par le composant parent
      console.error('Erreur lors de l\'ordonnancement:', error)
    }
  }, [dossier, isLoading, onOrdonnance, onClose])

  /**
   * Gestionnaire de fermeture de la modale
   */
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  /**
   * Vérification si l'ordonnancement est possible
   */
  const canOrdonnance = React.useMemo(() => {
    if (!verificationSummary) return false
    return verificationSummary.statistiques.validees > 0 &&
           verificationSummary.statistiques.rejetees === 0
  }, [verificationSummary])

  // Formatage des données pour les statistiques
  const statsData = React.useMemo(() => {
    if (!verificationSummary) return []

    return [
      {
        label: "Validées",
        value: verificationSummary.statistiques.validees,
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        className: "bg-transparent border-gray-200",
        subtitle: "Vérifications réussies",
        tooltip: "Nombre de vérifications validées avec succès",
        color: "green" as const
      },
      {
        label: "Rejetées",
        value: verificationSummary.statistiques.rejetees,
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        className: "bg-transparent border-gray-200",
        subtitle: "Vérifications échouées",
        tooltip: "Nombre de vérifications rejetées",
        color: "red" as const
      },
      {
        label: "Total",
        value: verificationSummary.statistiques.total,
        icon: <ClipboardCheck className="h-5 w-5 text-blue-600" />,
        className: "bg-transparent border-gray-200",
        subtitle: "Vérifications totales",
        tooltip: "Nombre total de vérifications effectuées",
        color: "blue" as const,
        badge: "Global"
      }
    ]
  }, [verificationSummary])

  // Formatage des données pour les catégories
  const categoriesData = React.useMemo(() => {
    if (!verificationSummary?.validationsParCategorie) return []

    return Object.values(verificationSummary.validationsParCategorie).map((categorie: any) => ({
      id: categorie.categorie.id,
      nom: categorie.categorie.nom,
      couleur: categorie.categorie.couleur,
      validations: categorie.validations,
      nombreValidees: categorie.validations.filter((v: any) => v.valide).length,
      total: categorie.validations.length
    }))
  }, [verificationSummary])

  // Formatage de la date
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        aria-describedby="ordonnancement-description"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            Ordonner la dépense
          </DialogTitle>
          <DialogDescription id="ordonnancement-description">
            Ordonnez la dépense pour le dossier{' '}
            <span className="font-semibold text-foreground">
              {dossier?.numeroDossier || 'N/A'}
            </span>
            {dossier?.objetOperation && (
              <span className="block text-sm text-muted-foreground mt-1">
                {dossier.objetOperation}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Affichage d'erreur */}
          {error && (
            <Alert variant="destructive" className="border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Résumé des vérifications */}
          {verificationSummary && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Résumé des vérifications
                </h3>
                {!canOrdonnance && (
                  <Badge variant="destructive" className="text-xs">
                    Ordonnancement impossible
                  </Badge>
                )}
              </div>

              {/* Statistiques globales */}
              <CompactStats
                stats={statsData}
                columns={3}
                size="sm"
                variant="compact"
                animated={true}
                showTooltips={true}
                className="bg-transparent"
              />

              {/* Détail par catégorie */}
              {categoriesData.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    Détail par catégorie
                  </h4>

                  <div className="space-y-3">
                    {categoriesData.map((categorie) => (
                      <div
                        key={categorie.id}
                        className="border rounded-lg p-4 bg-gray-50/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: `${categorie.couleur}500` }}
                            />
                            <span className="font-medium text-gray-900">
                              {categorie.nom}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={categorie.nombreValidees === categorie.total ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {categorie.nombreValidees} / {categorie.total} validées
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {categorie.validations.map((validation: any) => (
                            <div
                              key={validation.id}
                              className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200"
                            >
                              <div className="flex items-center gap-3">
                                {validation.valide ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                )}
                                <span className="text-sm text-gray-700">
                                  {validation.verification.nom}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(validation.valide_le)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        <DialogFooter className="flex-shrink-0 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="px-6"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleOrdonnance}
            disabled={!canOrdonnance || isLoading}
            className="px-6 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4">
                  <LoadingState isLoading={true} size="sm" showText={false} />
                </div>
                Ordonnancement en cours...
              </>
            ) : (
              'Ordonner la dépense'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

OrdonnancementModal.displayName = 'OrdonnancementModal'

export { OrdonnancementModal }
export type { OrdonnancementModalProps, VerificationSummary, DossierComptable }
