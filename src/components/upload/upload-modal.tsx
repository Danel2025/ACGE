'use client'
import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingState } from '@/components/ui/loading-states'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  Check, 
  AlertTriangle,
  Loader2,
  Plus,
  Tag
 } from 'lucide-react'
interface FileWithPreview extends File {
  preview?: string
  uploadProgress?: number
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
  errorMessage?: string
}
interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  folderId?: string
  onUploadSuccess?: () => void
  maxFiles?: number
  maxSize?: number // en MB
  acceptedTypes?: string[]
}
export function UploadModal({
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
}: UploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
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
  // Charger les natures de documents au montage du composant
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
    if (isOpen) {
      loadNaturesDocuments()
    }
  }, [isOpen])
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('')
    setSuccess('')
    // Gérer les fichiers rejetés
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map((e: any) => {
          switch (e.code) {
            case 'file-too-large':
              return `${file.name} est trop volumineux (max: ${maxSize}MB)`
            case 'file-invalid-type':
              return `${file.name} n'est pas un type de fichier autorisé`
            case 'too-many-files':
              return `Trop de fichiers (max: ${maxFiles})`
            default:
              return `${file.name}: ${e.message}`
          }
        })
        return errorMessages.join(', ')
      })
      setError(errors.join('; '))
    }
    // Ajouter les fichiers acceptés
    const newFiles = acceptedFiles.map(file => {
      const fileWithPreview = Object.assign(file, {
        preview: file.type && file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploadProgress: 0,
        uploadStatus: 'pending' as const
      })
      return fileWithPreview
    })
    setFiles(prev => [...prev, ...newFiles])
  }, [maxFiles, maxSize])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize: maxSize * 1024 * 1024, // Convertir MB en bytes
    multiple: true
  })
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }
  const getFileIcon = (file: File) => {
    if (!file.type) {
      return <File className="w-5 h-5 text-muted-foreground" />
    }
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5 text-muted-foreground" />
    if (file.type.includes('pdf')) return <FileText className="w-5 h-5 text-muted-foreground" />
    if (file.type.includes('word') || file.type.includes('document')) 
      return <FileText className="w-5 h-5 text-muted-foreground" />
    if (file.type.includes('excel') || file.type.includes('sheet')) 
      return <FileText className="w-5 h-5 text-muted-foreground" />
    return <File className="w-5 h-5 text-muted-foreground" />
  }
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Veuillez sélectionner au moins un fichier')
      return
    }
    setError('')
    setSuccess('')
    setIsUploading(true)
    try {
      const formData = new FormData()
      // Ajouter les fichiers
      files.forEach((file) => {
        formData.append('files', file)
      })
      // Ajouter les métadonnées
      formData.append('metadata', JSON.stringify({
        ...metadata,
        fileCount: files.length,
        folderId: folderId || null
      }))
      console.log('Upload modal: Sending upload request to /api/upload')
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      console.log('Upload modal: Response received:', result)
      if (!response.ok) {
        const serverError = result?.error || 'Erreur lors de l\'upload'
        const details = Array.isArray(result?.errors) && result.errors.length
          ? ` (${result.errors.length} fichier(s) en erreur)`
          : ''
        const errorDetails = result?.details ? ` - ${result.details}` : ''
        throw new Error(`${serverError}${details}${errorDetails}`)
      }
      // Mise à jour du statut des fichiers
      setFiles(prev => prev.map(file => ({
        ...file,
        uploadStatus: 'success' as const,
        uploadProgress: 100
      })))
      setSuccess(`${files.length} fichier(s) uploadé(s) avec succès`)
      // Appeler le callback de succès
      if (onUploadSuccess) {
        onUploadSuccess()
      }
      // Fermer le modal après un délai
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Erreur upload modal:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'upload')
      // Mise à jour du statut des fichiers en erreur
      setFiles(prev => prev.map(file => ({
        ...file,
        uploadStatus: 'error' as const,
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
      })))
    } finally {
      setIsUploading(false)
    }
  }
  const handleClose = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    // Réinitialiser l'état
    setFiles([])
    setError('')
    setSuccess('')
    setMetadata({
      title: '',
      description: '',
      category: '',
      tags: []
    })
    setTagInput('')
    onClose()
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full h-full max-h-[95vh] overflow-hidden p-0 max-w-[calc(100vw-0.25rem)] sm:max-w-[calc(100vw-0.5rem)] box-border" showCloseButton={false}>
        <DialogHeader className="p-0 m-0">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-base sm:text-lg">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload de fichiers
            </div>
            {folderId && <span className="text-xs sm:text-sm text-muted-foreground">(dans le dossier)</span>}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Glissez-déposez vos fichiers ou cliquez pour les sélectionner
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 overflow-y-auto max-h-[75vh] p-2 box-border">
          {/* Zone de drop */}
          <Card 
            {...getRootProps()} 
            className={`border-2 border-dashed transition-colors cursor-pointer box-border ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <CardContent className="flex flex-col items-center justify-center py-3 px-2 sm:px-4">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground mb-1 sm:mb-2" />
              <p className="text-sm sm:text-base font-medium mb-1 sm:mb-2 text-center px-2">
                {isDragActive ? 'Déposez les fichiers ici' : 'Glissez-déposez vos fichiers'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 text-center px-2">
                ou cliquez pour sélectionner
              </p>
              <Button variant="outline" type="button" className="w-full sm:w-auto max-w-xs">
                <span className="hidden sm:inline">Sélectionner des fichiers</span>
                <span className="sm:hidden">Sélectionner</span>
              </Button>
              <input {...getInputProps()} />
              <p className="text-xs text-muted-foreground mt-1 sm:mt-2 text-center px-2 break-words">
                Types acceptés: PDF, Word, Excel, Images, Texte<br className="sm:hidden" />
                <span className="hidden sm:inline"> (max {maxSize}MB, {maxFiles} fichiers)</span>
                <span className="sm:hidden"> (max {maxSize}MB, {maxFiles} fichiers)</span>
              </p>
            </CardContent>
          </Card>
          {/* Liste des fichiers sélectionnés */}
          {files.length > 0 && (
            <div className="space-y-1 px-1">
              <h3 className="text-sm sm:text-base font-title-medium">Fichiers sélectionnés ({files.length})</h3>
              <div className="space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg box-border">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="shrink-0">
                        {getFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                          {file.uploadStatus === 'success' && (
                            <span className="ml-1 sm:ml-2 text-green-600">✓ Uploadé</span>
                          )}
                          {file.uploadStatus === 'error' && (
                            <span className="ml-1 sm:ml-2 text-red-600">✗ Erreur</span>
                          )}
                        </p>
                        {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
                          <Progress value={file.uploadProgress} className="mt-1 h-1 sm:h-2" />
                        )}
                        {file.errorMessage && (
                          <p className="text-xs text-red-600 mt-1 break-words">{file.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="shrink-0 h-8 w-8 p-0"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Métadonnées */}
          <div className="space-y-1 px-1">
            <h3 className="text-sm sm:text-base font-title-medium">Métadonnées (optionnel)</h3>
            <div className="grid grid-cols-1 gap-1">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-sm">Titre</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre des documents"
                  className="text-sm w-full box-border"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category" className="text-sm">Catégorie</Label>
                <Select
                  value={metadata.category}
                  onValueChange={(value) => setMetadata(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="text-sm w-full box-border">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {loadingNatures ? (
                      <SelectItem value="loading" disabled>Chargement...</SelectItem>
                    ) : naturesDocuments.length > 0 ? (
                      naturesDocuments.map((nature) => (
                        <SelectItem key={nature.id} value={nature.nom}>
                          {nature.nom}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-natures" disabled>Aucune nature disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description des documents"
                rows={2}
                className="text-sm resize-none w-full box-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Tags</Label>
              <div className="flex gap-2 w-full">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Ajouter un tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="text-sm flex-1 min-w-0 box-border"
                />
                <Button type="button" variant="outline" onClick={addTag} className="shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                  {metadata.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs max-w-full">
                      <Tag className="w-3 h-3 shrink-0" />
                      <span className="truncate">{tag}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1 shrink-0"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Messages d'erreur et de succès */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isUploading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={files.length === 0 || isUploading}
              className="w-full sm:w-auto min-w-[120px] order-1 sm:order-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 mr-2">
                    <LoadingState isLoading={true} size="sm" showText={false} />
                  </div>
                  <span className="hidden sm:inline">Upload...</span>
                  <span className="sm:hidden">Upload...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Uploader</span>
                  <span className="sm:hidden">Uploader</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
