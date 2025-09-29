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
import { LoadingState } from '@/components/ui/loading-states'
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
  // Charger le contenu du dossier (nouvelle architecture)
  const loadDossierContent = React.useCallback(async () => {
    if (!dossier) return

    try {
      setDocumentsLoading(true)
      setDocumentsError('')
      console.log('📄 Chargement des documents du dossier comptable:', dossier.id)

      // Nouvelle architecture : charger directement les documents liés au dossier comptable
      const documentsRes = await fetch(`/api/documents-by-dossier-comptable?dossier_comptable_id=${dossier.id}`)
      if (documentsRes.ok) {
        const documentsData = await documentsRes.json()
        setDocuments(documentsData.documents || [])
        setFilteredDocuments(documentsData.documents || [])

        // Simuler un "dossier" pour la compatibilité avec l'interface existante
        setCurrentFolder({
          id: dossier.id,
          name: `Dossier ${dossier.numeroDossier}`,
          numeroDossier: dossier.numeroDossier,
          documents: documentsData.documents || []
        })
      } else {
        if (documentsRes.status === 404) {
          setDocumentsError('Ce dossier n\'est pas lié à un dossier de fichiers')
        } else {
          setDocumentsError('Erreur lors du chargement des documents')
        }
        return
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
      // Utiliser l'ID original (UUID) au lieu de l'ID artificiel
      const documentId = document.originalId || document.id
      const response = await fetch(`/api/documents/${documentId}/download`)
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
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Bénéficiaire</p>
                      <p className="font-medium truncate text-sm">{dossier.beneficiaire}</p>
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Poste</p>
                      <p className="font-medium truncate text-sm">
                        <span className="text-number">{dossier.poste_comptable?.numero || 'N/A'}</span> - {dossier.poste_comptable?.intitule || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Dépôt</p>
                      <p className="font-medium truncate text-sm text-date">{formatDate(dossier.dateDepot)}</p>
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Documents</p>
                      <p className="font-medium text-sm">{documents.length}</p>
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
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
                </div>
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
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
            </div>
            {/* Barre de recherche et tri intégrée */}
            <div className="flex items-center justify-between gap-3 p-3 border-b bg-muted/5">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                  <Input
                    placeholder="Rechercher..."
                    value={documentSearchQuery}
                    onChange={(e) => setDocumentSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={documentSortField}
                  onChange={(e) => setDocumentSortField(e.target.value as any)}
                  className="px-2 py-1 text-xs border border-input bg-background rounded min-w-[100px] h-8"
                >
                  <option value="updatedAt">Date modif.</option>
                  <option value="title">Nom</option>
                  <option value="createdAt">Date créa.</option>
                  <option value="fileSize">Taille</option>
                  <option value="fileType">Type</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDocumentSortOrder(documentSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-8 w-8 p-0"
                >
                  {documentSortOrder === 'asc' ? '↑' : '↓'}
                </Button>
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
                  <div className="space-y-2">
                    {filteredDocuments.map((document) => (
                      <div key={document.id} className="group flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-all duration-200 hover:shadow-sm">
                        {/* Icône et informations principales */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-0.5">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground truncate" title={document.fileName || document.title}>
                                  {document.fileName || document.title}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                                    {document.category || 'Non classé'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {document.fileSize ?
                                      `${(document.fileSize / 1024 / 1024).toFixed(1)} MB` :
                                      'Taille inconnue'
                                    }
                                  </span>
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-xs text-muted-foreground">
                                  {document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {document.fileType || 'Type inconnu'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDocument(document)
                            }}
                            className="h-8 w-8 p-0 hover:bg-muted"
                            title="Aperçu"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadDocument(document)
                            }}
                            className="h-8 w-8 p-0 hover:bg-muted"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-muted"
                                title="Plus d'actions"
                              >
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
          <div className="flex justify-between items-center p-4 border-t bg-muted/10">
            <div className="text-xs text-muted-foreground">
              {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''} • {documents.reduce((total, doc) => total + (doc.fileSize || 0), 0) > 0
                ? `${(documents.reduce((total, doc) => total + (doc.fileSize || 0), 0) / 1024 / 1024).toFixed(1)} MB total`
                : 'Taille totale inconnue'
              }
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
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
                  <div className="mr-2 h-4 w-4">
                    <LoadingState isLoading={true} size="sm" showText={false} />
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
    </>
  )
}
