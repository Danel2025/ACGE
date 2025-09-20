'use client'
import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { CompactPageLayout, PageHeader, CompactStats, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import { ControleurBudgetaireGuard } from '@/components/auth/role-guard'
// import { DiagnosticPanel } from '@/components/debug/diagnostic-panel' // Supprimé car composant debug supprimé
import { checkDossierValidationStatus, ValidationStatus } from '@/lib/validation-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ResponsiveTableWrapper,
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow,
  ResponsiveTableCell,
  TableActionButton,
  TableActionsMenu
} from '@/components/ui/responsive-table-wrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CBStatusNavigation } from '@/components/cb/cb-status-navigation'
import { DocumentEditModal } from '@/components/documents/document-edit-modal'
import { DocumentShareModal } from '@/components/documents/document-share-modal'
import { DocumentPreviewModal } from '@/components/ui/document-preview-modal'
import { OperationTypeValidationForm } from '@/components/cb/operation-type-validation-form'
import { ControlesFondForm } from '@/components/cb/controles-fond-form'
import { OperationTypeConsultation } from '@/components/cb/operation-type-consultation'
import { ControlesFondConsultation } from '@/components/cb/controles-fond-consultation'
import { ModalBackdrop } from '@/components/ui/modal-backdrop'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  MoreHorizontal, 
  Eye, 
  ArrowLeft, 
  Download, 
  Share2,
  Filter,
  Search,
  RefreshCw,
  FolderOpen,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react'
interface DossierComptable {
  id: string
  numeroDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire: string
  statut: 'EN_ATTENTE' | 'VALIDÉ_CB' | 'REJETÉ_CB' | 'VALIDÉ_ORDONNATEUR' | 'PAYÉ' | 'TERMINÉ'
  dateDepot: string
  folderId?: string
  foldername?: string
  poste_comptable: {
    id: string
    numero: string
    intitule: string
  }
  nature_document: {
    id: string
    numero: string
    nom: string
  }
  secretaire: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  // Colonnes de rejet
  rejectedAt?: string
  rejectionReason?: string
  rejectionDetails?: string
  // État des validations
  validationStatus?: ValidationStatus
}
function CBDashboardContent() {
  const { user } = useSupabaseAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  // États pour la gestion des dossiers
  const [dossiers, setDossiers] = React.useState<DossierComptable[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [sortField, setSortField] = React.useState<'numeroDossier' | 'dateDepot' | 'statut' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'en_attente' | 'valide' | 'rejete'>('all')
  // États pour les actions de validation
  const [selectedDossier, setSelectedDossier] = React.useState<DossierComptable | null>(null)
  const [validationOpen, setValidationOpen] = React.useState(false)
  const [operationTypeValidationOpen, setOperationTypeValidationOpen] = React.useState(false)
  const [controlesFondOpen, setControlesFondOpen] = React.useState(false)
  const [operationTypeConsultationOpen, setOperationTypeConsultationOpen] = React.useState(false)
  const [controlesFondConsultationOpen, setControlesFondConsultationOpen] = React.useState(false)
  const [rejectionOpen, setRejectionOpen] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState('')
  const [actionLoading, setActionLoading] = React.useState(false)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  // États pour l'affichage du contenu du dossier
  const [currentFolder, setCurrentFolder] = React.useState<any>(null)
  const [documents, setDocuments] = React.useState<any[]>([])
  const [documentsLoading, setDocumentsLoading] = React.useState(false)
  const [documentsError, setDocumentsError] = React.useState('')
  const [selectedDocument, setSelectedDocument] = React.useState<any>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [shareModalOpen, setShareModalOpen] = React.useState(false)
  // Vérifier si l'utilisateur est CB
  React.useEffect(() => {
    if (user?.role !== 'CONTROLEUR_BUDGETAIRE') {
      router.push('/dashboard')
    }
  }, [user, router])
  // Charger tous les dossiers (pas seulement ceux en attente)
  const loadDossiers = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch('/api/dossiers/cb-all', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Dossiers chargés:', data.dossiers)
        data.dossiers?.forEach((dossier: any, index: number) => {
          console.log(`  ${index + 1}. ${dossier.numeroDossier} - folderId: ${dossier.folderId} - foldername: ${dossier.foldername}`)
        })
        // Charger les statuts de validation pour chaque dossier
        const dossiersWithValidation = await Promise.all(
          (data.dossiers || []).map(async (dossier: DossierComptable) => {
            if (dossier.statut === 'EN_ATTENTE' || dossier.statut === 'VALIDÉ_CB') {
              try {
                const validationStatus = await checkDossierValidationStatus(dossier.id)
                return { ...dossier, validationStatus }
              } catch (error) {
                console.error(`Erreur lors de la vérification des validations pour le dossier ${dossier.id}:`, error)
                return dossier
              }
            }
            return dossier
          })
        )
        setDossiers(dossiersWithValidation)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors du chargement des dossiers')
      }
    } catch (error) {
      console.error('Erreur chargement dossiers:', error)
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }, [])
  // Charger les dossiers au montage
  React.useEffect(() => {
    loadDossiers()
  }, [loadDossiers])
  // Filtrage et tri des dossiers
  const filteredDossiers = React.useMemo(() => {
    let items = dossiers
    // Filtrage par statut
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'en_attente':
          items = items.filter(d => d.statut === 'EN_ATTENTE')
          break
        case 'valide':
          items = items.filter(d => d.statut === 'VALIDÉ_CB')
          break
        case 'rejete':
          items = items.filter(d => d.statut === 'REJETÉ_CB')
          break
      }
    }
    // Filtrage par recherche textuelle
    if (query) {
      items = items.filter(d => 
        d.numeroDossier.toLowerCase().includes(query.toLowerCase()) ||
        d.objetOperation.toLowerCase().includes(query.toLowerCase()) ||
        d.beneficiaire.toLowerCase().includes(query.toLowerCase())
      )
    }
    // Tri
    items.sort((a, b) => {
      let aValue: any, bValue: any
      switch (sortField) {
        case 'numeroDossier':
          aValue = a.numeroDossier.toLowerCase()
          bValue = b.numeroDossier.toLowerCase()
          break
        case 'dateDepot':
          aValue = new Date(a.dateDepot).getTime()
          bValue = new Date(b.dateDepot).getTime()
          break
        case 'statut':
          aValue = a.statut
          bValue = b.statut
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
      }
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })
    return items
  }, [dossiers, query, sortField, sortOrder, statusFilter])
  // Actions de validation
  const handleValidate = async (dossier: DossierComptable) => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/dossiers/${dossier.id}/validate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      if (response.ok) {
        await loadDossiers() // Recharger la liste
        setValidationOpen(false)
        setSelectedDossier(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la validation')
      }
    } catch (error) {
      console.error('Erreur validation:', error)
      setError('Erreur lors de la validation')
    } finally {
      setActionLoading(false)
    }
  }
  // Gestion de la validation du type d'opération
  const handleOperationTypeValidation = (dossier: DossierComptable) => {
    setSelectedDossier(dossier)
    setOperationTypeValidationOpen(true)
  }
  const handleOperationTypeValidationComplete = async (success: boolean) => {
    if (success) {
      await loadDossiers() // Recharger la liste
      // Fermer la modale de validation du type d'opération
      setOperationTypeValidationOpen(false)
      // Ouvrir automatiquement la modale de contrôles de fond
      setControlesFondOpen(true)
      // Ne pas fermer selectedDossier car on en a besoin pour les contrôles de fond
    } else {
      setOperationTypeValidationOpen(false)
      setSelectedDossier(null)
    }
  }
  const handleReject = async () => {
    if (!selectedDossier || !rejectionReason.trim()) {
      console.error('❌ Données manquantes pour le rejet:', { 
        selectedDossier: !!selectedDossier, 
        rejectionReason: rejectionReason 
      })
      return
    }
    try {
      setActionLoading(true)
      const requestBody = { 
        reason: rejectionReason.trim(),
        details: null // Optionnel pour l'instant
      }
      console.log('🔄 Tentative de rejet du dossier:', {
        dossierId: selectedDossier.id,
        numeroDossier: selectedDossier.numeroDossier,
        reason: requestBody.reason,
        body: requestBody
      })
      const response = await fetch(`/api/dossiers/${selectedDossier.id}/reject`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })
      console.log('📡 Réponse du serveur:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Rejet réussi:', result)
        await loadDossiers() // Recharger la liste
        setRejectionOpen(false)
        setSelectedDossier(null)
        setRejectionReason('')
        toast.success('Dossier rejeté avec succès')
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error('❌ Impossible de parser la réponse d\'erreur:', parseError)
          errorData = { error: `Erreur ${response.status}: ${response.statusText}` }
        }
        console.error('❌ Erreur de rejet détaillée:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          dossierId: selectedDossier.id,
          numeroDossier: selectedDossier.numeroDossier
        })
        const errorMessage = errorData.error || `Erreur ${response.status} lors du rejet`
        const errorDetails = errorData.details ? `\nDétails: ${JSON.stringify(errorData.details, null, 2)}` : ''
        setError(errorMessage + errorDetails)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors du rejet:', error)
      setError('Erreur de connexion lors du rejet')
      toast.error('Erreur de connexion lors du rejet')
    } finally {
      setActionLoading(false)
    }
  }
  // Fonction pour ouvrir un dossier et voir son contenu
  const handleOpenFolder = async (dossier: DossierComptable) => {
    console.log('🚀 FONCTION handleOpenFolder APPELÉE')
    console.log('🔍 Tentative d\'ouverture du dossier:', dossier)
    console.log('🔍 folderId:', dossier.folderId)
    console.log('🔍 foldername:', dossier.foldername)
    if (!dossier.folderId) {
      console.log('❌ Pas de folderId pour ce dossier')
      setError('Ce dossier n\'est pas lié à un dossier de fichiers')
      return
    }
    try {
      setDocumentsLoading(true)
      setDocumentsError('')
      console.log('📁 Chargement des détails du dossier:', dossier.folderId)
      // Charger les détails du dossier
      const folderRes = await fetch(`/api/folders/${dossier.folderId}`)
      console.log('📁 Réponse dossier:', folderRes.status, folderRes.statusText)
      if (folderRes.ok) {
        const folderData = await folderRes.json()
        console.log('📁 Données dossier:', folderData)
        setCurrentFolder(folderData.folder || folderData)
      } else {
        const errorText = await folderRes.text()
        console.error('❌ Erreur chargement dossier:', errorText)
        setDocumentsError('Erreur lors du chargement du dossier')
        return
      }
      console.log('📄 Chargement des documents du dossier:', dossier.folderId)
      // Charger les documents du dossier
      const documentsRes = await fetch(`/api/documents?folderId=${dossier.folderId}`)
      console.log('📄 Réponse documents:', documentsRes.status, documentsRes.statusText)
      if (documentsRes.ok) {
        const documentsData = await documentsRes.json()
        console.log('📄 Données documents:', documentsData)
        setDocuments(documentsData.documents || [])
      } else {
        const errorText = await documentsRes.text()
        console.error('❌ Erreur chargement documents:', errorText)
        setDocumentsError('Erreur lors du chargement des documents')
      }
    } catch (error) {
      console.error('❌ Erreur chargement contenu dossier:', error)
      setDocumentsError('Erreur lors du chargement du contenu')
    } finally {
      setDocumentsLoading(false)
    }
  }
  // Fonction pour revenir à la liste des dossiers
  const handleBackToList = () => {
    setCurrentFolder(null)
    setDocuments([])
    setDocumentsError('')
  }
  // Fonction pour recharger les documents du dossier
  const loadFolderDocuments = async (folderId: string) => {
    try {
      setDocumentsLoading(true)
      setDocumentsError('')
      const documentsRes = await fetch(`/api/documents?folderId=${folderId}`)
      if (documentsRes.ok) {
        const documentsData = await documentsRes.json()
        setDocuments(documentsData.documents || [])
      } else {
        setDocumentsError('Erreur lors du chargement des documents')
      }
    } catch (error) {
      console.error('Erreur rechargement documents:', error)
      setDocumentsError('Erreur lors du rechargement')
    } finally {
      setDocumentsLoading(false)
    }
  }
  // Fonctions pour gérer les documents
  const handleViewDocument = (document: any) => {
    setSelectedDocument(document)
    setPreviewOpen(true)
  }
  const handleEditDocument = (document: any) => {
    setSelectedDocument(document)
    setEditModalOpen(true)
  }
  const handleShareDocument = (document: any) => {
    setSelectedDocument(document)
    setShareModalOpen(true)
  }
  const handleDownloadDocument = async (document: any) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = document.fileName || 'document'
        window.document.body.appendChild(a)
        a.click()
        window.document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error)
    }
  }
  const getStatutBadge = (statut: string) => {
    const configs = {
      'EN_ATTENTE': { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'VALIDÉ_CB': { label: 'Validé CB', className: 'bg-green-100 text-green-800 border-green-200' },
      'REJETÉ_CB': { label: 'Rejeté CB', className: 'bg-red-100 text-red-800 border-red-200' },
      'VALIDÉ_ORDONNATEUR': { label: 'Validé Ordonnateur', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'PAYÉ': { label: 'Payé', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'TERMINÉ': { label: 'Terminé', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
    const config = configs[statut as keyof typeof configs] || configs['EN_ATTENTE']
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }
  if (user?.role !== 'CONTROLEUR_BUDGETAIRE') {
    return (
      <CompactPageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-muted-foreground" />
                Accès refusé
              </CardTitle>
              <CardDescription>
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard')}>
                Retour au dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </CompactPageLayout>
    )
  }
  // Si on est en mode consultation de dossier, afficher l'interface de consultation
  if (currentFolder) {
    return (
      <CompactPageLayout>
        {/* Header avec bouton retour */}
        <PageHeader
          title="Consultation du dossier"
          subtitle={currentFolder.name || 'Dossier sans nom'}
          actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleBackToList} className="w-full sm:w-auto h-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux dossiers
              </Button>
              <Button variant="outline" onClick={() => currentFolder && loadFolderDocuments(currentFolder.id)} className="w-full sm:w-auto h-8">
                <RefreshCw className="mr-2 h-4 w-4" />
                Rafraîchir
              </Button>
              <Button variant="default" onClick={handleBackToList} className="w-full sm:w-auto h-8">
                <FileText className="mr-2 h-4 w-4" />
                Voir le résumé complet
              </Button>
            </div>
          }
        />
        {/* Stats globales du dashboard */}
        <CompactStats
          stats={[
            {
              label: "En attente",
              value: dossiers.filter(d => d.statut === 'EN_ATTENTE').length,
              icon: <Clock className="h-4 w-4 text-yellow-600" />,
              color: "text-yellow-600"
            },
            {
              label: "Validés",
              value: dossiers.filter(d => d.statut === 'VALIDÉ_CB').length,
              icon: <CheckCircle className="h-4 w-4 text-green-600" />,
              color: "text-green-600"
            },
            {
              label: "Rejetés",
              value: dossiers.filter(d => d.statut === 'REJETÉ_CB').length,
              icon: <XCircle className="h-4 w-4 text-red-600" />,
              color: "text-red-600"
            },
            {
              label: "Total",
              value: dossiers.length,
              icon: <FileText className="h-4 w-4 text-primary" />,
              color: "text-primary"
            }
          ]}
          columns={4}
        />
        {/* Stats du dossier */}
        <CompactStats
          stats={[
            {
              label: "Documents",
              value: documents.length,
              icon: <FileText className="h-4 w-4 text-primary" />,
              color: "text-primary"
            },
            {
              label: "Taille totale",
              value: documents.reduce((total, doc) => total + (doc.size || 0), 0) > 0 
                ? `${(documents.reduce((total, doc) => total + (doc.size || 0), 0) / 1024 / 1024).toFixed(1)} MB`
                : '0 MB',
              icon: <FolderOpen className="h-4 w-4 text-primary" />,
              color: "text-primary"
            },
            {
              label: "Dossier",
              value: currentFolder.name,
              icon: <FolderOpen className="h-4 w-4 text-primary" />,
              color: "text-primary"
            }
          ]}
          columns={3}
        />
        {/* Liste des documents */}
        <ContentSection
          title="Documents du dossier"
          subtitle={`${documents.length} document${documents.length > 1 ? 's' : ''} dans ce dossier`}
        >
          {documentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : documentsError ? (
            <EmptyState
              icon={<AlertCircle className="h-10 w-10 text-red-500" />}
              title="Erreur de chargement"
              description={documentsError}
            />
          ) : documents.length > 0 ? (
            <ResponsiveTableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <ResponsiveTableCell className="font-medium">
                        {document.fileName || document.name}
                      </ResponsiveTableCell>
                      <ResponsiveTableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {document.category || 'Non classé'}
                        </span>
                      </ResponsiveTableCell>
                      <ResponsiveTableCell>
                        {document.fileSize ? `${(document.fileSize / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                      </ResponsiveTableCell>
                      <ResponsiveTableCell>
                        {new Date(document.createdAt).toLocaleDateString('fr-FR')}
                      </ResponsiveTableCell>
                      <ResponsiveTableCell>
                        <TableActionsMenu
                          actions={[
                            {
                              label: 'Voir',
                              icon: <Eye className="h-4 w-4" />,
                              onClick: () => handleViewDocument(document)
                            },
                            {
                              label: 'Télécharger',
                              icon: <Download className="h-4 w-4" />,
                              onClick: () => handleDownloadDocument(document)
                            },
                            {
                              label: 'Modifier',
                              icon: <Edit className="h-4 w-4" />,
                              onClick: () => handleEditDocument(document)
                            },
                            {
                              label: 'Partager',
                              icon: <Share2 className="h-4 w-4" />,
                              onClick: () => handleShareDocument(document)
                            }
                          ]}
                        />
                      </ResponsiveTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTableWrapper>
          ) : (
            <EmptyState
              icon={<FileText className="h-10 w-10 text-muted-foreground" />}
              title="Aucun document"
              description="Ce dossier ne contient aucun document."
            />
          )}
        </ContentSection>
          {/* Modales pour les documents */}
          {selectedDocument && (
            <>
              <DocumentPreviewModal
                document={selectedDocument}
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                onDownload={(doc) => {
                  handleDownloadDocument(doc)
                }}
                onEdit={(doc) => {
                  setEditModalOpen(true)
                }}
                onShare={(doc) => {
                  setShareModalOpen(true)
                }}
              />
              <DocumentEditModal
                document={selectedDocument}
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSave={() => {
                  setEditModalOpen(false)
                  if (currentFolder) {
                    loadFolderDocuments(currentFolder.id)
                  }
                }}
              />
              <DocumentShareModal
                document={selectedDocument}
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
              />
            </>
          )}
        {/* Panel de diagnostic */}
        {/* <DiagnosticPanel /> Supprimé car composant debug supprimé */}
      </CompactPageLayout>
    )
  }
  return (
    <CompactPageLayout>
      <PageHeader
        title="Dashboard Contrôleur Budgétaire"
        subtitle="Validez ou rejetez les dossiers en attente"
        actions={
          <Button 
            variant="outline" 
            onClick={loadDossiers} 
            className="w-full sm:w-auto h-8"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Rafraîchir
          </Button>
        }
      />
      <ContentSection
        title="Recherche et filtres"
        actions={
          <div className="flex gap-2">
            <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date de création</SelectItem>
                <SelectItem value="numeroDossier">Numéro dossier</SelectItem>
                <SelectItem value="dateDepot">Date de dépôt</SelectItem>
                <SelectItem value="statut">Statut</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        }
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par numéro, objet ou bénéficiaire..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 h-8"
          />
        </div>
      </ContentSection>
      <CompactStats
        stats={[
          {
            label: "En attente",
            value: dossiers.filter(d => d.statut === 'EN_ATTENTE').length,
            icon: <Clock className="h-4 w-4 text-yellow-600" />,
            color: "text-yellow-600"
          },
          {
            label: "Validés",
            value: dossiers.filter(d => d.statut === 'VALIDÉ_CB').length,
            icon: <CheckCircle className="h-4 w-4 text-green-600" />,
            color: "text-green-600"
          },
          {
            label: "Rejetés",
            value: dossiers.filter(d => d.statut === 'REJETÉ_CB').length,
            icon: <XCircle className="h-4 w-4 text-red-600" />,
            color: "text-red-600"
          },
          {
            label: "Total",
            value: dossiers.length,
            icon: <FileText className="h-4 w-4 text-primary" />,
            color: "text-primary"
          }
        ]}
        columns={4}
      />
      {/* Navigation horizontale par statut */}
      <CBStatusNavigation
        dossiers={dossiers}
        currentFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />
      <ContentSection
        title={
          statusFilter === 'all' ? 'Tous les dossiers' :
          statusFilter === 'en_attente' ? 'Dossiers en attente' :
          statusFilter === 'valide' ? 'Dossiers validés' :
          statusFilter === 'rejete' ? 'Dossiers rejetés' : 'Dossiers'
        }
        subtitle={`${filteredDossiers.length} dossier${filteredDossiers.length > 1 ? 's' : ''} trouvé${filteredDossiers.length > 1 ? 's' : ''}`}
      >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredDossiers.length > 0 ? (
              <ResponsiveTableWrapper>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Nom du dossier</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Poste Comptable</TableHead>
                    <TableHead>Date Dépôt</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Validations</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDossiers.map((dossier) => (
                    <TableRow 
                      key={dossier.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        console.log('🖱️ Clic direct sur la ligne du dossier:', dossier.numeroDossier)
                        if (dossier.folderId) {
                          console.log('🖱️ Ouverture du dossier via clic direct')
                          handleOpenFolder(dossier)
                        } else {
                          console.log('❌ Pas de folderId - ouverture des détails')
                          setSelectedDossier(dossier)
                          setDetailsOpen(true)
                        }
                      }}
                    >
                      <TableCell className="font-medium text-reference">{dossier.numeroDossier}</TableCell>
                      <TableCell className="max-w-xs truncate font-medium text-blue-600">
                        {dossier.foldername || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{dossier.objetOperation}</TableCell>
                      <TableCell>{dossier.beneficiaire}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-code">{dossier.poste_comptable?.numero || 'N/A'}</div>
                          <div className="text-muted-foreground">{dossier.poste_comptable?.intitule || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-date">{new Date(dossier.dateDepot).toLocaleDateString('fr-FR')}</span>
                      </TableCell>
                      <TableCell>{getStatutBadge(dossier.statut)}</TableCell>
                      <TableCell>
                        {(dossier.statut === 'EN_ATTENTE' || dossier.statut === 'VALIDÉ_CB') && dossier.validationStatus ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-xs">
                              <div className={`w-2 h-2 rounded-full ${dossier.validationStatus.hasOperationTypeValidation ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className={dossier.validationStatus.hasOperationTypeValidation ? 'text-green-600' : 'text-gray-500'}>
                                Type d'opération
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <div className={`w-2 h-2 rounded-full ${dossier.validationStatus.hasControlesFondValidation ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className={dossier.validationStatus.hasControlesFondValidation ? 'text-green-600' : 'text-gray-500'}>
                                Contrôles de fond
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="touch-target h-9 w-9 sm:h-8 sm:w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('🖱️ Clic sur le bouton menu pour dossier:', dossier.numeroDossier)
                              }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                              <span className="sr-only">Ouvrir le menu d'actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDossier(dossier)
                              setDetailsOpen(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            {dossier.statut === 'EN_ATTENTE' && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedDossier(dossier)
                                  setOperationTypeValidationOpen(true)
                                }}
                                className="text-blue-600"
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Valider Type d'Opération
                              </DropdownMenuItem>
                            )}
                            {dossier.statut === 'EN_ATTENTE' && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedDossier(dossier)
                                  setControlesFondOpen(true)
                                }}
                                className="text-purple-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Contrôles de Fond
                              </DropdownMenuItem>
                            )}
                            {(dossier.statut === 'VALIDÉ_CB' || dossier.statut === 'VALIDÉ_ORDONNATEUR' || dossier.statut === 'PAYÉ' || dossier.statut === 'TERMINÉ') && (
                              <>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDossier(dossier)
                                    setOperationTypeConsultationOpen(true)
                                  }}
                                  className="text-blue-600"
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Consulter Type d'Opération
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDossier(dossier)
                                    setControlesFondConsultationOpen(true)
                                  }}
                                  className="text-purple-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Consulter Contrôles de Fond
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('🖱️ Clic détecté sur menu item')
                                console.log('🖱️ Dossier:', dossier)
                                console.log('🖱️ folderId:', dossier.folderId)
                                console.log('🖱️ foldername:', dossier.foldername)
                                if (dossier.folderId) {
                                  console.log('🖱️ Appel handleOpenFolder')
                                  handleOpenFolder(dossier)
                                } else {
                                  console.log('❌ Pas de folderId')
                                  setError('Ce dossier n\'est pas lié à un dossier de fichiers')
                                }
                              }}
                              className={dossier.folderId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                            >
                              <FolderOpen className="mr-2 h-4 w-4" />
                              {dossier.folderId ? 'Consulter le dossier' : 'Pas de dossier de fichiers'}
                            </DropdownMenuItem>
                            {dossier.statut === 'EN_ATTENTE' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Vérifier si les deux validations sont complètes
                                    if (dossier.validationStatus?.canValidate) {
                                      setSelectedDossier(dossier)
                                      setValidationOpen(true)
                                    } else {
                                      // Afficher un message d'information
                                      setError(dossier.validationStatus ? 
                                        `Validation impossible: ${dossier.validationStatus.missingValidations.join(', ')}` : 
                                        'Veuillez d\'abord effectuer les validations requises')
                                    }
                                  }}
                                  className={dossier.validationStatus?.canValidate ? "text-green-600" : "text-gray-400 cursor-not-allowed"}
                                  disabled={!dossier.validationStatus?.canValidate}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {dossier.validationStatus?.canValidate ? 'Valider' : 'Valider (validations requises)'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDossier(dossier)
                                    setRejectionOpen(true)
                                  }}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Rejeter
                                </DropdownMenuItem>
                              </>
                            )}
                            {dossier.statut === 'VALIDÉ_CB' && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setError('Ce dossier a déjà été validé et ne peut plus être rejeté')
                                  toast.info('Ce dossier a déjà été validé')
                                }}
                                className="text-gray-400 cursor-not-allowed"
                                disabled
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Déjà validé
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </ResponsiveTableWrapper>
            ) : (
              <EmptyState
                icon={<FileText className="h-10 w-10 text-muted-foreground" />}
                title="Aucun dossier"
                description="Aucun dossier en attente de validation."
              />
            )}
            {error && (
              <p className="text-sm text-destructive mt-4">{error}</p>
            )}
      </ContentSection>
        {/* Modal de validation */}
        <Dialog open={validationOpen} onOpenChange={setValidationOpen}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Valider le dossier</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir valider le dossier {selectedDossier?.numeroDossier} ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setValidationOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => selectedDossier && handleValidate(selectedDossier)}
                disabled={actionLoading || selectedDossier?.statut !== 'EN_ATTENTE'}
                className={selectedDossier?.statut === 'EN_ATTENTE' ? 
                  "bg-green-600 hover:bg-green-700" : 
                  "bg-gray-400 cursor-not-allowed"}
              >
                {actionLoading ? 'Validation...' : 
                 selectedDossier?.statut !== 'EN_ATTENTE' ? 'Dossier déjà validé' : 'Valider'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de rejet */}
        <Dialog open={rejectionOpen} onOpenChange={setRejectionOpen}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Rejeter le dossier</DialogTitle>
              <DialogDescription>
                Veuillez indiquer la raison du rejet pour le dossier {selectedDossier?.numeroDossier}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Raison du rejet</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Expliquez pourquoi ce dossier est rejeté..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setRejectionOpen(false)
                setRejectionReason('')
              }}>
                Annuler
              </Button>
              <Button 
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading ? 'Rejet...' : 'Rejeter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de détails du dossier */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Détails du dossier</DialogTitle>
              <DialogDescription>
                Informations complètes du dossier {selectedDossier?.numeroDossier}
              </DialogDescription>
            </DialogHeader>
            {selectedDossier && (
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Numéro du dossier</Label>
                    <p className="text-sm bg-muted p-2 rounded text-reference">{selectedDossier.numeroDossier}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nom du dossier</Label>
                    <p className="text-sm bg-muted p-2 rounded">{selectedDossier.folderName || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Objet de l'opération</Label>
                    <p className="text-sm bg-muted p-2 rounded">{selectedDossier.objetOperation}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Bénéficiaire</Label>
                    <p className="text-sm bg-muted p-2 rounded">{selectedDossier.beneficiaire}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date de dépôt</Label>
                    <p className="text-sm bg-muted p-2 rounded">
                      <span className="text-date">{new Date(selectedDossier.dateDepot).toLocaleDateString('fr-FR')}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Statut</Label>
                    <div className="flex items-center gap-2">
                      {getStatutBadge(selectedDossier.statut)}
                    </div>
                  </div>
                </div>
                {/* Poste comptable */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Poste Comptable</Label>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium">{selectedDossier.poste_comptable?.numero || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{selectedDossier.poste_comptable?.intitule || 'N/A'}</p>
                  </div>
                </div>
                {/* Nature du document */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nature du Document</Label>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium">{selectedDossier.nature_document?.numero || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{selectedDossier.nature_document?.nom || 'N/A'}</p>
                  </div>
                </div>
                {/* Secrétaire */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Secrétaire</Label>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium">{selectedDossier.secretaire?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{selectedDossier.secretaire?.email || 'N/A'}</p>
                  </div>
                </div>
                {/* Dates */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date de création</Label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {new Date(selectedDossier.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Dernière modification</Label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {new Date(selectedDossier.updatedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Fermer
              </Button>
              <div className="flex gap-2">
                {selectedDossier?.statut === 'EN_ATTENTE' ? (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setDetailsOpen(false)
                      setRejectionOpen(true)
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeter
                  </Button>
                ) : selectedDossier?.statut === 'VALIDÉ_CB' ? (
                  <Button 
                    variant="outline"
                    disabled
                    className="text-gray-400 border-gray-200 cursor-not-allowed"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Déjà validé
                  </Button>
                ) : null}
                  {selectedDossier?.statut === 'EN_ATTENTE' ? (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setDetailsOpen(false)
                        handleOperationTypeValidation(selectedDossier)
                      }}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Valider Type d'Opération
                    </Button>
                  ) : selectedDossier?.statut === 'VALIDÉ_CB' ? (
                    <Button 
                      variant="outline"
                      disabled
                      className="text-gray-400 border-gray-200 cursor-not-allowed"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Type d'Opération validé
                    </Button>
                  ) : null}
                  {selectedDossier?.statut === 'EN_ATTENTE' ? (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setDetailsOpen(false)
                        setControlesFondOpen(true)
                      }}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Contrôles de Fond
                    </Button>
                  ) : selectedDossier?.statut === 'VALIDÉ_CB' ? (
                    <Button 
                      variant="outline"
                      disabled
                      className="text-gray-400 border-gray-200 cursor-not-allowed"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Contrôles validés
                    </Button>
                  ) : null}
                  <Button 
                    onClick={() => {
                      setDetailsOpen(false)
                      // Vérifier si le dossier est en attente
                      if (selectedDossier?.statut !== 'EN_ATTENTE') {
                        setError('Ce dossier a déjà été validé et ne peut plus être modifié')
                        return
                      }
                      // Vérifier si les deux validations sont complètes
                      if (selectedDossier?.validationStatus?.canValidate) {
                        setValidationOpen(true)
                      } else {
                        setError(selectedDossier?.validationStatus ? 
                          `Validation impossible: ${selectedDossier.validationStatus.missingValidations.join(', ')}` : 
                          'Veuillez d\'abord effectuer les validations requises')
                      }
                    }}
                    disabled={!selectedDossier?.validationStatus?.canValidate || selectedDossier?.statut !== 'EN_ATTENTE'}
                    className={selectedDossier?.validationStatus?.canValidate && selectedDossier?.statut === 'EN_ATTENTE' ? 
                      "bg-green-600 hover:bg-green-700" : 
                      "bg-gray-400 cursor-not-allowed"}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {selectedDossier?.statut !== 'EN_ATTENTE' ? 'Dossier déjà validé' :
                     selectedDossier?.validationStatus?.canValidate ? 'Valider' : 'Valider (validations requises)'}
                  </Button>
                </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      {/* Formulaire de validation du type d'opération */}
      {operationTypeValidationOpen && selectedDossier && (
        <ModalBackdrop 
          className="p-4"
          onClick={() => {
            setOperationTypeValidationOpen(false)
            setSelectedDossier(null)
          }}
        >
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
            <OperationTypeValidationForm
              dossierId={selectedDossier.id}
              dossierNumero={selectedDossier.numeroDossier}
              onValidationComplete={handleOperationTypeValidationComplete}
              onCancel={() => {
                setOperationTypeValidationOpen(false)
                setSelectedDossier(null)
              }}
              mode={selectedDossier.statut === 'EN_ATTENTE' ? 'validation' : 'consultation'}
            />
          </div>
        </ModalBackdrop>
      )}
      {/* Formulaire de contrôle de fond */}
      {controlesFondOpen && selectedDossier && (
        <ModalBackdrop 
          className="p-2"
          onClick={() => {
            setControlesFondOpen(false)
            setSelectedDossier(null)
          }}
        >
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-background rounded-lg shadow-xl">
            <div className="p-4">
              <ControlesFondForm
                dossierId={selectedDossier.id}
                dossierNumero={selectedDossier.numeroDossier}
                onValidationComplete={(success) => {
                  if (success) {
                    loadDossiers()
                    toast.success('Contrôles de fond validés avec succès')
                  }
                  setControlesFondOpen(false)
                  setSelectedDossier(null)
                }}
                onCancel={() => {
                  setControlesFondOpen(false)
                  setSelectedDossier(null)
                }}
                mode={selectedDossier.statut === 'EN_ATTENTE' ? 'validation' : 'consultation'}
              />
            </div>
          </div>
        </ModalBackdrop>
      )}
      {/* Consultation Type d'Opération */}
      {operationTypeConsultationOpen && selectedDossier && (
        <ModalBackdrop 
          className="p-2"
          onClick={() => {
            setOperationTypeConsultationOpen(false)
            setSelectedDossier(null)
          }}
        >
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-background rounded-lg shadow-xl">
            <div className="p-4">
              <OperationTypeConsultation
                dossierId={selectedDossier.id}
                dossierNumero={selectedDossier.numeroDossier}
                onClose={() => {
                  setOperationTypeConsultationOpen(false)
                  setSelectedDossier(null)
                }}
              />
            </div>
          </div>
        </ModalBackdrop>
      )}
      {/* Consultation Contrôles de Fond */}
      {controlesFondConsultationOpen && selectedDossier && (
        <ModalBackdrop 
          className="p-2"
          onClick={() => {
            setControlesFondConsultationOpen(false)
            setSelectedDossier(null)
          }}
        >
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-background rounded-lg shadow-xl">
            <div className="p-4">
              <ControlesFondConsultation
                dossierId={selectedDossier.id}
                dossierNumero={selectedDossier.numeroDossier}
                onClose={() => {
                  setControlesFondConsultationOpen(false)
                  setSelectedDossier(null)
                }}
              />
            </div>
          </div>
        </ModalBackdrop>
      )}
      {/* Panel de diagnostic */}
      {/* <DiagnosticPanel /> Supprimé car composant debug supprimé */}
    </CompactPageLayout>
  )
}
export default function CBDashboardPage() {
  return (
    <ControleurBudgetaireGuard>
      <CBDashboardContent />
    </ControleurBudgetaireGuard>
  )
}
