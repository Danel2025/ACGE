"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Download,
  ExternalLink,
  AlertTriangle,
  X,
  Calendar,
  Maximize,
  Minimize,
} from 'lucide-react'
import { LoadingState } from '@/components/ui/loading-states'
import {
  User,
  Folder,
  Tag,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { DocumentItem } from "@/types/document"
import { cn } from "@/lib/utils"

interface DocumentPreviewModalProps {
  document: DocumentItem | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (document: DocumentItem) => void
  onEdit?: (document: DocumentItem) => void
  onShare?: (document: DocumentItem) => void
}

/**
 * Composant de prévisualisation de documents réutilisable
 * Supporte les images, PDFs, vidéos, audios et autres types de fichiers
 */
export function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
  onDownload,
  onEdit,
  onShare
}: DocumentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)

  // Fonction de téléchargement - Version drastique sans manipulation DOM
  const handleDownload = async () => {
    if (!document) return

    setIsDownloading(true)
    try {
      const documentId = document.originalId || document.id
      const response = await fetch(`/api/files/${documentId}`)

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }

      const blob = await response.blob()
      const fileName = document.fileName || document.title || 'document'

      // Méthode moderne sans createElement
      if ('showSaveFilePicker' in window) {
        // API File System Access (Chrome, Edge moderne)
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
          })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            // Fallback si l'utilisateur annule
            throw err
          }
        }
      } else {
        // Fallback pour les navigateurs plus anciens - Version ultra-simple
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName

        // Déclencher le téléchargement sans ajouter au DOM
        a.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }))

        // Nettoyer immédiatement
        URL.revokeObjectURL(url)
      }

      // Appeler la fonction onDownload si fournie
      if (onDownload) {
        onDownload(document)
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error)
      setError('Erreur lors du téléchargement du fichier')
    } finally {
      setIsDownloading(false)
    }
  }

  // Nettoyer l'URL de prévisualisation lors de la fermeture
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null)
      setError(null)
      setIsLoading(false)
      setShowFullscreen(false)
    }
  }, [isOpen])

  // Générer l'URL de prévisualisation
  useEffect(() => {
    if (!document || !isOpen) return

    const generatePreviewUrl = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Pour les fichiers stockés dans Supabase Storage
        if (document.filePath) {
          // Construire l'URL de prévisualisation depuis Supabase Storage
          const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const bucket = 'documents' // Nom du bucket Supabase
          
          // Nettoyer le chemin du fichier (enlever les slashes en début)
          let cleanFilePath = document.filePath.startsWith('/') 
            ? document.filePath.slice(1) 
            : document.filePath
          
          // Si le fichier n'est pas dans le sous-dossier "documents", l'y placer
          if (!cleanFilePath.startsWith('documents/')) {
            cleanFilePath = `documents/${cleanFilePath}`
          }
            
          const previewUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${cleanFilePath}`
          
          // Vérifier si l'URL est valide
          if (!baseUrl) {
            setError("Configuration Supabase manquante")
            return
          }
          
          // Debug: Afficher l'URL générée
          console.log('URL de prévisualisation générée:', previewUrl)
          console.log('Chemin du fichier original:', document.filePath)
          console.log('Chemin nettoyé:', cleanFilePath)
          console.log('Base URL Supabase:', baseUrl)
          console.log('Bucket utilisé:', bucket)
          
          // Vérifier si le fichier existe en faisant une requête HEAD
          try {
            const response = await fetch(previewUrl, { method: 'HEAD' })
            console.log('Réponse HEAD:', response.status, response.statusText)
            console.log('Headers de réponse:', Object.fromEntries(response.headers.entries()))
            
            if (!response.ok) {
              if (response.status === 404) {
                // Essayer le chemin original sans le sous-dossier "documents"
                const originalFilePath = document.filePath.startsWith('/') 
                  ? document.filePath.slice(1) 
                  : document.filePath
                const alternativeUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${originalFilePath}`
                
                console.log('Tentative avec chemin alternatif:', alternativeUrl)
                const altResponse = await fetch(alternativeUrl, { method: 'HEAD' })
                
                if (altResponse.ok) {
                  console.log('✅ Fichier trouvé avec chemin alternatif')
                  setPreviewUrl(alternativeUrl)
                  return
                } else {
                  setError("Fichier non trouvé (404). Vérifiez que le fichier existe dans le bucket 'documents'.")
                  return
                }
              } else if (response.status === 403) {
                setError("Accès refusé (403). Le bucket existe mais les permissions ne permettent pas l'accès public.")
              } else if (response.status === 401) {
                setError("Non autorisé (401). Vérifiez la configuration d'authentification.")
              } else {
                setError(`Erreur ${response.status}: ${response.statusText}`)
              }
              return
            }
            console.log('✅ Fichier vérifié avec succès:', response.status)
          } catch (fetchError) {
            console.warn('Impossible de vérifier l\'existence du fichier:', fetchError)
            // On continue quand même, parfois la vérification HEAD échoue mais le fichier est accessible
          }
          
          setPreviewUrl(previewUrl)
        } else {
          setError("Aucun fichier associé à ce document")
        }
      } catch (err) {
        console.error('Erreur lors de la génération de l\'URL de prévisualisation:', err)
        setError("Impossible de charger la prévisualisation")
      } finally {
        setIsLoading(false)
      }
    }

    generatePreviewUrl()
  }, [document, isOpen])

  // Déterminer le type de fichier et l'icône appropriée
  const getFileIcon = (fileType?: string | null) => {
    if (!fileType) return <File className="h-8 w-8" />
    
    if (fileType.startsWith('image/')) return <Image className="h-8 w-8" />
    if (fileType.startsWith('video/')) return <Video className="h-8 w-8" />
    if (fileType.startsWith('audio/')) return <Music className="h-8 w-8" />
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8" />
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-8 w-8" />
    
    return <File className="h-8 w-8" />
  }

  // Déterminer si le fichier peut être prévisualisé
  const canPreview = (fileType?: string | null) => {
    if (!fileType) return false
    
    return (
      fileType.startsWith('image/') ||
      fileType.startsWith('video/') ||
      fileType.startsWith('audio/') ||
      fileType.includes('pdf') ||
      fileType.includes('text/')
    )
  }

  // Formater la taille du fichier
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'Taille inconnue'
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!document) return null

  const fileType = document.fileType
  const canPreviewFile = canPreview(fileType)

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className={cn("p-0 z-[10001] transition-all duration-300 flex flex-col", showFullscreen ? "max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh]" : "max-w-5xl max-h-[98vh]")} showCloseButton={false}>
        <DialogHeader className={cn(showFullscreen ? "p-1 pb-0 flex-shrink-0" : "p-1 pb-1")}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {getFileIcon(fileType)}
              <div>
                <DialogTitle className="text-lg font-title-semibold leading-tight">
                  {document.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground leading-tight">
                  {document.fileName || 'Fichier sans nom'}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullscreen(!showFullscreen)}
              className="ml-2"
            >
              {showFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        {!showFullscreen && <Separator />}

        <div className="flex-1 overflow-hidden min-h-0">
          <div className={cn("grid gap-0 h-full", showFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
            {/* Zone de prévisualisation */}
            <div className={cn("flex flex-col h-full", showFullscreen ? "col-span-1" : "lg:col-span-2")}>
              <div className={cn("flex-1 flex items-center justify-center", showFullscreen ? "p-0 bg-transparent" : "p-1 bg-muted/20")}>
                {isLoading ? (
                  <div className="flex flex-col items-center space-y-2">
                    <LoadingState isLoading={true} message="Chargement de la prévisualisation..." />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center space-y-3 text-center p-4">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-destructive">{error}</p>
                      {previewUrl && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          <p>URL générée :</p>
                          <code className="break-all">{previewUrl}</code>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Vérifiez que le fichier existe dans le bucket 'documents' de Supabase Storage.
                      </p>
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2">
                        <p><strong>Solutions possibles :</strong></p>
                        <ul className="list-disc list-inside space-y-1 mt-1">
                          <li>Vérifiez que le bucket 'documents' est marqué comme <strong>public</strong></li>
                          <li>Vérifiez les politiques RLS dans Supabase Dashboard</li>
                          <li>Testez l'URL directement dans un nouvel onglet</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(previewUrl || '', '_blank')}
                        disabled={!previewUrl}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ouvrir dans un nouvel onglet
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setError(null)
                          setIsLoading(true)
                          // Recharger l'URL
                          if (document?.filePath) {
                            const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                            const bucket = 'documents'
                            const cleanFilePath = document.filePath.startsWith('/') 
                              ? document.filePath.slice(1) 
                              : document.filePath
                            const newUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${cleanFilePath}`
                            setPreviewUrl(newUrl)
                            setIsLoading(false)
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Réessayer
                      </Button>
                    </div>
                  </div>
                ) : canPreviewFile && previewUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    {fileType?.startsWith('image/') ? (
                      <img
                        src={previewUrl}
                        alt={document.title}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                        onError={(e) => {
                          console.error('Erreur de chargement de l\'image:', previewUrl)
                          console.error('Erreur native:', e)
                          
                          // Essayer une approche alternative avec des paramètres de cache
                          const img = e.target as HTMLImageElement
                          const originalSrc = img.src
                          const newSrc = originalSrc + '?t=' + Date.now()
                          
                          console.log('Tentative de rechargement avec URL:', newSrc)
                          img.src = newSrc
                          
                          // Si ça échoue encore, afficher l'erreur
                          setTimeout(() => {
                            if (img.complete && img.naturalHeight === 0) {
                              setError("Impossible de charger l'image. Vérifiez les permissions du bucket 'documents' dans Supabase Storage.")
                            }
                          }, 2000)
                        }}
                        onLoad={() => {
                          console.log('Image chargée avec succès:', previewUrl)
                        }}
                      />
                    ) : fileType?.startsWith('video/') ? (
                      <video
                        src={previewUrl}
                        controls
                        className="max-w-full max-h-full rounded-lg shadow-lg"
                        onError={() => setError("Impossible de charger la vidéo")}
                      >
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                    ) : fileType?.startsWith('audio/') ? (
                      <div className="w-full max-w-md">
                        <audio
                          src={previewUrl}
                          controls
                          className="w-full"
                          onError={() => setError("Impossible de charger l'audio")}
                        >
                          Votre navigateur ne supporte pas la lecture audio.
                        </audio>
                      </div>
                    ) : fileType?.includes('pdf') ? (
                      <iframe
                        src={previewUrl}
                        className={cn("w-full h-full", showFullscreen ? "rounded-none" : "rounded-lg shadow-lg")}
                        title={document.title}
                        onError={() => setError("Impossible de charger le PDF")}
                      />
                    ) : (
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Aperçu non disponible pour ce type de fichier
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => window.open(previewUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ouvrir le fichier
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    {getFileIcon(fileType)}
                    <p className="text-sm text-muted-foreground mt-2 mb-2">
                      Aperçu non disponible pour ce type de fichier
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(previewUrl || '', '_blank')}
                      disabled={!previewUrl}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ouvrir le fichier
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Panneau d'informations */}
            <div className={cn("lg:col-span-1 border-l bg-muted/5", showFullscreen && "hidden")}>
              <ScrollArea className="h-full">
                <div className="p-3 space-y-3">
                  {/* Informations générales */}
                  <div>
                    <h3 className="font-title-semibold mb-1 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Informations
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="secondary">
                          {fileType || 'Inconnu'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taille:</span>
                        <span>{formatFileSize(document.fileSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Créé le:</span>
                        <span>{formatDate(document.createdAt)}</span>
                      </div>
                      {document.updatedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Modifié le:</span>
                          <span>{formatDate(document.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Auteur */}
                  <div>
                    <h3 className="font-title-semibold mb-1 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Auteur
                    </h3>
                    <div className="text-sm">
                      <p className="font-medium">{document.author.name}</p>
                      <p className="text-muted-foreground">{document.author.email}</p>
                    </div>
                  </div>

                  {/* Dossier */}
                  {document.folder && (
                    <div>
                      <h3 className="font-title-semibold mb-1 flex items-center">
                        <Folder className="h-4 w-4 mr-2" />
                        Dossier
                      </h3>
                      <Badge variant="outline">
                        {document.folder.name}
                      </Badge>
                    </div>
                  )}

                  {/* Description */}
                  {document.description && (
                    <div>
                      <h3 className="font-title-semibold mb-1">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {document.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {document.tags && document.tags.length > 0 && (
                    <div>
                      <h3 className="font-title-semibold mb-1 flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {document.tags.map((tag) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div>
                    <h3 className="font-title-semibold mb-1">Actions</h3>
                    <div className="space-y-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleDownload}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <div className="h-4 w-4 mr-2">
                            <LoadingState isLoading={true} size="sm" showText={false} noPadding={true} />
                          </div>
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {isDownloading ? 'Téléchargement...' : 'Télécharger'}
                      </Button>
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => onEdit(document)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      )}
                      {onShare && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => onShare(document)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Partager
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          if (previewUrl) {
                            window.open(previewUrl, '_blank')
                          } else if (document) {
                            const documentId = document.originalId || document.id
                            window.open(`/api/files/${documentId}`, '_blank')
                          }
                        }}
                        disabled={!previewUrl && !document}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ouvrir dans un nouvel onglet
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full justify-start mt-2"
                        onClick={onClose}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Fermer
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
