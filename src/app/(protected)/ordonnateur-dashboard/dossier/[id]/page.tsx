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
  Loader2,
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
  // Charger les documents du dossier
  const loadDossierDocuments = React.useCallback(async (folderId: string) => {
    try {
      console.log('📁 Chargement des documents du dossier:', folderId)
      setDocumentsLoading(true)
      setDocumentsError('')
      // Charger les détails du dossier
      console.log('📁 Appel API dossier:', `/api/folders/${folderId}`)
      const folderRes = await fetch(`/api/folders/${folderId}`)
      console.log('📁 Réponse API dossier:', folderRes.status, folderRes.ok)
      if (folderRes.ok) {
        const folderData = await folderRes.json()
        console.log('📁 Données dossier reçues:', folderData)
        setCurrentFolder(folderData.folder || folderData)
      } else {
        const errorData = await folderRes.text()
        console.error('❌ Erreur API dossier:', folderRes.status, errorData)
        setDocumentsError(`Erreur lors du chargement du dossier (${folderRes.status})`)
      }
      // Charger les documents du dossier
      console.log('📄 Appel API documents:', `/api/documents?folderId=${folderId}`)
      const documentsRes = await fetch(`/api/documents?folderId=${folderId}`)
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
      const folderId = dossier.folderId || dossier.folder_id
      if (folderId) {
        loadDossierDocuments(folderId)
      }
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
          const folderId = dossier.folderId || dossier.folder_id
          if (folderId) {
            await loadDossierDocuments(folderId)
          }
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                loadDossierDetails()
                if (dossier) {
                  const folderId = dossier.folderId || dossier.folder_id
                  if (folderId) {
                    loadDossierDocuments(folderId)
                  }
                }
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
            {dossier.statut === 'VALIDÉ_CB' && (
              <Button 
                onClick={() => setOrdonnancementOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Ordonner
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/ordonnateur-dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>
        }
      />
        {/* Informations du dossier */}
        <ContentSection title="Informations du dossier">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Bénéficiaire</p>
                <p className="text-sm font-medium">{dossier.beneficiaire}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Poste Comptable</p>
                <p className="text-sm font-medium">
                  {dossier.poste_comptable?.numero || 'N/A'} - {dossier.poste_comptable?.intitule || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date de dépôt</p>
                <p className="text-sm font-medium">{formatDate(dossier.dateDepot)}</p>
              </div>
            </div>
          </div>
        </ContentSection>
        {/* Stats du dossier */}
        <ContentSection title="Statistiques">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Documents</p>
                <p className="text-lg font-title-semibold">{documents.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Folder className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Taille</p>
                <p className="text-lg font-title-semibold">
                  {documents.reduce((total, doc) => total + (doc.fileSize || 0), 0) > 0 
                    ? `${(documents.reduce((total, doc) => total + (doc.fileSize || 0), 0) / 1024 / 1024).toFixed(1)} MB`
                    : '0 MB'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Statut</p>
                <Badge className={`${statutInfo.className} border text-xs`}>
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
            <div className="flex gap-2">
              <select 
                value={documentSortField} 
                onChange={(e) => setDocumentSortField(e.target.value as any)}
                className="px-3 py-1 border border-input bg-background rounded-md text-sm h-8"
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
                className="h-8"
              >
                {documentSortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          }
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher dans les documents..."
              value={documentSearchQuery}
              onChange={(e) => setDocumentSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-8"
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
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="font-semibold">Nom</TableHead>
                  <TableHead className="font-semibold">Catégorie</TableHead>
                  <TableHead className="font-semibold">Taille</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Date de création</TableHead>
                  <TableHead className="w-20 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document, index) => (
                  <TableRow key={document.id} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                    <TableCell className="font-medium py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{document.fileName || document.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {document.category || 'Non classé'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      <span className="text-number">
                        {document.fileSize ? 
                          `${(document.fileSize / 1024 / 1024).toFixed(1)} MB` : 
                          'N/A'
                        }
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      {document.fileType || 'N/A'}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      <span className="text-date">
                        {document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDocument(document)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadDocument(document)
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShareDocument(document)
                            }}
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            Partager
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditDocument(document)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDocument(document)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
        {/* Modal d'ordonnancement */}
        <Dialog open={ordonnancementOpen} onOpenChange={setOrdonnancementOpen}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Ordonner la dépense</DialogTitle>
              <DialogDescription>
                Ordonnez la dépense pour le dossier {dossier.numeroDossier}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ordonnancement-comment">Commentaire (optionnel)</Label>
                <Textarea
                  id="ordonnancement-comment"
                  placeholder="Ajoutez un commentaire sur l'ordonnancement..."
                  value={ordonnancementComment}
                  onChange={(e) => setOrdonnancementComment(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setOrdonnancementOpen(false)
                setOrdonnancementComment('')
              }}>
                Annuler
              </Button>
              <Button 
                onClick={handleOrdonnance}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ordonnancement...
                  </>
                ) : (
                  'Ordonner'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                  const folderId = dossier.folderId || dossier.folder_id
                  if (folderId) {
                    loadDossierDocuments(folderId)
                  }
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
