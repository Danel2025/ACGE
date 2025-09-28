'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText,
  User,
  Calendar,
  Building,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Share2,
  Edit,
  Trash2,
  AlertTriangle,
  Info,
  FileCheck,
  Bell
 } from 'lucide-react'
import { DossierEditModal } from './dossier-edit-modal'

interface DossierComptable {
  id: string
  nomDossier?: string
  numeroDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire?: string
  statut: 'EN_ATTENTE' | 'VALIDÉ_CB' | 'REJETÉ_CB' | 'VALIDÉ_ORDONNATEUR' | 'PAYÉ' | 'TERMINÉ'
  dateDepot?: string
  poste_comptable?: {
    id: string
    numero: string
    intitule: string
  }
  nature_document?: {
    id: string
    numero: string
    nom: string
  }
  secretaire?: {
    id: string
    name: string
    email: string
  }
  _count?: { documents: number }
  createdAt: string
  updatedAt: string
  rejectedAt?: string
  rejectionReason?: string
  rejectionDetails?: string
}

interface DossierDetailsModalProps {
  dossier: DossierComptable | null
  isOpen: boolean
  onClose: () => void
  onAction?: (action: string, dossier: DossierComptable) => void
  userRole?: string
  onDossierUpdate?: (updatedDossier: DossierComptable) => void
}

const statutConfig = {
  'EN_ATTENTE': { 
    label: 'En attente', 
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Dossier en attente de traitement'
  },
  'VALIDÉ_CB': { 
    label: 'Validé CB', 
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Validé par le Contrôleur Budgétaire'
  },
  'REJETÉ_CB': { 
    label: 'Rejeté CB', 
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    description: 'Rejeté par le Contrôleur Budgétaire'
  },
  'VALIDÉ_ORDONNATEUR': { 
    label: 'Validé Ordonnateur', 
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: FileCheck,
    description: 'Validé par l\'Ordonnateur'
  },
  'PAYÉ': { 
    label: 'Payé', 
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: CheckCircle,
    description: 'Paiement effectué'
  },
  'TERMINÉ': { 
    label: 'Terminé', 
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: CheckCircle,
    description: 'Processus terminé'
  }
}

export function DossierDetailsModal({
  dossier,
  isOpen,
  onClose,
  onAction,
  userRole,
  onDossierUpdate
}: DossierDetailsModalProps) {
  const [editModalOpen, setEditModalOpen] = React.useState(false)

  if (!dossier) return null

  const statutInfo = statutConfig[dossier.statut] || statutConfig['EN_ATTENTE']
  const StatutIcon = statutInfo.icon

  const handleEditDossier = () => {
    setEditModalOpen(true)
  }

  const handleEditSave = (updatedDossier: DossierComptable) => {
    setEditModalOpen(false)
    onDossierUpdate?.(updatedDossier)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionButtons = () => {
    const buttons = []

    // Bouton de modification pour les secrétaires (dossiers en attente ou rejetés)
    if (userRole === 'SECRETAIRE' && ['EN_ATTENTE', 'REJETÉ_CB'].includes(dossier.statut)) {
      buttons.push(
        <Button
          key="edit"
          variant="outline"
          onClick={handleEditDossier}
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </Button>
      )
    }

    // Bouton d'ordonnancement pour l'ordonnateur
    if (userRole === 'ORDONNATEUR' && dossier.statut === 'VALIDÉ_CB') {
      buttons.push(
        <Button
          key="ordonnance"
          onClick={() => onAction?.('ordonnance', dossier)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileCheck className="mr-2 h-4 w-4" />
          Ordonner
        </Button>
      )
    }

    // Bouton de visualisation des documents
    buttons.push(
      <Button
        key="view"
        variant="outline"
        onClick={() => onAction?.('view', dossier)}
      >
        <Eye className="mr-2 h-4 w-4" />
        Voir les documents
      </Button>
    )

    // Bouton d'export
    buttons.push(
      <Button
        key="export"
        variant="outline"
        onClick={() => onAction?.('export', dossier)}
      >
        <Download className="mr-2 h-4 w-4" />
        Exporter
      </Button>
    )

    return buttons
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            Détails du dossier <span className="text-number">{dossier.numeroDossier}</span>
          </DialogTitle>
          <DialogDescription>
            Informations complètes sur le dossier comptable
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* En-tête avec statut */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatutIcon className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-lg font-title-semibold text-number">{dossier.numeroDossier}</h3>
                      <p className="text-sm text-muted-foreground">{dossier.objetOperation}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statutInfo.className}>
                    {statutInfo.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {statutInfo.description}
                </p>
              </CardHeader>
            </Card>

            {/* Informations principales */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Numéro dossier:</span>
                    <span className="text-sm text-number">{dossier.numeroDossier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Objet:</span>
                    <span className="text-sm text-right max-w-xs">{dossier.objetOperation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Bénéficiaire:</span>
                    <span className="text-sm">{dossier.beneficiaire}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Date de dépôt:</span>
                    <span className="text-sm text-date">{formatDate(dossier.dateDepot)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Classification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Poste comptable:</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-number">{dossier.poste_comptable?.numero || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{dossier.poste_comptable?.intitule || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Nature document:</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{dossier.nature_document?.numero || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{dossier.nature_document?.nom || 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informations sur la secrétaire */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Secrétaire responsable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{dossier.secretaire?.name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{dossier.secretaire?.email || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations de rejet si applicable */}
            {dossier.statut === 'REJETÉ_CB' && (dossier.rejectionReason || dossier.rejectionDetails) && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    Motif de rejet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dossier.rejectionReason && (
                    <div>
                      <span className="text-sm font-medium">Raison:</span>
                      <p className="text-sm text-red-700">{dossier.rejectionReason}</p>
                    </div>
                  )}
                  {dossier.rejectionDetails && (
                    <div>
                      <span className="text-sm font-medium">Détails:</span>
                      <p className="text-sm text-red-700">{dossier.rejectionDetails}</p>
                    </div>
                  )}
                  {dossier.rejectedAt && (
                    <div>
                      <span className="text-sm font-medium">Date de rejet:</span>
                      <p className="text-sm text-red-700">{formatDate(dossier.rejectedAt)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Métadonnées */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Métadonnées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Créé le:</span>
                    <p className="text-muted-foreground text-date">{formatDate(dossier.createdAt)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Modifié le:</span>
                    <p className="text-muted-foreground text-date">{formatDate(dossier.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Dossier créé le <span className="text-date">{formatDate(dossier.createdAt)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            {getActionButtons()}
          </div>
        </div>
      </DialogContent>

      {/* Modal d'édition de dossier */}
      <DossierEditModal
        dossier={dossier}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEditSave}
      />
    </Dialog>
  )
}
