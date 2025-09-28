'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { CompactPageLayout, PageHeader, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import { MainLayout } from '@/components/layout/main-layout'
import CompactStats from '@/components/shared/compact-stats'
import { ControleurBudgetaireGuard } from '@/components/auth/role-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ButtonLoading } from '@/components/ui/loading-states'
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
import { XCircle, 
  Clock, 
  FileText, 
  MoreHorizontal, 
  Eye, 
  ArrowLeft, 
  Search,
  RefreshCw,
  AlertTriangle,
  Folder,
  Download,
  Share2,
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
  folderName?: string
  folderDescription?: string
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
function CBRejectedContent() {
  const { user } = useSupabaseAuth()
  const router = useRouter()
  // États pour la gestion des dossiers
  const [dossiers, setDossiers] = React.useState<DossierComptable[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [sortField, setSortField] = React.useState<'numeroDossier' | 'dateDepot' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  // États pour les actions
  const [selectedDossier, setSelectedDossier] = React.useState<DossierComptable | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  // États pour la suppression
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [dossierToDelete, setDossierToDelete] = React.useState<DossierComptable | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState('')
  // États pour la suppression en masse
  const [selectedDossiers, setSelectedDossiers] = React.useState<string[]>([])
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = React.useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false)
  const [bulkDeleteError, setBulkDeleteError] = React.useState('')
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
  // Charger les dossiers rejetés
  const loadDossiers = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch('/api/dossiers/cb-rejected', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Dossiers rejetés CB chargés:', data.dossiers)
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
  // Fonction pour ouvrir un dossier et voir son contenu
  const handleOpenFolder = async (dossier: DossierComptable) => {
    console.log('🚀 FONCTION handleOpenFolder APPELÉE (CB rejetés)')
    console.log('🔍 Tentative d\'ouverture du dossier:', dossier)
    console.log('🔍 folderId:', dossier.folderId)
    console.log('🔍 foldername:', dossier.folderName)
    if (!dossier.folderId) {
      console.log('❌ Pas de folderId pour ce dossier')
      setError('Ce dossier rejeté n\'a pas de contenu de fichiers consultable. Les dossiers rejetés ne sont pas liés à des dossiers de fichiers.')
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
        window.document.body.appendChild(a)
        a.click()
        window.document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error)
    }
  }
  // Fonctions pour la suppression des dossiers rejetés
  const handleDeleteDossier = (dossier: DossierComptable) => {
    setDossierToDelete(dossier)
    setDeleteModalOpen(true)
    setDeleteError('')
  }
  const confirmDeleteDossier = async () => {
    if (!dossierToDelete) return
    try {
      setIsDeleting(true)
      setDeleteError('')
      console.log('🗑️ Suppression du dossier rejeté:', dossierToDelete.numeroDossier)
      const response = await fetch(`/api/dossiers/cb-rejected/${dossierToDelete.id}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dossier supprimé avec succès:', data)
        // Recharger la liste des dossiers
        await loadDossiers()
        // Fermer la modal
        setDeleteModalOpen(false)
        setDossierToDelete(null)
      } else {
        const errorData = await response.json()
        setDeleteError(errorData.error || 'Erreur lors de la suppression')
        console.error('❌ Erreur suppression:', errorData)
      }
    } catch (error) {
      console.error('❌ Erreur suppression dossier:', error)
      setDeleteError('Erreur de connexion lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }
  const cancelDeleteDossier = () => {
    setDeleteModalOpen(false)
    setDossierToDelete(null)
    setDeleteError('')
  }
  // Fonctions pour la suppression en masse
  const handleSelectDossier = (dossierId: string) => {
    setSelectedDossiers(prev => 
      prev.includes(dossierId) 
        ? prev.filter(id => id !== dossierId)
        : [...prev, dossierId]
    )
  }
  const handleSelectAllDossiers = () => {
    if (selectedDossiers.length === filteredDossiers.length) {
      setSelectedDossiers([])
    } else {
      setSelectedDossiers(filteredDossiers.map(d => d.id))
    }
  }
  const handleBulkDelete = () => {
    if (selectedDossiers.length === 0) return
    setBulkDeleteModalOpen(true)
    setBulkDeleteError('')
  }
  const confirmBulkDelete = async () => {
    if (selectedDossiers.length === 0) return
    try {
      setIsBulkDeleting(true)
      setBulkDeleteError('')
      console.log('🗑️ Suppression en masse de', selectedDossiers.length, 'dossiers rejetés')
      // Supprimer les dossiers un par un
      const deletePromises = selectedDossiers.map(async (dossierId) => {
        const response = await fetch(`/api/dossiers/cb-rejected/${dossierId}/delete`, {
          method: 'DELETE',
          credentials: 'include'
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur lors de la suppression')
        }
        return response.json()
      })
      const results = await Promise.allSettled(deletePromises)
      // Compter les succès et échecs
      const successes = results.filter(r => r.status === 'fulfilled').length
      const failures = results.filter(r => r.status === 'rejected').length
      console.log(`✅ Suppression en masse terminée: ${successes} succès, ${failures} échecs`)
      if (failures > 0) {
        setBulkDeleteError(`${successes} dossiers supprimés avec succès, ${failures} échecs`)
      }
      // Recharger la liste des dossiers
      await loadDossiers()
      // Réinitialiser la sélection
      setSelectedDossiers([])
      // Fermer la modal après un délai si il y a des erreurs
      if (failures === 0) {
        setBulkDeleteModalOpen(false)
      } else {
        setTimeout(() => {
          setBulkDeleteModalOpen(false)
        }, 3000)
      }
    } catch (error) {
      console.error('❌ Erreur suppression en masse:', error)
      setBulkDeleteError('Erreur de connexion lors de la suppression en masse')
    } finally {
      setIsBulkDeleting(false)
    }
  }
  const cancelBulkDelete = () => {
    setBulkDeleteModalOpen(false)
    setBulkDeleteError('')
  }
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
  if (user?.role !== 'CONTROLEUR_BUDGETAIRE') {
    return (
      <MainLayout>
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
      </MainLayout>
    )
  }
  // Si on est en mode consultation de dossier, afficher l'interface de consultation
  if (currentFolder) {
    return (
      <MainLayout>
        <div className="space-y-6">
          {/* Header avec bouton retour */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBackToRejected}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux dossiers rejetés
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-title-bold text-primary">
                  Consultation du dossier
                </h1>
                <p className="text-primary text-sm sm:text-base">
                  {currentFolder.name || 'Dossier sans nom'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => currentFolder && loadFolderDocuments(currentFolder.id)} className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Rafraîchir
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
                <CardTitle className="text-sm font-medium">Dossier</CardTitle>
                <Folder className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{currentFolder.name}</div>
                <div className="text-xs text-muted-foreground">
                  {currentFolder.description || 'Aucune description'}
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
                          {document.fileSize ? `${(document.fileSize / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {new Date(document.createdAt).toLocaleDateString('fr-FR')}
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
                              <DropdownMenuItem onClick={() => handleEditDocument(document)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareDocument(document)}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Partager
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
        </div>
      </MainLayout>
    )
  }
  return (
    <CompactPageLayout>
      <PageHeader
        title="Dossiers Rejetés"
        subtitle="Consultez les dossiers rejetés par le contrôleur budgétaire"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {selectedDossiers.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 h-8"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer ({selectedDossiers.length})
              </Button>
            )}
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
              onClick={() => router.push('/cb-dashboard')}
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
        title="Dossiers rejetés"
        subtitle={`${filteredDossiers.length} dossier${filteredDossiers.length > 1 ? 's' : ''} rejeté${filteredDossiers.length > 1 ? 's' : ''} trouvé${filteredDossiers.length > 1 ? 's' : ''}`}
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
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedDossiers.length === filteredDossiers.length && filteredDossiers.length > 0}
                        onChange={handleSelectAllDossiers}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
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
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        console.log('🖱️ Clic direct sur la ligne du dossier rejeté CB:', dossier.numeroDossier)
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
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedDossiers.includes(dossier.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleSelectDossier(dossier.id)
                          }}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-reference">{dossier.numeroDossier}</TableCell>
                      <TableCell className="max-w-xs truncate font-medium">
                        {dossier.folderName ? (
                          <span className="text-blue-600">{dossier.folderName}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Aucun dossier de fichiers</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{dossier.objetOperation}</TableCell>
                      <TableCell>
                        {dossier.beneficiaire || 'Bénéficiaire à définir'}
                      </TableCell>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('🖱️ Clic sur le bouton menu pour dossier rejeté CB:', dossier.numeroDossier)
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
                                  console.log('🖱️ Clic sur "Consulter le dossier" via menu pour:', dossier.numeroDossier)
                                  handleOpenFolder(dossier)
                                }}
                              >
                                <Folder className="mr-2 h-4 w-4" />
                                Consulter le dossier
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled>
                                <Folder className="mr-2 h-4 w-4" />
                                Dossier rejeté - Pas de contenu
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteDossier(dossier)
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer définitivement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={<XCircle className="h-10 w-10 text-muted-foreground" />}
                title="Aucun dossier rejeté"
                description="Aucun dossier rejeté trouvé."
              />
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
                    <p className="text-sm bg-muted p-2 rounded">{selectedDossier.folderName || 'N/A'}</p>
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
                    <p className="font-medium text-code">{selectedDossier.poste_comptable?.numero || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{selectedDossier.poste_comptable?.intitule || 'N/A'}</p>
                  </div>
                </div>
                {/* Nature du document */}
                <div className="space-y-2">
                  <Label className="text-sm font-title-medium">Nature du Document</Label>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium">{selectedDossier.nature_document?.numero || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{selectedDossier.nature_document?.nom || 'N/A'}</p>
                  </div>
                </div>
                {/* Secrétaire */}
                <div className="space-y-2">
                  <Label className="text-sm font-title-medium">Secrétaire</Label>
                  <div className="bg-muted p-3 rounded">
                    <p className="font-medium">{selectedDossier.secretaire?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{selectedDossier.secretaire?.email || 'N/A'}</p>
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de confirmation de suppression */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent className="max-w-md" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Supprimer le dossier rejeté
              </DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Le dossier sera définitivement supprimé de la base de données.
              </DialogDescription>
            </DialogHeader>
            {dossierToDelete && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-title-medium text-red-800 mb-2">Dossier à supprimer :</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Numéro :</strong> {dossierToDelete.numeroDossier}</p>
                    <p><strong>Objet :</strong> {dossierToDelete.objetOperation}</p>
                    <p><strong>Bénéficiaire :</strong> {dossierToDelete.beneficiaire}</p>
                    <p><strong>Poste comptable :</strong> {dossierToDelete.poste_comptable?.numero} - {dossierToDelete.poste_comptable?.intitule}</p>
                    <p><strong>Secrétaire :</strong> {dossierToDelete.secretaire?.name}</p>
                  </div>
                </div>
                {deleteError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-600">{deleteError}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={cancelDeleteDossier}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteDossier}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <ButtonLoading
                    isLoading={true}
                    loadingText="Suppression..."
                    variant="delete"
                    size="sm"
                    color="destructive"
                  >
                    Suppression...
                  </ButtonLoading>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de confirmation de suppression en masse */}
        <Dialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
          <DialogContent className="max-w-md" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Supprimer {selectedDossiers.length} dossier{selectedDossiers.length > 1 ? 's' : ''} rejeté{selectedDossiers.length > 1 ? 's' : ''}
              </DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Les dossiers seront définitivement supprimés de la base de données.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-title-medium text-red-800 mb-2">
                  {selectedDossiers.length} dossier{selectedDossiers.length > 1 ? 's' : ''} à supprimer :
                </h4>
                <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                  {selectedDossiers.map(dossierId => {
                    const dossier = dossiers.find(d => d.id === dossierId)
                    return dossier ? (
                      <p key={dossierId} className="text-red-700">
                        • {dossier.numeroDossier} - {dossier.objetOperation}
                      </p>
                    ) : null
                  })}
                </div>
              </div>
              {bulkDeleteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600">{bulkDeleteError}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={cancelBulkDelete}
                disabled={isBulkDeleting}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmBulkDelete}
                disabled={isBulkDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isBulkDeleting ? (
                  <ButtonLoading
                    isLoading={true}
                    loadingText="Suppression..."
                    variant="delete"
                    size="sm"
                    color="destructive"
                  >
                    Suppression...
                  </ButtonLoading>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer {selectedDossiers.length} dossier{selectedDossiers.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </CompactPageLayout>
  )
}
export default function CBRejectedPage() {
  return (
    <ControleurBudgetaireGuard>
      <CBRejectedContent />
    </ControleurBudgetaireGuard>
  )
}
