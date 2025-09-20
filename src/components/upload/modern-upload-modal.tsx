'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Upload,
  File as FileIcon2,
  Image,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Tag,
  CloudUpload,
  FolderOpen,
  Trash2,
  Eye,
  Download,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  Archive,
  Video,
  Music
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileWithPreview extends File {
  id: string
  preview?: string
  uploadProgress?: number
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
  errorMessage?: string
}

interface ExistingDocument {
  id: string
  title: string
  description?: string
  file_name: string
  file_size: number
  file_type?: string
  created_at: string
  author?: {
    name: string
    email: string
  }
  nature_document?: {
    nom: string
    numero: string
  }
}

interface ModernUploadModalProps {
  isOpen: boolean
  onClose: () => void
  folderId?: string
  onUploadSuccess?: () => void
  maxFiles?: number
  maxSize?: number // en MB
  acceptedTypes?: string[]
}

const getFileIcon = (file?: File) => {
  if (!file) return <FileIcon2 className="h-8 w-8 text-gray-500" />
  
  const type = file.type
  if (!type) return <FileIcon2 className="h-8 w-8 text-gray-500" />
  
  if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />
  if (type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />
  if (type.startsWith('audio/')) return <Music className="h-8 w-8 text-green-500" />
  if (type.includes('pdf')) return <FileTextIcon className="h-8 w-8 text-red-500" />
  if (type.includes('word') || type.includes('document')) return <FileText className="h-8 w-8 text-blue-600" />
  if (type.includes('excel') || type.includes('spreadsheet')) return <FileIcon className="h-8 w-8 text-green-600" />
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <Archive className="h-8 w-8 text-orange-500" />
  return <FileIcon2 className="h-8 w-8 text-gray-500" />
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function ModernUploadModal({
  isOpen,
  onClose,
  folderId,
  onUploadSuccess,
  maxFiles = 10,
  maxSize = 50,
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/*',
    'text/*'
  ]
}: ModernUploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [activeTab, setActiveTab] = useState('files')
  
  // États pour les fichiers existants
  const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>([])
  const [selectedExistingFiles, setSelectedExistingFiles] = useState<Set<string>>(new Set())
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [searchExisting, setSearchExisting] = useState('')
  
  // Métadonnées des fichiers
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    category: '',
    tags: [] as string[]
  })
  const [tagInput, setTagInput] = useState('')
  
  // États pour les natures de documents
  const [naturesDocuments, setNaturesDocuments] = useState<Array<{id: string, numero: string, nom: string, description: string}>>([])
  const [loadingNatures, setLoadingNatures] = useState(false)

  // Charger les natures de documents
  React.useEffect(() => {
    const loadNaturesDocuments = async () => {
      try {
        setLoadingNatures(true)
        const response = await fetch('/api/natures-documents')
        if (response.ok) {
          const data = await response.json()
          setNaturesDocuments(data.naturesDocuments || [])
        }
      } catch (error) {
        console.error('Erreur chargement natures documents:', error)
      } finally {
        setLoadingNatures(false)
      }
    }
    
    // Vérifier que Supabase Storage est configuré
    const checkStorageConfig = async () => {
      try {
        const response = await fetch('/api/check-storage')
        if (response.ok) {
          console.log('✅ Supabase Storage configuré correctement')
        } else {
          console.warn('⚠️ Problème de configuration Supabase Storage')
        }
      } catch (error) {
        console.error('❌ Erreur vérification Supabase Storage:', error)
      }
    }
    
    if (isOpen) {
      loadNaturesDocuments()
      checkStorageConfig()
    }
  }, [isOpen])

  // Charger les documents existants
  React.useEffect(() => {
    const loadExistingDocuments = async () => {
      try {
        setLoadingExisting(true)
        setError('') // Réinitialiser les erreurs
        
        const params = new URLSearchParams()
        if (searchExisting) params.set('search', searchExisting)
        params.set('limit', '50') // Limiter pour les performances
        
        const response = await fetch(`/api/documents?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          // Validation des données reçues
          const documents = Array.isArray(data.documents) ? data.documents : []
          setExistingDocuments(documents.filter(doc => doc && doc.id))
        } else {
          console.error('Erreur API documents:', response.status, response.statusText)
          setError('Erreur lors du chargement des documents existants')
        }
      } catch (error) {
        console.error('Erreur chargement documents existants:', error)
        setError('Erreur lors du chargement des documents existants')
      } finally {
        setLoadingExisting(false)
      }
    }
    
    if (isOpen && activeTab === 'existing') {
      loadExistingDocuments()
    }
  }, [isOpen, activeTab, searchExisting])

  // Debounce pour la recherche
  React.useEffect(() => {
    if (activeTab !== 'existing') return
    
    const timeoutId = setTimeout(() => {
      // Le useEffect précédent se déclenchera automatiquement
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchExisting, activeTab])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        return `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      })
      setError(`Fichiers rejetés: ${errors.join('; ')}`)
    }

    const newFiles: FileWithPreview[] = acceptedFiles.map((file, index) => {
      // Créer un objet FileWithPreview qui préserve le fichier original
      const fileWithPreview = file as FileWithPreview
      fileWithPreview.id = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
      fileWithPreview.preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      fileWithPreview.uploadStatus = 'pending' as const
      fileWithPreview.uploadProgress = 0
      return fileWithPreview
    })

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
    if (acceptedFiles.length > 0) {
      setActiveTab('metadata')
    }
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxSize * 1024 * 1024,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>)
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId)
      if (updatedFiles.length === 0) {
        setActiveTab('files')
      }
      return updatedFiles
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const toggleExistingFile = (documentId: string) => {
    setSelectedExistingFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(documentId)) {
        newSet.delete(documentId)
      } else {
        newSet.add(documentId)
      }
      return newSet
    })
  }

  const getFileIconForType = (fileType?: string) => {
    if (!fileType) return <FileIcon2 className="h-6 w-6 text-gray-500" />
    
    if (fileType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-blue-500" />
    if (fileType.startsWith('video/')) return <Video className="h-6 w-6 text-purple-500" />
    if (fileType.startsWith('audio/')) return <Music className="h-6 w-6 text-green-500" />
    if (fileType.includes('pdf')) return <FileTextIcon className="h-6 w-6 text-red-500" />
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-6 w-6 text-blue-600" />
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileIcon className="h-6 w-6 text-green-600" />
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return <Archive className="h-6 w-6 text-orange-500" />
    return <FileIcon2 className="h-6 w-6 text-gray-500" />
  }

  const handleClose = () => {
    setFiles([])
    setSelectedExistingFiles(new Set())
    setExistingDocuments([])
    setSearchExisting('')
    setMetadata({ title: '', description: '', category: '', tags: [] })
    setTagInput('')
    setError('')
    setSuccess('')
    setActiveTab('files')
    onClose()
  }

  const handleUpload = async () => {
    const totalFiles = files.length + selectedExistingFiles.size
    if (totalFiles === 0) {
      setError('Veuillez sélectionner au moins un fichier ou un document existant')
      return
    }

    setError('')
    setSuccess('')
    setIsUploading(true)

    try {
      const formData = new FormData()
      
      files.forEach((file) => {
        // Envoyer le fichier original directement - il est déjà un objet File valide
        formData.append('files', file)
      })
      
      // Ajouter les IDs des fichiers existants sélectionnés
      if (selectedExistingFiles.size > 0) {
        formData.append('existingFileIds', JSON.stringify(Array.from(selectedExistingFiles)))
      }

      formData.append('metadata', JSON.stringify({
        ...metadata,
        fileCount: files.length,
        existingFileCount: selectedExistingFiles.size,
        folderId: folderId || null
      }))

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        const serverError = result?.error || 'Erreur lors de l\'upload'
        const details = Array.isArray(result?.errors) && result.errors.length
          ? ` (${result.errors.length} fichier(s) en erreur)`
          : ''
        const errorDetails = result?.details ? ` - ${result.details}` : ''
        
        // Détection d'erreurs de configuration Supabase
        if (serverError.includes('Service de stockage non disponible') || 
            serverError.includes('Supabase Storage') ||
            serverError.includes('SUPABASE_SERVICE_ROLE_KEY')) {
          throw new Error(`Configuration manquante: Veuillez configurer les variables d'environnement Supabase (SUPABASE_SERVICE_ROLE_KEY)${errorDetails}`)
        }
        
        throw new Error(`${serverError}${details}${errorDetails}`)
      }

      setFiles(prev => prev.map(file => ({
        ...file,
        uploadStatus: 'success' as const,
        uploadProgress: 100
      })))

      const totalProcessed = files.length + selectedExistingFiles.size
      setSuccess(`${totalProcessed} fichier(s) traité(s) avec succès (${files.length} nouveau(x), ${selectedExistingFiles.size} existant(s))`)
      
      if (onUploadSuccess) {
        onUploadSuccess()
      }

      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('Erreur upload:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'upload')
      setFiles(prev => prev.map(file => ({
        ...file,
        uploadStatus: 'error' as const,
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
      })))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] p-0" showCloseButton={false}>
        <DialogHeader className="px-3 sm:px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CloudUpload className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Upload de fichiers
          </DialogTitle>
          <DialogDescription className="text-sm">
            Glissez-déposez vos fichiers ou cliquez pour les sélectionner. 
            Maximum {maxFiles} fichiers, {maxSize}MB par fichier.
          </DialogDescription>
        </DialogHeader>

        <div className="px-3 sm:px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="files" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sélection des fichiers</span>
                <span className="sm:hidden">Fichiers</span>
                {files.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                    {files.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="existing" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Fichiers existants</span>
                <span className="sm:hidden">Existants</span>
                {selectedExistingFiles.size > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                    {selectedExistingFiles.size}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="metadata" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm" disabled={files.length === 0 && selectedExistingFiles.size === 0}>
                <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Métadonnées</span>
                <span className="sm:hidden">Méta</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="mt-4">
              <div className="space-y-4">
                {/* Zone de drag & drop */}
                <Card className="border-2 border-dashed transition-colors">
                  <CardContent className="p-0">
                    <div
                      {...getRootProps()}
                      className={cn(
                        "flex flex-col items-center justify-center min-h-[160px] p-6 cursor-pointer transition-all duration-200",
                        isDragActive 
                          ? "border-primary bg-primary/5 border-solid" 
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={cn(
                          "p-3 rounded-full transition-colors",
                          isDragActive ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <Upload className="h-6 w-6" />
                        </div>
                        {isDragActive ? (
                          <div>
                            <p className="text-base font-medium text-primary">
                              Relâchez pour ajouter les fichiers
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-base font-medium">
                              Glissez-déposez vos fichiers ici
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ou cliquez pour sélectionner
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF, Word, Excel, Images, Texte (max {maxSize}MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des fichiers sélectionnés */}
                {files.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileIcon className="h-4 w-4" />
                        Fichiers sélectionnés ({files.length}/{maxFiles})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[250px]">
                        <div className="space-y-2">
                          {files.filter(file => file != null).map((file) => (
                            <div key={file.id} className="flex items-center gap-2 sm:gap-3 p-2 border rounded-lg">
                              <div className="flex-shrink-0">
                                {getFileIcon(file)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <p className="font-medium truncate text-sm">{file.name || 'Fichier sans nom'}</p>
                                  <Badge variant="outline" className="text-xs w-fit">
                                    {formatFileSize(file.size)}
                                  </Badge>
                                </div>
                                
                                {file.uploadStatus === 'uploading' && (
                                  <div className="mt-1">
                                    <Progress value={file.uploadProgress || 0} className="h-1" />
                                  </div>
                                )}
                                
                                {file.uploadStatus === 'error' && (
                                  <p className="text-xs text-destructive mt-1">
                                    {file.errorMessage}
                                  </p>
                                )}
                                
                                {file.uploadStatus === 'success' && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-600">Uploadé</span>
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(file.id)}
                                disabled={isUploading}
                                className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="existing" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Sélectionner des fichiers existants
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Barre de recherche */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Rechercher des documents..."
                        value={searchExisting}
                        onChange={(e) => setSearchExisting(e.target.value)}
                        className="h-9"
                      />
                      {loadingExisting && (
                        <div className="flex items-center px-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Liste des documents */}
                    <ScrollArea className="max-h-[300px]">
                      {existingDocuments.length === 0 && !loadingExisting ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            {searchExisting ? 'Aucun document trouvé' : 'Aucun document disponible'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {existingDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className={cn(
                                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                selectedExistingFiles.has(doc.id) 
                                  ? "border-primary bg-primary/5" 
                                  : "hover:bg-muted/50"
                              )}
                              onClick={() => toggleExistingFile(doc.id)}
                            >
                              <div className="flex-shrink-0">
                                {getFileIconForType(doc.file_type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate text-sm">{doc.title}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {formatFileSize(doc.file_size)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {doc.file_name || 'Nom de fichier non disponible'}
                                </p>
                                {doc.nature_document && (
                                  <p className="text-xs text-muted-foreground">
                                    {doc.nature_document.numero} - {doc.nature_document.nom}
                                  </p>
                                )}
                                {doc.description && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">
                                    {doc.description}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex-shrink-0">
                                {selectedExistingFiles.has(doc.id) ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <div className="h-4 w-4 border rounded border-muted-foreground/25" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {selectedExistingFiles.size > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          {selectedExistingFiles.size} fichier(s) existant(s) sélectionné(s)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="title" className="text-sm">Titre des documents</Label>
                        <Input
                          id="title"
                          placeholder="Titre descriptif pour ces documents"
                          value={metadata.title}
                          onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="category" className="text-sm">Catégorie</Label>
                        <Select
                          value={metadata.category}
                          onValueChange={(value) => setMetadata(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingNatures ? (
                              <SelectItem value="" disabled>
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Chargement...
                                </div>
                              </SelectItem>
                            ) : (
                              naturesDocuments.map((nature) => (
                                <SelectItem key={nature.id} value={nature.id}>
                                  {nature.numero} - {nature.nom}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="description" className="text-sm">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Description détaillée des documents"
                          value={metadata.description}
                          onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ajouter un tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="h-9"
                      />
                      <Button onClick={addTag} size="sm" variant="outline" className="h-9 px-3">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {metadata.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 w-3 h-3 hover:bg-transparent"
                              onClick={() => removeTag(tag)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-3 sm:px-4 pb-4">
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-3 border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button variant="outline" onClick={handleClose} disabled={isUploading} className="h-10 order-2 sm:order-1">
              Annuler
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={(files.length === 0 && selectedExistingFiles.size === 0) || isUploading}
              className="min-w-[120px] h-10 order-1 sm:order-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Traitement...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Traiter ({files.length + selectedExistingFiles.size})</span>
                  <span className="sm:hidden">Traiter</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
