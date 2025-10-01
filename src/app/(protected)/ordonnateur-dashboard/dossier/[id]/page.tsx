'use client'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { CompactPageLayout, PageHeader, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import { OrdonnateurGuard } from '@/components/auth/role-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingState } from '@/components/ui/loading-states'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle,
  XCircle,
  Clock,
  FileText,
  MoreHorizontal,
  Eye,
  ArrowLeft,
  Download,
  Share2,
  Search,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Folder,
  Calendar,
  User,
  Tag,
  Edit,
  Trash2
 } from 'lucide-react'
import { DocumentEditModal } from '@/components/documents/document-edit-modal'
import { DocumentShareModal } from '@/components/documents/document-share-modal'
import { DocumentPreviewModal } from '@/components/ui/document-preview-modal'
import { DocumentItem } from '@/types/document'
import { OrdonnancementModal } from '@/components/ordonnateur/ordonnancement-modal'
interface DossierComptable {
  id: string
  numeroDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire: string
  statut: 'EN_ATTENTE' | 'VALIDÉ_CB' | 'REJETÉ_CB' | 'VALIDÉ_ORDONNATEUR' | 'PAYÉ' | 'TERMINÉ'
  dateDepot: string
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
  folderId?: string
  folder_id?: string
  rejectionReason?: string
  rejectionDetails?: string
  rejectedAt?: string
}
function DossierDetailContent() {
  const { user } = useSupabaseAuth()
  const router = useRouter()
  const params = useParams()
  const dossierId = params.id as string
  // États pour la gestion du dossier
  const [dossier, setDossier] = React.useState<DossierComptable | null>(null)
  const [isLoadingDossier, setIsLoadingDossier] = React.useState(true)
  const [dossierError, setDossierError] = React.useState('')
  // États pour la gestion des documents
  const [currentFolder, setCurrentFolder] = React.useState<any>(null)
  const [documents, setDocuments] = React.useState<DocumentItem[]>([])
  const [filteredDocuments, setFilteredDocuments] = React.useState<DocumentItem[]>([])
  const [documentsLoading, setDocumentsLoading] = React.useState(false)
  const [documentsError, setDocumentsError] = React.useState('')
  // États pour la recherche et le tri des documents
  const [documentSearchQuery, setDocumentSearchQuery] = React.useState('')
  const [documentSortField, setDocumentSortField] = React.useState<'title' | 'createdAt' | 'updatedAt' | 'fileSize' | 'fileType'>('updatedAt')
  const [documentSortOrder, setDocumentSortOrder] = React.useState<'asc' | 'desc'>('desc')
  // États pour les modales de documents
  const [selectedDocument, setSelectedDocument] = React.useState<DocumentItem | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [shareModalOpen, setShareModalOpen] = React.useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [documentToDelete, setDocumentToDelete] = React.useState<DocumentItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  // États pour l'ordonnancement
  const [ordonnancementOpen, setOrdonnancementOpen] = React.useState(false)
  const [ordonnancementComment, setOrdonnancementComment] = React.useState('')
  const [actionLoading, setActionLoading] = React.useState(false)
  // Charger les détails du dossier
  const loadDossierDetails = React.useCallback(async () => {
    if (!dossierId) return
    try {
      setIsLoadingDossier(true)
      setDossierError('')
      const response = await fetch(`/api/dossiers/${dossierId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setDossier(data.dossier || data)
      } else {
        const errorData = await response.json()
        setDossierError(errorData.error || 'Erreur lors du chargement du dossier')
      }
    } catch (error) {
      console.error('Erreur chargement dossier:', error)
      setDossierError('Erreur de connexion')
    } finally {
      setIsLoadingDossier(false)
    }
  }, [dossierId])
  // Charger les documents du dossier comptable
  const loadDossierDocuments = React.useCallback(async (dossierId: string) => {
    try {
      console.log('📁 Chargement des documents du dossier comptable:', dossierId)
      setDocumentsLoading(true)
      setDocumentsError('')

      // Charger les documents liés au dossier comptable (architecture définitive)
      console.log('📄 Appel API documents définitive:', `/api/documents-by-dossier-comptable?dossier_comptable_id=${dossierId}`)
      const documentsRes = await fetch(`/api/documents-by-dossier-comptable?dossier_comptable_id=${dossierId}`)
      console.log('📄 Réponse API documents:', documentsRes.status, documentsRes.ok)

      if (documentsRes.ok) {
        const response = await documentsRes.json()
        console.log('📄 Données documents reçues:', response)
        // L'API retourne { documents: [...], pagination: {...} }
        const documentsArray = response.documents || []
        console.log('📄 Nombre de documents trouvés:', documentsArray.length)

        // Adapter les données pour correspondre à notre interface
        const adaptedDocuments = documentsArray.map((doc: any): DocumentItem => ({
          ...doc,
          fileName: doc.fileName || doc.currentVersion?.fileName || 'document',
          fileSize: doc.fileSize || doc.currentVersion?.fileSize || 0,
          fileType: doc.fileType || doc.currentVersion?.fileType || 'unknown',
          filePath: doc.filePath || doc.currentVersion?.filePath || '',
          tags: doc.tags || [],
          author: doc.author || { id: 'unknown', name: 'Utilisateur inconnu', email: 'unknown@example.com' },
          _count: {
            comments: doc._count?.comments || 0,
            shares: doc._count?.shares || 0
          }
        }))
        setDocuments(adaptedDocuments)
        setFilteredDocuments(adaptedDocuments)
      } else {
        const errorData = await documentsRes.text()
        console.error('❌ Erreur API documents:', documentsRes.status, errorData)
        setDocumentsError(`Erreur lors du chargement des documents (${documentsRes.status})`)
      }
    } catch (error) {
      console.error('❌ Erreur chargement documents:', error)
      setDocumentsError('Erreur lors du chargement des documents')
    } finally {
      setDocumentsLoading(false)
    }
  }, [])
  // Charger les données au montage
  React.useEffect(() => {
    loadDossierDetails()
  }, [loadDossierDetails])
  // Charger les documents quand le dossier est chargé
  React.useEffect(() => {
    if (dossier) {
      loadDossierDocuments(dossier.id)
    }
  }, [dossier, loadDossierDocuments])
  // Filtrage et tri des documents
  React.useEffect(() => {
    let filtered = documents.filter(doc => {
      // Filtrage par recherche
      if (documentSearchQuery && 
          !doc.title.toLowerCase().includes(documentSearchQuery.toLowerCase()) &&
          !doc.description?.toLowerCase().includes(documentSearchQuery.toLowerCase()) &&
          !doc.fileName?.toLowerCase().includes(documentSearchQuery.toLowerCase())) {
        return false
      }
      return true
    })
    // Tri des documents
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      switch (documentSortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0
          break
        case 'updatedAt':
          aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          break
        case 'fileSize':
          aValue = a.fileSize || 0
          bValue = b.fileSize || 0
          break
        case 'fileType':
          aValue = a.fileType?.toLowerCase() || ''
          bValue = b.fileType?.toLowerCase() || ''
          break
        default:
          aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      }
      if (documentSortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })
    setFilteredDocuments(filtered)
  }, [documents, documentSearchQuery, documentSortField, documentSortOrder])
  // Fonctions pour gérer les documents
  const handleViewDocument = React.useCallback((document: DocumentItem) => {
    setSelectedDocument(document)
    setPreviewOpen(true)
  }, [])
  const handleEditDocument = React.useCallback((document: DocumentItem) => {
    setSelectedDocument(document)
    setEditModalOpen(true)
  }, [])
  const handleShareDocument = React.useCallback((document: DocumentItem) => {
    setSelectedDocument(document)
    setShareModalOpen(true)
  }, [])
  const handleDownloadDocument = async (document: DocumentItem) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = document.fileName || 'document'
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
    }
  }
  const handleDeleteDocument = (document: DocumentItem) => {
    setDocumentToDelete(document)
    setDeleteModalOpen(true)
  }
  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return
    try {
      setIsDeleting(true)
      const documentId = documentToDelete.originalId || documentToDelete.id
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        // Recharger les documents après suppression
        if (dossier) {
          await loadDossierDocuments(dossier.id)
        }
        setDeleteModalOpen(false)
        setDocumentToDelete(null)
      } else {
        console.error('Erreur lors de la suppression:', await response.text())
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  // Fonction pour ordonner le dossier
  const handleOrdonnance = async () => {
    if (!dossier) return
    try {
      setActionLoading(true)
      const response = await fetch(`/api/dossiers/${dossier.id}/ordonnance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ comment: ordonnancementComment })
      })
      if (response.ok) {
        // Recharger les détails du dossier
        await loadDossierDetails()
        setOrdonnancementOpen(false)
        setOrdonnancementComment('')
      } else {
        const errorData = await response.json()
        console.error('Erreur ordonnancement:', errorData.error)
        alert('Erreur lors de l\'ordonnancement: ' + (errorData.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur ordonnancement:', error)
      alert('Erreur de connexion lors de l\'ordonnancement')
    } finally {
      setActionLoading(false)
    }
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
  const getStatutInfo = (statut: string) => {
    const statuts = {
      'EN_ATTENTE': { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'VALIDÉ_CB': { label: 'Validé CB', className: 'bg-green-100 text-green-800 border-green-200' },
      'REJETÉ_CB': { label: 'Rejeté CB', className: 'bg-red-100 text-red-800 border-red-200' },
      'VALIDÉ_ORDONNATEUR': { label: 'Validé Ordonnateur', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'PAYÉ': { label: 'Payé', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'TERMINÉ': { label: 'Terminé', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
    return statuts[statut as keyof typeof statuts] || { label: statut, className: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
  if (isLoadingDossier) {
    return (
      <CompactPageLayout>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      </CompactPageLayout>
    )
  }
  if (dossierError) {
    return (
      <CompactPageLayout>
        <EmptyState
          icon={<AlertTriangle className="h-10 w-10 text-destructive" />}
          title="Erreur"
          description={dossierError}
          action={{
            label: "Retour au dashboard",
            onClick: () => router.push('/ordonnateur-dashboard')
          }}
        />
      </CompactPageLayout>
    )
  }
  if (!dossier) {
    return (
      <CompactPageLayout>
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          title="Dossier non trouvé"
          description="Le dossier demandé n'existe pas ou n'est pas accessible."
          action={{
            label: "Retour au dashboard",
            onClick: () => router.push('/ordonnateur-dashboard')
          }}
        />
      </CompactPageLayout>
    )
  }
  const statutInfo = getStatutInfo(dossier.statut)
  return (
    <CompactPageLayout>
      {/* Header avec breadcrumb */}
      <PageHeader
        title={dossier.numeroDossier}
        subtitle={dossier.objetOperation}
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadDossierDetails()
                if (dossier) {
                  loadDossierDocuments(dossier.id)
                }
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Rafraîchir</span>
            </Button>
            {dossier.statut === 'VALIDÉ_CB' && (
              <Button
                onClick={() => setOrdonnancementOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Ordonner</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/ordonnateur-dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
          </div>
        }
      />
        {/* Informations du dossier */}
        <ContentSection title="Informations du dossier">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
              <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Bénéficiaire</p>
                <p className="text-sm font-medium text-foreground truncate">{dossier.beneficiaire}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Poste Comptable</p>
                <p className="text-sm font-medium text-foreground">
                  {dossier.poste_comptable?.numero || 'N/A'} - {dossier.poste_comptable?.intitule || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Date de dépôt</p>
                <p className="text-sm font-medium text-foreground">{formatDate(dossier.dateDepot)}</p>
              </div>
            </div>
          </div>
        </ContentSection>
        {/* Stats du dossier */}
        <ContentSection title="Statistiques">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
              <FileText className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Documents</p>
                <p className="text-xl font-title-semibold">{documents.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
              <Folder className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Taille totale</p>
                <p className="text-xl font-title-semibold">
                  {documents.reduce((total, doc) => total + (doc.fileSize || 0), 0) > 0
                    ? `${(documents.reduce((total, doc) => total + (doc.fileSize || 0), 0) / 1024 / 1024).toFixed(1)} MB`
                    : '0 MB'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Statut</p>
                <Badge className={`${statutInfo.className} border text-xs w-fit`}>
                  {statutInfo.label}
                </Badge>
              </div>
            </div>
          </div>
        </ContentSection>
        {/* Barre de recherche pour les documents */}
        <ContentSection
          title="Documents du dossier"
          subtitle={`${documents.length} document${documents.length > 1 ? 's' : ''} dans ce dossier`}
          actions={
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={documentSortField}
                onChange={(e) => setDocumentSortField(e.target.value as any)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[160px] h-9"
              >
                <option value="updatedAt">Date de modification</option>
                <option value="title">Nom</option>
                <option value="createdAt">Date de création</option>
                <option value="fileSize">Taille</option>
                <option value="fileType">Type</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDocumentSortOrder(documentSortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-9 px-3"
              >
                {documentSortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          }
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher dans les documents..."
              value={documentSearchQuery}
              onChange={(e) => setDocumentSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10"
            />
          </div>
        </ContentSection>
        {/* Contenu des documents */}
        {documentsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : documentsError ? (
          <EmptyState
            icon={<AlertTriangle className="h-10 w-10 text-destructive" />}
            title="Erreur de chargement"
            description={documentsError}
          />
        ) : filteredDocuments.length > 0 ? (
          <div className="overflow-hidden border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/50">
                  <TableHead className="font-semibold text-left">Nom du document</TableHead>
                  <TableHead className="font-semibold text-center hidden md:table-cell">Catégorie</TableHead>
                  <TableHead className="font-semibold text-center hidden lg:table-cell">Taille</TableHead>
                  <TableHead className="font-semibold text-center hidden lg:table-cell">Type</TableHead>
                  <TableHead className="font-semibold text-center hidden sm:table-cell">Date</TableHead>
                  <TableHead className="font-semibold text-center w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document, index) => (
                  <TableRow key={document.id} className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="truncate block max-w-[250px] font-medium">{document.fileName || document.title}</span>
                          <span className="text-xs text-muted-foreground md:hidden">
                            {document.fileSize ?
                              `${(document.fileSize / 1024 / 1024).toFixed(1)} MB` :
                              'N/A'
                            } • {document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {document.category || 'Non classé'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-center text-sm text-muted-foreground hidden lg:table-cell">
                      {document.fileSize ?
                        `${(document.fileSize / 1024 / 1024).toFixed(1)} MB` :
                        'N/A'
                      }
                    </TableCell>
                    <TableCell className="py-4 text-center text-sm text-muted-foreground hidden lg:table-cell">
                      {document.fileType || 'N/A'}
                    </TableCell>
                    <TableCell className="py-4 text-center text-sm text-muted-foreground hidden sm:table-cell">
                      {document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDocument(document)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Aperçu
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadDocument(document)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Télécharger
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShareDocument(document)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Share2 className="h-4 w-4" />
                            Partager
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditDocument(document)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDocument(document)
                            }}
                            className="text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-10 w-10 text-muted-foreground" />}
            title="Aucun document"
            description="Ce dossier ne contient aucun document."
          />
        )}
        {/* Modal d'ordonnancement - Composant réutilisable */}
        <OrdonnancementModal
          isOpen={ordonnancementOpen}
          onClose={() => {
            setOrdonnancementOpen(false)
            setOrdonnancementComment('')
          }}
          dossier={dossier}
          verificationSummary={null} // Pas de résumé des vérifications dans cette vue
          onOrdonnance={async (dossierId: string) => {
            await handleOrdonnance()
          }}
          isLoading={actionLoading}
          error={null}
        />
        {/* Modales pour les documents */}
        {selectedDocument && (
          <>
            <DocumentPreviewModal
              document={selectedDocument}
              isOpen={previewOpen}
              onClose={() => setPreviewOpen(false)}
              onDownload={(doc) => {
                // Logique de téléchargement
                console.log('Téléchargement du document:', doc.title)
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
                if (dossier) {
                  loadDossierDocuments(dossier.id)
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
        {/* Modal de confirmation de suppression de document */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer le document</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer ce document ? Cette action ne peut pas être annulée.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteDocument}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 h-4 w-4">
                      <LoadingState isLoading={true} size="sm" showText={false} noPadding={true} />
                    </div>
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </CompactPageLayout>
  )
}
export default function DossierDetailPage() {
  return (
    <OrdonnateurGuard>
      <DossierDetailContent />
    </OrdonnateurGuard>
  )
}
