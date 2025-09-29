'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompactPageLayout, PageHeader, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingState } from '@/components/ui/loading-states'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Plus,
  MoreHorizontal,
  Download,
  Edit,
  Trash2,
  Eye,
  Upload,
  SortAsc,
  SortDesc,
  File,
  Image,
  Video,
  Music,
  Share2,
  X
} from 'lucide-react'
import { DocumentEditModal } from '@/components/documents/document-edit-modal'
import { DocumentShareModal } from '@/components/documents/document-share-modal'
import { DocumentPreviewModal } from '@/components/ui/document-preview-modal'
import { DocumentDeleteConfirmation } from '@/components/documents/document-delete-confirmation'
import { DocumentsToolbar } from '@/components/documents/documents-toolbar'
import { DocumentsFilters, type DocumentFilters } from '@/components/documents/documents-filters'
import { ActiveFiltersDisplay } from '@/components/documents/active-filters-display'
import { ModernUploadModal } from '@/components/upload/modern-upload-modal'
import { useFolders } from '@/hooks/use-folders'
import { useSearchParams } from 'next/navigation'
import { SearchSuggestion } from '@/components/ui/search-suggestions'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { DocumentItem } from '@/types/document'
type SortField = 'title' | 'createdAt' | 'updatedAt' | 'fileSize' | 'fileType'
type SortOrder = 'asc' | 'desc'
export default function DocumentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { folders } = useFolders()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [filters, setFilters] = useState<DocumentFilters>({
    sortBy: 'updatedAt',
    sortOrder: 'desc'
    // Pas de folderId par défaut - affiche TOUS les documents
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Fonction pour supprimer un document spécifique obsolète
  const removeObsoleteDocument = (documentId: string) => {
    console.log(`🗑️ Suppression manuelle du document obsolète: ${documentId}`)

    setDocuments(prev => {
      const filtered = prev.filter(doc => doc.id !== documentId)
      console.log(`📋 Documents après suppression manuelle: ${filtered.length}`)
      return filtered
    })

    setFilteredDocuments(prev => {
      const filtered = prev.filter(doc => doc.id !== documentId)
      console.log(`📋 Documents filtrés après suppression manuelle: ${filtered.length}`)
      return filtered
    })

    setPagination(prev => ({
      ...prev,
      total: Math.max(0, prev.total - 1)
    }))

    console.log('✅ Document obsolète supprimé manuellement')
  }

  // Fonction pour ajouter un document de manière optimiste
  const addDocumentOptimistically = (newDocument: DocumentItem) => {
    setDocuments(prev => {
      // Vérifier si le document n'existe pas déjà
      if (prev.some(doc => doc.id === newDocument.id)) {
        return prev
      }
      return [newDocument, ...prev]
    })

    setFilteredDocuments(prev => {
      // Vérifier si le document n'existe pas déjà
      if (prev.some(doc => doc.id === newDocument.id)) {
        return prev
      }
      return [newDocument, ...prev]
    })

    setPagination(prev => ({
      ...prev,
      total: prev.total + 1
    }))
  }
  // Initialiser la recherche depuis l'URL
  useEffect(() => {
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setSearchQuery(urlSearch)
      setFilters(prev => ({ ...prev, search: urlSearch }))
    }
  }, [searchParams])

  // Fonction pour nettoyer les documents obsolètes
  const cleanObsoleteDocuments = async () => {
    try {
      console.log('🔍 Vérification des documents obsolètes...')

      // Récupérer tous les documents de l'API
      const response = await fetch('/api/documents?page=1&limit=1000', {
        credentials: 'include',
        cache: 'no-cache'
      })

      if (response.ok) {
        const data = await response.json()
        const apiDocuments = data.documents || []
        const apiDocumentIds = new Set(apiDocuments.map((doc: DocumentItem) => doc.originalId || doc.id))

        // Vérifier les documents locaux
        const currentDocuments = documents
        const obsoleteDocuments = currentDocuments.filter(doc => {
          const docId = doc.originalId || doc.id
          // Ne pas supprimer les documents optimistes (ceux qui commencent par 'file-')
          const isOptimistic = docId.startsWith('file-')
          const existsInApi = apiDocumentIds.has(docId)

          console.log(`📄 Vérification document "${doc.title}":`, {
            docId,
            isOptimistic,
            existsInApi
          })

          return !isOptimistic && !existsInApi
        })

        if (obsoleteDocuments.length > 0) {
          console.log(`🧹 Suppression de ${obsoleteDocuments.length} documents obsolètes:`,
            obsoleteDocuments.map(doc => `"${doc.title}" (${doc.id})`))

          // Supprimer les documents obsolètes
          setDocuments(prev => prev.filter(doc => !obsoleteDocuments.includes(doc)))
          setFilteredDocuments(prev => prev.filter(doc => !obsoleteDocuments.includes(doc)))
          setPagination(prev => ({
            ...prev,
            total: Math.max(0, prev.total - obsoleteDocuments.length)
          }))

          console.log('✅ Documents obsolètes supprimés')
          alert(`🧹 ${obsoleteDocuments.length} document(s) obsolète(s) supprimé(s)`)
        } else {
          console.log('✅ Aucun document obsolète trouvé')
        }
      } else {
        console.error('❌ Erreur lors de la récupération des documents de l\'API')
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des documents obsolètes:', error)
    }
  }

  // Nettoyage automatique du cache au démarrage
  useEffect(() => {
    // Nettoyer automatiquement les documents optimistes au démarrage
    const newDocumentsData = sessionStorage.getItem('newDocuments')
    if (newDocumentsData) {
      sessionStorage.removeItem('newDocuments')
    }

    // Nettoyer les documents obsolètes
    cleanObsoleteDocuments()

    fetchDocuments()
  }, [])
  useEffect(() => {
    // Vérifier s'il y a de nouveaux documents à ajouter de manière optimiste
    const newDocumentsData = sessionStorage.getItem('newDocuments')

    if (newDocumentsData) {
      try {
        const newDocuments = JSON.parse(newDocumentsData)
        newDocuments.forEach((doc: DocumentItem) => {
          addDocumentOptimistically(doc)
        })
        sessionStorage.removeItem('newDocuments')
        setPagination(prev => ({ ...prev, page: 1 }))
        return
      } catch (error) {
        sessionStorage.removeItem('newDocuments')
        fetchDocuments()
        return
      }
    }

    fetchDocuments()
  }, [filters, pagination.page])
  useEffect(() => {
    filterAndSortDocuments()
  }, [documents, searchQuery, sortField, sortOrder])
  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Construire les paramètres de requête
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.fileType) params.append('fileType', filters.fileType)
      if (filters.minSize) params.append('minSize', filters.minSize.toString())
      if (filters.maxSize) params.append('maxSize', filters.maxSize.toString())
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.folderId) params.append('folderId', filters.folderId)
      if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','))
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await fetch(`/api/documents?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-cache'
      })

      if (response.ok) {
        const data = await response.json()

        // Vérifier si la réponse contient une erreur malgré response.ok = true
        if (data.error) {
          setError(data.error)
          return
        }

        const apiDocuments = data.documents || []
        const currentDocuments = documents

        // Vérifier la cohérence entre les données locales et l'API
        const documentsFromApi = new Set(apiDocuments.map((doc: DocumentItem) => doc.originalId || doc.id))
        const documentsToRemove = currentDocuments.filter(doc => {
          const docId = doc.originalId || doc.id
          return !documentsFromApi.has(docId) && !docId.startsWith('file-')
        })

        // Si on a des documents locaux qui ne sont pas dans l'API, les supprimer
        if (documentsToRemove.length > 0) {
          console.log(`🧹 Suppression automatique de ${documentsToRemove.length} documents obsolètes:`,
            documentsToRemove.map(doc => `"${doc.title}" (${doc.id})`))
          setDocuments(prev => prev.filter(doc => !documentsToRemove.includes(doc)))
          setFilteredDocuments(prev => prev.filter(doc => !documentsToRemove.includes(doc)))
          setPagination(prev => ({
            ...prev,
            total: Math.max(0, prev.total - documentsToRemove.length)
          }))
          console.log('✅ Nettoyage automatique effectué')
        } else {
          console.log('✅ Aucun document obsolète trouvé')
        }

        // Mettre à jour les states avec les données de l'API
        setDocuments(apiDocuments)
        setFilteredDocuments(apiDocuments)
        setPagination(data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        })
      } else {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          setError(errorData.error || `Erreur lors du chargement des fichiers (${response.status})`)
        } catch {
          setError(`Erreur lors du chargement des fichiers (${response.status})`)
        }
      }
    } catch (error) {
      setError(`Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsLoading(false)
    }
  }
  const handleApplyFilters = (newFilters: DocumentFilters) => {
    setFilters(newFilters)
    // Synchroniser la barre de recherche locale avec les filtres
    if (newFilters.search !== searchQuery) {
      setSearchQuery(newFilters.search || '')
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  const handleRemoveFilter = (filterKey: keyof DocumentFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      if (filterKey === 'minSize' || filterKey === 'maxSize') {
        newFilters.minSize = undefined
        newFilters.maxSize = undefined
      } else if (filterKey === 'startDate' || filterKey === 'endDate') {
        newFilters.startDate = undefined
        newFilters.endDate = undefined
      } else {
        newFilters[filterKey] = undefined
      }
      return newFilters
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  const handleClearAllFilters = () => {
    const resetFilters: DocumentFilters = {
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    }
    setFilters(resetFilters)
    setSearchQuery('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query)
    // Mettre à jour les filtres avec debounce pour éviter trop d'appels API
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: query || undefined }))
    }, 500)
    return () => clearTimeout(timeoutId)
  }
  const handleSearchSelect = (suggestion: SearchSuggestion) => {
    // Rediriger selon le type de suggestion
    switch (suggestion.type) {
      case 'document':
        // Rechercher le document et l'afficher
        setSearchQuery(suggestion.text)
        setFilters(prev => ({ ...prev, search: suggestion.text }))
        break
      case 'folder':
        // Rediriger vers la page des dossiers avec le dossier sélectionné
        router.push(`/folders?folder=${suggestion.id.replace('folder-', '')}`)
        break
      case 'tag':
        // Ajouter le tag aux filtres
        setSearchQuery(suggestion.text)
        setFilters(prev => ({ ...prev, search: suggestion.text }))
        break
      case 'user':
        // Filtrer par auteur
        setSearchQuery(suggestion.text)
        setFilters(prev => ({ ...prev, search: suggestion.text }))
        break
    }
  }
  const handleSearchSubmit = () => {
    // Valider la recherche en mettant à jour les filtres
    setFilters(prev => ({ ...prev, search: searchQuery || undefined }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  const filterAndSortDocuments = () => {
    let filtered = documents
    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.fileName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    // Trier
    const getSortableValue = (doc: DocumentItem, field: SortField) => {
      switch (field) {
        case 'title':
          return doc.title?.toLowerCase() || ''
        case 'createdAt':
          return doc.createdAt ? new Date(doc.createdAt).getTime() : 0
        case 'updatedAt':
          return doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0
        case 'fileSize':
          return doc.fileSize || 0
        case 'fileType':
          return doc.fileType || ''
      }
    }
    filtered.sort((a, b) => {
      const aValue = getSortableValue(a, sortField)
      const bValue = getSortableValue(b, sortField)
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    setFilteredDocuments(filtered)
  }
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4 text-muted-foreground" />
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4 text-muted-foreground" />
    if (fileType.startsWith('audio/')) return <Music className="w-4 h-4 text-muted-foreground" />
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4 text-muted-foreground" />
    return <File className="w-4 h-4 text-muted-foreground" />
  }
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }
  const handleDownload = async (documentItem: DocumentItem) => {
    try {
      // Utiliser l'API de téléchargement standard
      const apiUrl = `/api/documents/${documentItem.id}/download`
      const response = await fetch(apiUrl)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = documentItem.fileName || 'document'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        console.error('Erreur téléchargement:', response.status, response.statusText)
        setError(`Erreur lors du téléchargement (${response.status})`)
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error)
      setError('Erreur de connexion lors du téléchargement')
    }
  }
  const handleDelete = async (documentId: string) => {
    console.log('🗑️ Tentative de suppression du document:', documentId)

    // Debug spécial pour le fichier WhatsApp
    if (documentId.includes('1758793139139') || documentId.includes('WhatsApp')) {
      console.log('⚠️ Tentative de suppression du fichier WhatsApp:', documentId)
    }

    const documentToDelete = documents.find(doc => doc.id === documentId)
    if (documentToDelete) {
      console.log('📄 Document trouvé localement:', {
        id: documentToDelete.id,
        originalId: documentToDelete.originalId,
        title: documentToDelete.title,
        fileName: documentToDelete.fileName
      })
      setSelectedDocument(documentToDelete)
      setShowDeleteConfirmation(true)
    } else {
      console.error('❌ Document non trouvé localement:', documentId)
    }
  }
  const confirmDelete = async (documentId: string) => {
    try {
      // Trouver le document pour récupérer son ID original
      const documentToDelete = documents.find(doc => doc.id === documentId)
      if (!documentToDelete) {
        console.error('❌ Document non trouvé dans la liste locale:', documentId)
        throw new Error('Document non trouvé dans la liste locale')
      }

      console.log('📄 Document à supprimer:', {
        id: documentToDelete.id,
        originalId: documentToDelete.originalId,
        title: documentToDelete.title,
        fileName: documentToDelete.fileName
      })

      // Utiliser l'ID original pour la suppression
      const originalId = documentToDelete.originalId || documentToDelete.id
      console.log('🗑️ Suppression document:', documentToDelete.title, 'ID utilisé:', originalId)

      // Vérifier que le document existe en base avant de le supprimer
      console.log('🔍 Vérification existence document en base...')
      const checkResponse = await fetch(`/api/documents/${originalId}`, {
        credentials: 'include'
      })

      if (checkResponse.status === 404) {
        console.log('⚠️ Document non trouvé en base (404), suppression locale seulement')
        // Le document n'existe pas en base, le supprimer seulement localement
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        setFilteredDocuments(prev => prev.filter(doc => doc.id !== documentId))
        setPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1)
        }))

        setShowDeleteConfirmation(false)
        setSelectedDocument(null)
        console.log('✅ Document supprimé localement (n\'existait pas en base)')
        return
      }

      if (!checkResponse.ok) {
        const checkData = await checkResponse.json()
        console.error('❌ Erreur lors de la vérification du document:', checkData)
        throw new Error(checkData.error || 'Erreur lors de la vérification du document')
      }

      console.log('✅ Document existe en base, tentative de suppression...')
      const response = await fetch(`/api/documents/${originalId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      // Récupérer les données de la réponse (que ce soit succès ou échec)
      const data = await response.json()
      console.log('📊 Réponse suppression:', { status: response.status, ok: response.ok, data })

      if (response.ok && data.success) {
        console.log('✅ Suppression réussie, mise à jour des states locaux')
        // Nettoyer sessionStorage pour éviter les données obsolètes
        sessionStorage.removeItem('newDocuments')

        // Mettre à jour les states locaux
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        setFilteredDocuments(prev => prev.filter(doc => doc.id !== documentId))
        setPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1)
        }))

        setShowDeleteConfirmation(false)
        setSelectedDocument(null)
        console.log('✅ Document supprimé avec succès et states mis à jour')
      } else {
        // Erreur : soit response.ok = false, soit data.success = false, soit data.error existe
        const errorMessage = data.error || data.message || 'Erreur lors de la suppression'
        console.error('❌ Erreur suppression:', {
          status: response.status,
          ok: response.ok,
          data,
          errorMessage
        })
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
      throw error // Re-throw pour que le composant puisse gérer l'erreur
    }
  }
  const handleView = (documentItem: DocumentItem) => {
    // Ouvrir l'aperçu du document
    setSelectedDocument(documentItem)
    setShowPreview(true)
  }
  const handleEdit = (documentItem: DocumentItem) => {
    // Ouvrir la modal d'édition
    setSelectedDocument(documentItem)
    setShowEditModal(true)
  }

  // Fonctions de gestion de la sélection multiple
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    if (isSelectionMode) {
      setSelectedDocuments(new Set())
    }
  }

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(documentId)) {
        newSelection.delete(documentId)
      } else {
        newSelection.add(documentId)
      }
      return newSelection
    })
  }

  const selectAllDocuments = () => {
    const allIds = new Set(filteredDocuments.map(doc => doc.id))
    setSelectedDocuments(allIds)
  }

  const clearSelection = () => {
    setSelectedDocuments(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return
    
    try {
      const documentsToDelete = Array.from(selectedDocuments)
      console.log('🗑️ Suppression en lot de', documentsToDelete.length, 'documents')
      
      // Supprimer chaque document
      for (const documentId of documentsToDelete) {
        const documentToDelete = documents.find(doc => doc.id === documentId)
        if (documentToDelete) {
          const originalId = documentToDelete.originalId || documentToDelete.id

          const response = await fetch(`/api/documents/${originalId}`, {
            method: 'DELETE',
            credentials: 'include'
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            const errorMessage = data.error || data.message || `Erreur lors de la suppression de ${documentToDelete.title}`
            throw new Error(errorMessage)
          }
        }
      }
      
      // Nettoyer sessionStorage pour éviter les données obsolètes
      sessionStorage.removeItem('newDocuments')

      // Mettre à jour les states locaux
      setDocuments(prev => prev.filter(doc => !selectedDocuments.has(doc.id)))
      setFilteredDocuments(prev => prev.filter(doc => !selectedDocuments.has(doc.id)))
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - documentsToDelete.length)
      }))

      setSelectedDocuments(new Set())
      setIsSelectionMode(false)
    } catch (error) {
      console.error('❌ Erreur lors de la suppression en lot:', error)
      setError(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }
  if (isLoading) {
    return (
      <CompactPageLayout>
        <div className="text-center py-8">
          <LoadingState
            isLoading={true}
            message="Chargement des fichiers..."
            size="lg"
            color="primary"
            showText={true}
          />
        </div>
      </CompactPageLayout>
    )
  }
  return (
    <CompactPageLayout>
      {/* Header compact réutilisable */}
      <PageHeader
        title="Mes Documents"
        subtitle={
          isSelectionMode && selectedDocuments.size > 0
            ? `${selectedDocuments.size} fichier(s) sélectionné(s) sur ${documents.length} au total`
            : `${documents.length} fichier(s) au total`
        }
        actions={
          <div className="flex items-center gap-2">
            {isSelectionMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllDocuments}
                  className="h-8"
                >
                  Tout sélectionner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="h-8"
                >
                  Désélectionner
                </Button>
                {selectedDocuments.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-8"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer ({selectedDocuments.size})
                  </Button>
                )}
              </>
            )}
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
              className="h-8"
            >
              {isSelectionMode ? "Annuler" : "Sélectionner"}
            </Button>
            <Button onClick={() => setUploadModalOpen(true)} className="w-full sm:w-auto h-8">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter des fichiers
            </Button>
          </div>
        }
      />
        {/* Barre d'outils Documents */}
        <ContentSection title="Recherche et filtres">
          <DocumentsToolbar
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
            onSearchSelect={handleSearchSelect}
            onSearchSubmit={handleSearchSubmit}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={setSortField}
            onSortOrderChange={setSortOrder}
            onOpenFilters={() => setIsFiltersOpen(true)}
          />
        </ContentSection>
        {/* Affichage des filtres actifs */}
        <ActiveFiltersDisplay
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />
        {/* Messages d'erreur */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Liste des documents avec section réutilisable */}
        <ContentSection>
          <Table>
            <TableHeader>
              <TableRow>
                {isSelectionMode && (
                  <TableHead className="w-8 sm:w-12">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                      onChange={selectedDocuments.size === filteredDocuments.length ? clearSelection : selectAllDocuments}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                )}
                <TableHead className="w-8 sm:w-12"></TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-primary/10"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-2">
                    Nom
                    {sortField === 'title' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell cursor-pointer hover:bg-gray-50 dark:hover:bg-primary/10"
                  onClick={() => handleSort('fileSize')}
                >
                  <div className="flex items-center gap-2">
                    Taille
                    {sortField === 'fileSize' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell cursor-pointer hover:bg-gray-50 dark:hover:bg-primary/10"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Date d'ajout
                    {sortField === 'createdAt' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Propriétaire</TableHead>
                <TableHead className="w-10 sm:w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id} className={selectedDocuments.has(document.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                  {isSelectionMode && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedDocuments.has(document.id)}
                        onChange={() => toggleDocumentSelection(document.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {getFileIcon(document.fileType || 'unknown')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{document.title}</div>
                      <div className="text-xs sm:text-sm text-primary">{document.fileName || 'Sans fichier'}</div>
                      {document.description && (
                        <div className="hidden sm:block text-xs text-primary mt-1">{document.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-number">{formatFileSize(document.fileSize || 0)}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-date">{new Date(document.createdAt).toLocaleDateString('fr-FR')}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{document.author?.name || 'Inconnu'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(document)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Aperçu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(document)}>
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(document)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedDocument(document)
                          setShowShareModal(true)
                        }}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Partager
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(document.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm(`⚠️ Supprimer immédiatement le document "${document.title}" ?`)) {
                              removeObsoleteDocument(document.id)
                            }
                          }}
                          className="text-red-600"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Supprimer obsolète
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredDocuments.length === 0 && (
            <EmptyState
              icon={<Upload className="h-10 w-10" />}
              title={searchQuery ? 'Aucun document trouvé' : 'Aucun document'}
              description={searchQuery 
                ? 'Essayez de modifier votre recherche'
                : 'Commencez par uploader vos premiers fichiers'
              }
              action={!searchQuery ? {
                label: 'Ajouter des fichiers',
                onClick: () => setUploadModalOpen(true)
              } : undefined}
            />
          )}
        </ContentSection>
      {/* Modal d'aperçu */}
      {showPreview && selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onDownload={(doc) => {
            // Logique de téléchargement
            console.log('Téléchargement du document:', doc.title)
          }}
          onEdit={(doc) => {
            setShowEditModal(true)
          }}
          onShare={(doc) => {
            setShowShareModal(true)
          }}
        />
      )}
      {/* Modal d'édition */}
      {showEditModal && selectedDocument && (
        <DocumentEditModal
          document={selectedDocument}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedDocument) => {
            setDocuments(prev => 
              prev.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
            )
            setShowEditModal(false)
          }}
        />
      )}
      {/* Modal de partage */}
      {showShareModal && selectedDocument && (
        <DocumentShareModal
          document={selectedDocument}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShared={() => {
            // Optionnel: rafraîchir la liste des documents
            fetchDocuments()
          }}
        />
      )}
      {/* Modal de confirmation de suppression */}
      {showDeleteConfirmation && selectedDocument && (
        <DocumentDeleteConfirmation
          document={selectedDocument}
          isOpen={showDeleteConfirmation}
          onClose={() => {
            setShowDeleteConfirmation(false)
            setSelectedDocument(null)
          }}
          onConfirm={confirmDelete}
        />
      )}
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  size="default"
                />
              </PaginationItem>
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const pageNum = i + 1
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      isActive={pagination.page === pageNum}
                      className="cursor-pointer"
                      size="default"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              {pagination.totalPages > 5 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                  className={pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  size="default"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="text-center text-sm text-primary mt-2">
            Page {pagination.page} sur {pagination.totalPages} • {pagination.total} documents au total
          </div>
        </div>
      )}
      {/* Panneau de filtres */}
      <DocumentsFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        folders={folders.map(dossier => ({
          id: dossier.id,
          name: `${dossier.numeroDossier} - ${dossier.objetOperation}`
        }))}
        />

      {/* Modal d'upload */}
      <ModernUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => {
          // Recharger les documents après un upload réussi
          fetchDocuments()
          setUploadModalOpen(false)
        }}
      />
    </CompactPageLayout>
  )
}
