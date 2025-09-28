'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { CompactPageLayout, PageHeader, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import CompactStats from '@/components/shared/compact-stats'
import { SecretaireGuard } from '@/components/auth/role-guard'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { DocumentEditModal } from '@/components/documents/document-edit-modal'
import { DocumentShareModal } from '@/components/documents/document-share-modal'
import { DocumentPreviewModal } from '@/components/ui/document-preview-modal'
import { ModernUploadModal } from '@/components/upload/modern-upload-modal'
import { XCircle, 
  Clock, 
  FileText, 
  MoreHorizontal, 
  Eye, 
  ArrowLeft, 
  Search,
  RefreshCw,
  AlertTriangle,
  Edit,
  Send,
  Trash2,
  Save,
  Download,
  Share2,
  Folder,
  Upload
 } from 'lucide-react'
interface DossierSecrétaire {
  id: string
  numeroDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire: string
  statut: 'EN_ATTENTE' | 'VALIDÉ_CB' | 'REJETÉ_CB' | 'VALIDÉ_ORDONNATEUR' | 'PAYÉ' | 'TERMINÉ'
  dateDepot: string
  folderId?: string
  folderName?: string
  folder?: {
    id: string
    name: string
    description?: string
  }
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
}
function SecretaireRejectedContent() {
  const { user } = useSupabaseAuth()
  const router = useRouter()
  // États pour la gestion des dossiers
  const [dossiers, setDossiers] = React.useState<DossierSecrétaire[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [sortField, setSortField] = React.useState<'numeroDossier' | 'dateDepot' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  // États pour les actions
  const [selectedDossier, setSelectedDossier] = React.useState<DossierSecrétaire | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [resubmitOpen, setResubmitOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  // États pour l'édition
  const [editForm, setEditForm] = React.useState({
    numeroDossier: '',
    numeroNature: '',
    objetOperation: '',
    beneficiaire: '',
    dateDepot: ''
  })
  // États pour l'affichage du contenu du dossier
  const [currentFolder, setCurrentFolder] = React.useState<any>(null)
  const [documents, setDocuments] = React.useState<any[]>([])
  const [documentsLoading, setDocumentsLoading] = React.useState(false)
  const [documentsError, setDocumentsError] = React.useState('')
  const [selectedDocument, setSelectedDocument] = React.useState<any>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [shareModalOpen, setShareModalOpen] = React.useState(false)
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false)
  // Vérifier si l'utilisateur est secrétaire
  React.useEffect(() => {
    if (user?.role !== 'SECRETAIRE') {
      router.push('/dashboard')
    }
  }, [user, router])
  // Charger les dossiers rejetés
  const loadDossiers = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch('/api/dossiers/secretaire-rejected', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Dossiers rejetés chargés:', data.dossiers)
        data.dossiers?.forEach((dossier: any, index: number) => {
          console.log(`  ${index + 1}. ${dossier.numeroDossier} - folderId: ${dossier.folderId} - foldername: ${dossier.folderName}`)
        })
        setDossiers(data.dossiers || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors du chargement des dossiers')
      }
    } catch (error) {
      console.error('Erreur chargement dossiers rejetés:', error)
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
    // Filtrage par recherche textuelle
    if (query) {
      items = items.filter(d => 
        d.numeroDossier.toLowerCase().includes(query.toLowerCase()) ||
        d.objetOperation.toLowerCase().includes(query.toLowerCase()) ||
        d.beneficiaire.toLowerCase().includes(query.toLowerCase()) ||
        (d.folderName && d.folderName.toLowerCase().includes(query.toLowerCase()))
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
  }, [dossiers, query, sortField, sortOrder])
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
  // Fonction pour ouvrir le modal d'édition
  const handleEdit = (dossier: DossierSecrétaire) => {
    setSelectedDossier(dossier)
    setEditForm({
      numeroDossier: dossier.numeroDossier,
      numeroNature: dossier.numeroNature,
      objetOperation: dossier.objetOperation,
      beneficiaire: dossier.beneficiaire,
      dateDepot: dossier.dateDepot
    })
    setEditOpen(true)
  }
  // Fonction pour sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!selectedDossier) return
    try {
      setActionLoading(true)
      const response = await fetch(`/api/dossiers/${selectedDossier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      })
      if (response.ok) {
        setEditOpen(false)
        setSelectedDossier(null)
        await loadDossiers() // Recharger la liste
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      console.error('Erreur modification:', error)
      setError('Erreur lors de la modification')
    } finally {
      setActionLoading(false)
    }
  }
  // Fonction pour resoumettre un dossier
  const handleResubmit = async (dossier: DossierSecrétaire) => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/dossiers/${dossier.id}/resubmit`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        setResubmitOpen(false)
        await loadDossiers() // Recharger la liste
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la resoumission')
      }
    } catch (error) {
      console.error('Erreur resoumission:', error)
      setError('Erreur lors de la resoumission')
    } finally {
      setActionLoading(false)
    }
  }
  // Fonction pour supprimer un dossier
  const handleDelete = async (dossier: DossierSecrétaire) => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/dossiers/${dossier.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        setDeleteOpen(false)
        setSelectedDossier(null)
        await loadDossiers() // Recharger la liste
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      setError('Erreur lors de la suppression')
    } finally {
      setActionLoading(false)
    }
  }
  // Fonction pour ouvrir un dossier et voir son contenu
  const handleOpenFolder = async (dossier: DossierSecrétaire) => {
    console.log('🚀 FONCTION handleOpenFolder APPELÉE (dossiers rejetés)')
    console.log('🔍 Tentative d\'ouverture du dossier:', dossier)
    console.log('🔍 folderId:', dossier.folderId)
    console.log('🔍 foldername:', dossier.folderName)
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
  // Fonction pour revenir à la liste des dossiers rejetés
  const handleBackToRejected = () => {
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
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error)
    }
  }
  const handleDeleteDocument = async (document: any) => {
    try {
      // Utiliser l'originalId (UUID de la base de données) au lieu de l'id généré côté client
      const documentId = document.originalId || document.id
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      if (response.ok && currentFolder) {
        await loadFolderDocuments(currentFolder.id)
      }
    } catch (error) {
      console.error('Erreur suppression document:', error)
    }
  }
  // Fonction pour ouvrir l'upload modal
  const handleOpenUploadModal = () => {
    setUploadModalOpen(true)
  }
  // Fonction pour recharger les documents après upload
  const handleUploadSuccess = () => {
    if (currentFolder) {
      loadFolderDocuments(currentFolder.id)
    }
  }
  if (user?.role !== 'SECRETAIRE') {
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
  // Vue du contenu du dossier
  if (currentFolder) {
    return (
      <CompactPageLayout>
        <div className="space-y-6">
          {/* Header avec bouton retour */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToRejected}
                  className="p-0 h-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour aux dossiers rejetés
                </Button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-title-bold text-primary">{currentFolder.name}</h1>
              <p className="text-primary text-sm sm:text-base">{currentFolder.description}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => currentFolder && loadFolderDocuments(currentFolder.id)} className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Rafraîchir
              </Button>
              <Button onClick={handleOpenUploadModal} className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Ajouter des documents
              </Button>
            </div>
          </div>
          {/* Stats du dossier */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taille totale</CardTitle>
                <Folder className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.reduce((total, doc) => total + (doc.size || 0), 0) > 0 
                    ? `${(documents.reduce((total, doc) => total + (doc.size || 0), 0) / 1024 / 1024).toFixed(1)} MB`
                    : '0 MB'
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dernière modification</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {currentFolder.updatedAt 
                    ? new Date(currentFolder.updatedAt).toLocaleDateString('fr-FR')
                    : 'Date inconnue'
                  }
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Liste des documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents du dossier</CardTitle>
              <CardDescription>
                {documents.length} document{documents.length > 1 ? 's' : ''} dans ce dossier
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : documentsError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
                  <h3 className="mt-2 text-sm font-title-medium text-red-600">Erreur de chargement</h3>
                  <p className="mt-1 text-sm text-red-500">{documentsError}</p>
                </div>
              ) : documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date de création</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">{document.fileName || document.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {document.category || 'Non classé'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {document.size ? `${(document.size / 1024 / 1024).toFixed(1)} MB` : 'Taille inconnue'}
                        </TableCell>
                        <TableCell>{document.type || 'Type inconnu'}</TableCell>
                        <TableCell>
                          {document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDocument(document)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                                <Download className="mr-2 h-4 w-4" />
                                Télécharger
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareDocument(document)}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Partager
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditDocument(document)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteDocument(document)}
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
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-title-medium">Aucun document</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ce dossier ne contient aucun document.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
                onSave={() => currentFolder && loadFolderDocuments(currentFolder.id)}
              />
              <DocumentShareModal
                document={selectedDocument}
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
              />
            </>
          )}
          {/* Modal d'upload */}
          <ModernUploadModal
            isOpen={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            folderId={currentFolder?.id}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>
      </CompactPageLayout>
    )
  }
  return (
    <CompactPageLayout>
      <PageHeader
        title="Mes Dossiers Rejetés"
        subtitle="Consultez et gérez vos dossiers rejetés par le contrôleur budgétaire"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={loadDossiers} 
              className="w-full sm:w-auto h-8"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/folders')}
              className="w-full sm:w-auto h-8"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>
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
            placeholder="Rechercher par numéro, objet, bénéficiaire ou nom de dossier..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 h-8"
          />
        </div>
      </ContentSection>
      <CompactStats
        stats={[
          {
            label: "Total Rejetés",
            value: dossiers.length,
            icon: <XCircle className="h-4 w-4 text-red-600" />,
            color: "text-red-600"
          },
          {
            label: "Ce mois",
            value: dossiers.filter(d => {
              const dossierDate = new Date(d.createdAt)
              const now = new Date()
              return dossierDate.getMonth() === now.getMonth() && dossierDate.getFullYear() === now.getFullYear()
            }).length,
            icon: <Clock className="h-4 w-4 text-blue-600" />,
            color: "text-blue-600"
          },
          {
            label: "Avec nom de dossier",
            value: dossiers.filter(d => d.folderName).length,
            icon: <FileText className="h-4 w-4 text-green-600" />,
            color: "text-green-600"
          }
        ]}
        columns={3}
      />
      <ContentSection
        title="Mes dossiers rejetés"
        subtitle={`${filteredDossiers.length} dossier${filteredDossiers.length > 1 ? 's' : ''} rejeté${filteredDossiers.length > 1 ? 's' : ''} trouvé${filteredDossiers.length > 1 ? 's' : ''} - 💡 Cliquez sur une ligne pour ouvrir le dossier ou voir les détails`}
      >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredDossiers.length > 0 ? (
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
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDossiers.map((dossier) => (
                    <TableRow 
                      key={dossier.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        console.log('🖱️ Clic direct sur la ligne du dossier rejeté:', dossier.numeroDossier)
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
                        {dossier.folder?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{dossier.objetOperation}</TableCell>
                      <TableCell>{dossier.beneficiaire}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-code">{dossier.poste_comptable?.numero || 'Non défini'}</div>
                          <div className="text-muted-foreground">{dossier.poste_comptable?.intitule || 'Aucun intitulé'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-date">{new Date(dossier.dateDepot).toLocaleDateString('fr-FR')}</span>
                      </TableCell>
                      <TableCell>{getStatutBadge(dossier.statut)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('🖱️ Clic sur le bouton menu pour dossier rejeté:', dossier.numeroDossier)
                              }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
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
                            {dossier.folderId ? (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  console.log('🖱️ Clic sur "Ouvrir dossier" via menu pour:', dossier.numeroDossier)
                                  handleOpenFolder(dossier)
                                }}
                              >
                                <Folder className="mr-2 h-4 w-4" />
                                Ouvrir dossier
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled>
                                <Folder className="mr-2 h-4 w-4" />
                                Pas de dossier de fichiers
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(dossier)
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDossier(dossier)
                              setResubmitOpen(true)
                            }}>
                              <Send className="mr-2 h-4 w-4" />
                              Resoumettre
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedDossier(dossier)
                                setDeleteOpen(true)
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
            ) : (
              <div className="text-center py-8">
                <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-title-medium">Aucun dossier rejeté</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aucun de vos dossiers n'a été rejeté.
                </p>
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
      </ContentSection>
        {/* Modal de détails du dossier */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Détails du dossier rejeté</DialogTitle>
              <DialogDescription>
                Informations complètes du dossier {selectedDossier?.numeroDossier}
              </DialogDescription>
            </DialogHeader>
            {selectedDossier && (
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-title-medium">Numéro du dossier</Label>
                    <p className="text-sm bg-muted p-2 rounded text-reference">{selectedDossier.numeroDossier}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-title-medium">Nom du dossier</Label>
                    <p className="text-sm bg-muted p-2 rounded">{selectedDossier.folder?.name || 'Aucun dossier lié'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-title-medium">Objet de l'opération</Label>
                    <p className="text-sm bg-muted p-2 rounded">{selectedDossier.objetOperation}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-title-medium">Bénéficiaire</Label>
                    <p className="text-sm bg-muted p-2 rounded">{selectedDossier.beneficiaire}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-title-medium">Date de dépôt</Label>
                    <p className="text-sm bg-muted p-2 rounded">
                      <span className="text-date">{new Date(selectedDossier.dateDepot).toLocaleDateString('fr-FR')}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-title-medium">Statut</Label>
                    <div className="flex items-center gap-2">
                      {getStatutBadge(selectedDossier.statut)}
                    </div>
                  </div>
                </div>
                {/* Poste comptable */}
                <div className="space-y-2">
                  <Label className="text-sm font-title-medium">Poste Comptable</Label>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium">{selectedDossier.poste_comptable?.numero || 'Non défini'}</p>
                    <p className="text-sm text-muted-foreground">{selectedDossier.poste_comptable?.intitule || 'Aucun intitulé'}</p>
                  </div>
                </div>
                {/* Nature du document */}
                <div className="space-y-2">
                  <Label className="text-sm font-title-medium">Nature du Document</Label>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium">{selectedDossier.nature_document?.numero || 'Non définie'}</p>
                    <p className="text-sm text-muted-foreground">{selectedDossier.nature_document?.nom || 'Aucun nom'}</p>
                  </div>
                </div>
                {/* Dates */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-title-medium">Date de création</Label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {new Date(selectedDossier.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-title-medium">Dernière modification</Label>
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
              <Button 
                onClick={() => {
                  setDetailsOpen(false)
                  handleEdit(selectedDossier!)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal d'édition du dossier */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Modifier le dossier</DialogTitle>
              <DialogDescription>
                Modifiez les informations du dossier {selectedDossier?.numeroDossier}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numeroDossier">Numéro du dossier</Label>
                  <Input
                    id="numeroDossier"
                    value={editForm.numeroDossier}
                    onChange={(e) => setEditForm(prev => ({ ...prev, numeroDossier: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroNature">Numéro nature</Label>
                  <Input
                    id="numeroNature"
                    value={editForm.numeroNature}
                    onChange={(e) => setEditForm(prev => ({ ...prev, numeroNature: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objetOperation">Objet de l'opération</Label>
                <Input
                  id="objetOperation"
                  value={editForm.objetOperation}
                  onChange={(e) => setEditForm(prev => ({ ...prev, objetOperation: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiaire">Bénéficiaire</Label>
                <Input
                  id="beneficiaire"
                  value={editForm.beneficiaire}
                  onChange={(e) => setEditForm(prev => ({ ...prev, beneficiaire: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateDepot">Date de dépôt</Label>
                <Input
                  id="dateDepot"
                  type="date"
                  value={editForm.dateDepot}
                  onChange={(e) => setEditForm(prev => ({ ...prev, dateDepot: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {actionLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de confirmation de resoumission */}
        <Dialog open={resubmitOpen} onOpenChange={setResubmitOpen}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Resoumettre le dossier</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir resoumettre le dossier {selectedDossier?.numeroDossier} ? 
                Il sera envoyé à nouveau pour validation par le contrôleur budgétaire.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResubmitOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => selectedDossier && handleResubmit(selectedDossier)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="mr-2 h-4 w-4" />
                {actionLoading ? 'Resoumission...' : 'Resoumettre'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de confirmation de suppression */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Supprimer le dossier</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer définitivement le dossier {selectedDossier?.numeroDossier} ? 
                Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => selectedDossier && handleDelete(selectedDossier)}
                disabled={actionLoading}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {actionLoading ? 'Suppression...' : 'Supprimer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </CompactPageLayout>
  )
}
export default function SecretaireRejectedPage() {
  return (
    <SecretaireGuard>
      <SecretaireRejectedContent />
    </SecretaireGuard>
  )
}
