'use client'
import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText,
  Download,
  Eye,
  Loader2,
  AlertTriangle,
  X,
  Folder,
  Calendar,
  User,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  Share2,
  Clock,
  Search,
  ArrowLeft
 } from 'lucide-react'
import { DocumentEditModal } from '@/components/documents/document-edit-modal'
import { DocumentShareModal } from '@/components/documents/document-share-modal'
import { DocumentPreviewModal } from './document-preview-modal'
import { DocumentItem } from '@/types/document'
interface DossierComptable {
  id: string
  numeroDossier: string
  objetOperation: string
  beneficiaire: string
  statut: string
  dateDepot: string
  createdAt: string
  updatedAt: string
  folderId?: string
  folder_id?: string
  poste_comptable?: {
    numero: string
    intitule: string
  }
  nature_document?: {
    numero: string
    nom: string
  }
  secretaire?: {
    id: string
    name: string
    email: string
  }
  rejectionReason?: string
  rejectionDetails?: string
  rejectedAt?: string
}
interface DossierContentModalProps {
  dossier: DossierComptable | null
  isOpen: boolean
  onClose: () => void
}
export function DossierContentModal({ dossier, isOpen, onClose }: DossierContentModalProps) {
  const [currentFolder, setCurrentFolder] = React.useState<any>(null)
  const [documents, setDocuments] = React.useState<DocumentItem[]>([])
  const [filteredDocuments, setFilteredDocuments] = React.useState<DocumentItem[]>([])
  const [documentsLoading, setDocumentsLoading] = React.useState(false)
  const [documentsError, setDocumentsError] = React.useState('')
  const [selectedDocument, setSelectedDocument] = React.useState<DocumentItem | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [shareModalOpen, setShareModalOpen] = React.useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [documentToDelete, setDocumentToDelete] = React.useState<DocumentItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  // États pour la recherche et le tri des documents
  const [documentSearchQuery, setDocumentSearchQuery] = React.useState('')
  const [documentSortField, setDocumentSortField] = React.useState<'title' | 'createdAt' | 'updatedAt' | 'fileSize' | 'fileType'>('updatedAt')
  const [documentSortOrder, setDocumentSortOrder] = React.useState<'asc' | 'desc'>('desc')
  // Charger le contenu du dossier
  const loadDossierContent = React.useCallback(async () => {
    if (!dossier) return
    const folderId = dossier.folderId || dossier.folder_id
    if (!folderId) {
      console.log('❌ Pas de folderId pour ce dossier:', dossier)
      setDocumentsError('Ce dossier n\'est pas lié à un dossier de fichiers')
      return
    }
    try {
      setDocumentsLoading(true)
      setDocumentsError('')
      console.log('📁 Chargement du contenu du dossier:', folderId)
      // Charger les informations du dossier
      const folderRes = await fetch(`/api/folders/${folderId}`)
      if (folderRes.ok) {
        const folderData = await folderRes.json()
        setCurrentFolder(folderData.folder || folderData)
      } else {
        setDocumentsError('Erreur lors du chargement du dossier')
        return
      }
      // Charger les documents du dossier
      const documentsRes = await fetch(`/api/documents?folderId=${folderId}`)
      if (documentsRes.ok) {
        const response = await documentsRes.json()
        console.log('📄 Données documents reçues:', response)
        // L'API retourne { documents: [...], pagination: {...} }
        const documentsArray = response.documents || []
        console.log('📄 Nombre de documents trouvés:', documentsArray.length)
        // Debug: afficher le premier document reçu
        if (documentsArray.length > 0) {
          console.log('📄 Premier document reçu (debug):', documentsArray[0])
          console.log('📄 Premier document reçu (debug):', {
            id: documentsArray[0].id,
            originalId: documentsArray[0].originalId,
            title: documentsArray[0].title
          })
        }
        // Adapter les données pour correspondre à notre interface
        const adaptedDocuments = documentsArray.map((doc: any): DocumentItem => ({
          ...doc,
          // L'API documents retourne déjà id (artificiel) et originalId (UUID)
          // On garde la structure telle quelle
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
        setDocumentsError('Erreur lors du chargement des documents')
      }
    } catch (error) {
      console.error('❌ Erreur chargement contenu dossier:', error)
      setDocumentsError('Erreur lors du chargement du contenu')
    } finally {
      setDocumentsLoading(false)
    }
  }, [dossier])
  // Charger le contenu quand la modal s'ouvre
  React.useEffect(() => {
    if (isOpen && dossier) {
      loadDossierContent()
    }
  }, [isOpen, dossier, loadDossierContent])
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
      // Utiliser l'originalId (UUID de la base de données) au lieu de l'id généré côté client
      const documentId = documentToDelete.originalId || documentToDelete.id
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        // Recharger les documents après suppression
        if (dossier) {
          await loadDossierContent()
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
      'ORDONNANCÉ': { label: 'Ordonnancé', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    }
    return statuts[statut as keyof typeof statuts] || { label: statut, className: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
  if (!dossier) return null
  const statutInfo = getStatutInfo(dossier.statut)
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] w-[95vw] sm:w-full overflow-hidden flex flex-col p-0" showCloseButton={false}>
          {/* DialogTitle caché pour l'accessibilité */}
          <DialogTitle className="sr-only">
            Détails du dossier {dossier.numeroDossier} - {dossier.objetOperation}
          </DialogTitle>
          {/* Header compact */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Folder className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-title-semibold text-number truncate">{dossier.numeroDossier}</h2>
                <p className="text-sm text-muted-foreground truncate">{dossier.objetOperation}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={statutInfo.className}>
                {statutInfo.label}
              </Badge>
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Informations consolidées en une seule ligne */}
            <div className="p-3 sm:p-4 bg-muted/20 border-b">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Bénéficiaire</p>
                    <p className="font-medium truncate text-sm">{dossier.beneficiaire}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Poste</p>
                    <p className="font-medium truncate text-sm">
                      <span className="text-number">{dossier.poste_comptable?.numero || 'N/A'}</span> - {dossier.poste_comptable?.intitule || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Dépôt</p>
                    <p className="font-medium truncate text-sm text-date">{formatDate(dossier.dateDepot)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Documents</p>
                    <p className="font-medium text-sm">{documents.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Taille</p>
                    <p className="font-medium text-sm">
                      {documents.reduce((total, doc) => total + (doc.fileSize || 0), 0) > 0 
                        ? `${(documents.reduce((total, doc) => total + (doc.fileSize || 0), 0) / 1024 / 1024).toFixed(1)} MB`
                        : '0 MB'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Modifié</p>
                    <p className="font-medium truncate text-sm">
                      {currentFolder?.updatedAt 
                        ? new Date(currentFolder.updatedAt).toLocaleDateString('fr-FR')
                        : 'Inconnue'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Barre de recherche compacte */}
            <div className="p-3 sm:p-4 border-b">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Rechercher dans les documents..."
                      value={documentSearchQuery}
                      onChange={(e) => setDocumentSearchQuery(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={documentSortField} 
                    onChange={(e) => setDocumentSortField(e.target.value as any)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm h-9"
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
              </div>
            </div>
            {/* Tableau des documents optimisé */}
            <div className="flex-1 overflow-auto">
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-title-medium">Documents du dossier</h3>
                  <span className="text-xs text-muted-foreground">
                    {documents.length} document{documents.length > 1 ? 's' : ''}
                  </span>
                </div>
                {documentsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : documentsError ? (
                  <div className="text-center py-8 text-destructive">
                    {documentsError}
                  </div>
                ) : filteredDocuments.length > 0 ? (
                  <div className="space-y-1">
                    {filteredDocuments.map((document) => (
                      <div key={document.id} className="flex items-start sm:items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{document.fileName || document.title}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 w-fit">
                              {document.category || 'Non classé'}
                            </span>
                            <div className="flex flex-wrap gap-2 sm:gap-4">
                              <span>
                                {document.fileSize ? 
                                  `${(document.fileSize / 1024 / 1024).toFixed(1)} MB` : 
                                  'Taille inconnue'
                                }
                              </span>
                              <span className="hidden xs:inline">{document.fileType || 'Type inconnu'}</span>
                              <span className="hidden sm:inline">
                                {document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(document)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(document)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-title-medium">Aucun document</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ce dossier ne contient aucun document.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Footer avec bouton Fermer */}
          <div className="flex justify-end p-4 border-t bg-muted/20">
            <Button onClick={onClose} variant="outline">
              Fermer
            </Button>
          </div>
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
            onClose={() => {
              setEditModalOpen(false)
              setSelectedDocument(null)
            }}
            onSave={() => dossier && loadDossierContent()}
          />
          <DocumentShareModal
            document={selectedDocument}
            isOpen={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false)
              setSelectedDocument(null)
            }}
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
    </>
  )
}
