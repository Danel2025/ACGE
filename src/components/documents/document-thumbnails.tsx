'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, 
  ChevronRight, 
  Grid3X3, 
  List, 
  Eye, 
  EyeOff,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  FileSpreadsheet,
  Loader2,
  AlertTriangle
 } from 'lucide-react'
import { DocumentItem } from '@/types/document'
import { cn } from '@/lib/utils'

interface DocumentThumbnailsProps {
  documents: DocumentItem[]
  currentIndex: number
  onDocumentSelect: (index: number) => void
  isVisible: boolean
  onToggle: () => void
  onDownload?: (document: DocumentItem) => void
  className?: string
}

type ThumbnailSize = 'small' | 'medium' | 'large'
type ViewMode = 'grid' | 'list'

const FILE_TYPE_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  office: FileSpreadsheet,
  archive: Archive,
  default: FileText
} as const

const getFileTypeIcon = (fileType?: string) => {
  if (!fileType) return FILE_TYPE_ICONS.default
  if (fileType.startsWith('image/')) return FILE_TYPE_ICONS.image
  if (fileType.startsWith('video/')) return FILE_TYPE_ICONS.video
  if (fileType.startsWith('audio/')) return FILE_TYPE_ICONS.audio
  if (fileType === 'application/pdf') return FILE_TYPE_ICONS.pdf
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('word')) return FILE_TYPE_ICONS.office
  if (fileType.includes('zip') || fileType.includes('rar')) return FILE_TYPE_ICONS.archive
  return FILE_TYPE_ICONS.default
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function DocumentThumbnails({
  documents,
  currentIndex,
  onDocumentSelect,
  isVisible,
  onToggle,
  onDownload,
  className
}: DocumentThumbnailsProps) {
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>('medium')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map())
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set())
  const [errorThumbnails, setErrorThumbnails] = useState<Set<string>>(new Set())

  const containerRef = useRef<HTMLDivElement>(null)

  // Chargement des miniatures
  const loadThumbnail = useCallback(async (document: DocumentItem) => {
    if (previewUrls.has(document.id) || loadingThumbnails.has(document.id)) return

    setLoadingThumbnails(prev => new Set(prev).add(document.id))

    try {
      const documentId = document.originalId || document.id
      const apiUrl = `/api/files/${documentId}`
      
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        
        setPreviewUrls(prev => new Map(prev).set(document.id, url))
      } else {
        // Fallback vers l'URL Supabase directe
        if (document.filePath && document.filePath.startsWith('http')) {
          const fallbackResponse = await fetch(document.filePath)
          if (fallbackResponse.ok) {
            const blob = await fallbackResponse.blob()
            const url = URL.createObjectURL(blob)
            setPreviewUrls(prev => new Map(prev).set(document.id, url))
          } else {
            throw new Error('Impossible de charger la miniature')
          }
        } else {
          throw new Error('Impossible de charger la miniature')
        }
      }
    } catch (error) {
      console.error('Erreur chargement miniature:', error)
      setErrorThumbnails(prev => new Set(prev).add(document.id))
    } finally {
      setLoadingThumbnails(prev => {
        const newSet = new Set(prev)
        newSet.delete(document.id)
        return newSet
      })
    }
  }, [previewUrls, loadingThumbnails])

  // Chargement des miniatures visibles
  useEffect(() => {
    if (!isVisible) return

    const visibleDocuments = documents.slice(
      Math.max(0, currentIndex - 10),
      Math.min(documents.length, currentIndex + 10)
    )

    visibleDocuments.forEach(doc => {
      if (doc.fileType?.startsWith('image/') || doc.fileType?.startsWith('video/')) {
        loadThumbnail(doc)
      }
    })
  }, [isVisible, documents, currentIndex, loadThumbnail])

  // Nettoyage des URLs
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        URL.revokeObjectURL(url)
      })
    }
  }, [previewUrls])

  // Rendu d'une miniature
  const renderThumbnail = (document: DocumentItem, index: number) => {
    const isActive = index === currentIndex
    const isLoading = loadingThumbnails.has(document.id)
    const hasError = errorThumbnails.has(document.id)
    const previewUrl = previewUrls.get(document.id)
    const FileIcon = getFileTypeIcon(document.fileType)

    const thumbnailClasses = cn(
      "relative group cursor-pointer transition-all duration-200 border-2 rounded-lg overflow-hidden",
      isActive 
        ? "border-primary ring-2 ring-primary/20 scale-105" 
        : "border-border hover:border-primary/50 hover:scale-102",
      viewMode === 'list' ? "flex items-center space-x-3 p-3" : "aspect-square"
    )

    const sizeClasses = {
      small: viewMode === 'grid' ? "w-16 h-16" : "w-full h-12",
      medium: viewMode === 'grid' ? "w-24 h-24" : "w-full h-16",
      large: viewMode === 'grid' ? "w-32 h-32" : "w-full h-20"
    }

    return (
      <div
        key={document.id}
        className={cn(thumbnailClasses, sizeClasses[thumbnailSize])}
        onClick={() => onDocumentSelect(index)}
      >
        {viewMode === 'grid' ? (
          // Mode grille
          <div className="w-full h-full flex items-center justify-center bg-muted">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : hasError ? (
              <AlertTriangle className="h-6 w-6 text-destructive" />
            ) : previewUrl && document.fileType?.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt={document.title}
                className="w-full h-full object-cover"
                onError={() => setErrorThumbnails(prev => new Set(prev).add(document.id))}
              />
            ) : (
              <FileIcon className="h-8 w-8 text-muted-foreground" />
            )}

            {/* Overlay d'actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex space-x-2">
                {document.fileType?.startsWith('video/') && (
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                {onDownload && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownload(document)
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Indicateur de type */}
            <div className="absolute top-1 right-1">
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {document.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
              </Badge>
            </div>
          </div>
        ) : (
          // Mode liste
          <div className="flex items-center space-x-3 w-full">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-muted rounded">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : hasError ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : previewUrl && document.fileType?.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={document.title}
                  className="w-full h-full object-cover rounded"
                  onError={() => setErrorThumbnails(prev => new Set(prev).add(document.id))}
                />
              ) : (
                <FileIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{document.title}</p>
              <p className="text-xs text-muted-foreground truncate">{document.fileName}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {document.fileSize ? formatFileSize(document.fileSize) : 'N/A'}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(document.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Badge variant="secondary" className="text-xs">
                {document.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
              </Badge>
            </div>
          </div>
        )}

        {/* Indicateur de sélection */}
        {isActive && (
          <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
        )}
      </div>
    )
  }

  if (!isVisible) return null

  return (
    <div className={cn("bg-background border-t shadow-lg", className)}>
      {/* En-tête */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-title-semibold text-sm">Miniatures</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn("h-8 w-8 p-0", viewMode === 'grid' && "bg-primary text-primary-foreground")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn("h-8 w-8 p-0", viewMode === 'list' && "bg-primary text-primary-foreground")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contrôles de taille */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Taille:</span>
          <div className="flex space-x-1">
            {(['small', 'medium', 'large'] as ThumbnailSize[]).map((size) => (
              <Button
                key={size}
                variant="ghost"
                size="sm"
                onClick={() => setThumbnailSize(size)}
                className={cn(
                  "h-6 px-2 text-xs",
                  thumbnailSize === size && "bg-primary text-primary-foreground"
                )}
              >
                {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div 
        ref={containerRef}
        className={cn(
          "p-4 overflow-y-auto max-h-96",
          viewMode === 'grid' ? "grid gap-2" : "space-y-2"
        )}
        style={{
          gridTemplateColumns: viewMode === 'grid' 
            ? `repeat(auto-fill, minmax(${thumbnailSize === 'small' ? '4rem' : thumbnailSize === 'medium' ? '6rem' : '8rem'}, 1fr))`
            : undefined
        }}
      >
        {documents.map((document, index) => renderThumbnail(document, index))}
      </div>

      {/* Navigation */}
      {documents.length > 0 && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {documents.length}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDocumentSelect(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDocumentSelect(Math.min(documents.length - 1, currentIndex + 1))}
                disabled={currentIndex === documents.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
