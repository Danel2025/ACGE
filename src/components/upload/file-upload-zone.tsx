'use client'
import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  File,
  Image,
  FileText,
  X,
  Check,
  AlertTriangle
} from 'lucide-react'
import { LoadingState } from '@/components/ui/loading-states'
interface FileWithPreview extends File {
  preview?: string
  uploadProgress?: number
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
  errorMessage?: string
}
interface FileUploadZoneProps {
  onUpload?: (files: FileWithPreview[]) => Promise<void>
  maxFiles?: number
  maxSize?: number // en MB
  acceptedTypes?: string[]
  className?: string
}
export function FileUploadZone({
  onUpload,
  maxFiles = 10,
  maxSize = 50, // 50MB par défaut
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/*',
    'text/*'
  ],
  className = ''
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('')
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
    // Vérification de sécurité pour file.type
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
  const handleUpload = async () => {
    if (files.length === 0 || !onUpload) return
    setIsUploading(true)
    setError('')
    try {
      await onUpload(files)
      // Marquer tous les fichiers comme uploadés avec succès
      setFiles(prev => prev.map(file => ({
        ...file,
        uploadStatus: 'success' as const,
        uploadProgress: 100
      })))
      // Nettoyer après 2 secondes
      setTimeout(() => {
        setFiles([])
      }, 2000)
    } catch (error) {
      setError('Erreur lors de l\'upload des fichiers')
      setFiles(prev => prev.map(file => ({
        ...file,
        uploadStatus: 'error' as const,
        errorMessage: 'Upload échoué'
      })))
    } finally {
      setIsUploading(false)
    }
  }
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drop améliorée */}
      <Card className={`border-2 border-dashed transition-all duration-300 transform ${
        isDragActive 
          ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg' 
          : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20'
      }`}>
        <CardContent className="p-4">
          <div
            {...getRootProps()}
            className="text-center cursor-pointer group"
          >
            <input {...getInputProps()} />
            <div className={`mx-auto h-12 w-12 mb-4 transition-all duration-300 ${
              isDragActive ? 'text-primary scale-110 animate-bounce' : 'text-primary group-hover:scale-110'
            }`}>
              <Upload className="w-full h-full" />
            </div>
            {isDragActive ? (
              <div className="">
                <p className="text-lg font-medium text-primary">
                  Déposez les fichiers ici...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="">
                  <p className="text-lg font-medium text-foreground mb-2">
                    Glissez-déposez vos fichiers ici
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    ou cliquez pour sélectionner des fichiers
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className=" transition-all duration-300 hover:scale-105 hover:shadow-md"
                  style={{animationDelay: '0.1s'}}
                >
                  Parcourir les fichiers
                </Button>
              </div>
            )}
            <div className="mt-6 text-xs text-muted-foreground space-y-1 " style={{animationDelay: '0.2s'}}>
              <p>Formats acceptés : PDF, Word, Excel, Images, Texte</p>
              <p>Taille maximale : {maxSize}MB par fichier • Maximum {maxFiles} fichiers</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Messages d'erreur améliorés */}
      {error && (
        <Alert variant="destructive" className="">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Liste des fichiers améliorée */}
      {files.length > 0 && (
        <Card className=" transition-all duration-300 hover:shadow-md">
          <CardContent className="p-3">
            <div className="space-y-3">
              <h3 className="font-title-medium text-lg flex items-center gap-2 ">
                <File className="w-5 h-5 text-primary" />
                Fichiers sélectionnés ({files.length})
              </h3>
              {files.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg transition-all duration-300 hover:bg-muted/30 hover:scale-[1.01] "
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  {}
                  <div className="flex-shrink-0 transition-transform duration-300 hover:scale-110">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded">
                        {getFileIcon(file)}
                      </div>
                    )}
                  </div>
                  {/* Informations du fichier */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    {/* Barre de progression */}
                    {file.uploadStatus === 'uploading' && (
                      <Progress value={file.uploadProgress || 0} className="mt-2 h-2 animate-pulse" />
                    )}
                    {/* Message d'erreur */}
                    {file.uploadStatus === 'error' && file.errorMessage && (
                      <p className="text-xs text-destructive mt-1 ">{file.errorMessage}</p>
                    )}
                  </div>
                  {/* Statut et actions */}
                  <div className="flex items-center gap-2">
                    {file.uploadStatus === 'success' && (
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center ">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                    {file.uploadStatus === 'error' && (
                      <div className="w-5 h-5 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center ">
                        <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                    {file.uploadStatus === 'uploading' && (
                      <LoadingState isLoading={true} size="md" showText={false} />
                    )}
                    {file.uploadStatus === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0 transition-all duration-300 hover:scale-110 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Bouton d'upload amélioré */}
            {files.some(f => f.uploadStatus === 'pending') && (
              <div className="mt-4 flex justify-end ">
                <Button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="min-w-32 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                >
                  {isUploading ? (
                    <>
                      <div className="mr-2">
                        <LoadingState isLoading={true} size="sm" showText={false} />
                      </div>
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                      Uploader {files.filter(f => f.uploadStatus === 'pending').length} fichier(s)
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
// Styles CSS simplifiés - Suppression des animations superficielles
