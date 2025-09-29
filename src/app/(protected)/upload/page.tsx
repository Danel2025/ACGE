'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CompactPageLayout, PageHeader, ContentSection } from '@/components/shared/compact-page-layout'
import { FileUploadZone } from '@/components/upload/file-upload-zone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useFoldersSimple } from '@/hooks/use-folders-simple'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Upload, 
  Folder, 
  Tag,
  ArrowLeft,
  Check
} from 'lucide-react'

interface FileMetadata {
  tags: string[]
  folderId?: string
}

export default function UploadPage() {
  const router = useRouter()
  const { folders, isLoading: foldersLoading, error: foldersError } = useFoldersSimple()

  // Débogage
  console.log('🔍 [UploadPage] État du hook useFoldersSimple:', {
    foldersCount: folders.length,
    isLoading: foldersLoading,
    error: foldersError,
    firstFolder: folders[0]?.name || 'N/A'
  })
  const [metadata, setMetadata] = useState<FileMetadata>({
    tags: []
  })
  const [tagInput, setTagInput] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (files: File[]) => {
    setError('')
    
    try {
      const formData = new FormData()
      
      // Ajouter les fichiers
      files.forEach((file, index) => {
        formData.append(`files`, file)
      })
      
      // Ajouter les métadonnées
      formData.append('metadata', JSON.stringify({
        ...metadata,
        fileCount: files.length
      }))

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'  // Important : inclure les cookies d'authentification
      })

      const text = await response.text()
      let result: any = {}
      try {
        result = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('Erreur parsing réponse JSON:', parseError)
        result = {}
      }

      if (!response.ok) {
        const serverError = result?.error || 'Erreur lors de l\'upload'
        const details = Array.isArray(result?.errors) && result.errors.length
          ? ` (${result.errors.length} fichier(s) en erreur)`
          : ''
        const errorDetails = result?.details ? ` - ${result.details}` : ''
        throw new Error(`${serverError}${details}${errorDetails}`)
      }

      // Cas de succès avec erreurs partielles côté serveur
      if (Array.isArray(result?.errors) && result.errors.length) {
        const errorDetails = result.errors.map((err: any) => 
          `${err.fileName}: ${err.message}`
        ).join('; ')
        setError(`Upload partiel: ${result.errors.length} échec(s). Détails: ${errorDetails}`)
      }

      // Afficher le résumé de l'upload
      if (result.summary && result.summary.failed > 0) {
        setError(`Upload terminé: ${result.summary.success} succès, ${result.summary.failed} échec(s)`)
      }

      setIsSuccess(true)
      
      // Mise à jour optimiste de la liste des documents
      if (result.files && result.files.length > 0) {
        // Stocker les nouveaux documents dans sessionStorage pour la page documents
        const newDocuments = result.files.map((file: any) => ({
          id: file.id,
          title: file.title,
          description: file.description || '',
          author: { id: 'current-user', name: 'Vous', email: 'current@user.com' },
          folderId: file.folderId || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currentVersion: {
            id: file.id,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            filePath: file.path,
            url: file.url,
            createdAt: new Date().toISOString()
          },
          tags: file.tags || []
        }))

        sessionStorage.setItem('newDocuments', JSON.stringify(newDocuments))
      }

      router.push('/documents')

    } catch (error) {
      console.error('Erreur upload:', error)
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
    }
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

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  if (isSuccess) {
    return (
      <CompactPageLayout>
        <div className="max-w-2xl mx-auto py-12">
          <Card className="text-center transition-all duration-300 hover:shadow-lg">
            <CardContent className="pt-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-title-bold text-foreground mb-2" style={{animationDelay: '0.1s'}}>
                Upload réussi !
              </h2>
              <p className="text-muted-foreground mb-4" style={{animationDelay: '0.2s'}}>
                Vos fichiers ont été uploadés avec succès.
              </p>
              <p className="text-sm text-muted-foreground" style={{animationDelay: '0.3s'}}>
                Redirection vers la liste des documents...
              </p>
            </CardContent>
          </Card>
        </div>
      </CompactPageLayout>
    )
  }

  return (
    <CompactPageLayout>
      {/* Header compact réutilisable */}
      <PageHeader
        title="Upload de Fichiers"
        subtitle="Ajoutez de nouveaux fichiers à l'application avec des métadonnées"
        actions={
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()}
            className="h-8"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Zone d'upload principal */}
        <div className="lg:col-span-2">
          <ContentSection
            title="Sélection des fichiers"
            subtitle="Glissez-déposez vos fichiers ou cliquez pour les sélectionner"
          >
            <FileUploadZone onUpload={handleUpload} />
          </ContentSection>
        </div>

        {/* Options d'organisation */}
        <div className="space-y-4">
          {/* Tags */}
          <ContentSection
            title="Tags"
            subtitle="Ajoutez des tags pour faciliter la recherche"
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter un tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="h-8"
                />
                <Button 
                  onClick={addTag} 
                  size="sm"
                  className="h-8"
                >
                  Ajouter
                </Button>
              </div>

              {metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {metadata.tags.map((tag, index) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </ContentSection>

          {/* Dossier de destination */}
          <ContentSection
            title="Dossier"
            subtitle="Sélectionnez le dossier de destination"
          >
            <Select
              value={metadata.folderId || 'root'}
              onValueChange={(value) => setMetadata(prev => ({ 
                ...prev, 
                folderId: value === 'root' ? undefined : value 
              }))}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Racine (aucun dossier)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Racine (aucun dossier)</SelectItem>
                {foldersLoading ? (
                  <SelectItem value="loading" disabled>Chargement...</SelectItem>
                ) : folders.length > 0 ? (
                  folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                      {` (${folder.documentCount})`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-folders" disabled>Aucun dossier disponible</SelectItem>
                )}
              </SelectContent>
            </Select>
          </ContentSection>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            {error.includes('Bucket de stockage manquant') && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/storage-setup')}
                  className="h-7"
                >
                  Configurer le storage
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </CompactPageLayout>
  )
}

// Styles CSS simplifiés - Suppression des animations superficielles
