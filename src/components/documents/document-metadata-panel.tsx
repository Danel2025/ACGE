'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Calendar, 
  User, 
  HardDrive, 
  FileText, 
  Tag, 
  Eye, 
  EyeOff, 
  Edit, 
  Save, 
  X, 
  Download,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Clock,
  Shield,
  Globe,
  Lock
 } from 'lucide-react'
import { DocumentItem } from '@/types/document'
import { cn } from '@/lib/utils'

interface DocumentMetadataPanelProps {
  document: DocumentItem
  isVisible: boolean
  onToggle: () => void
  onUpdate?: (updates: Partial<DocumentItem>) => void
  onDownload?: () => void
  onShare?: () => void
  className?: string
}

interface MetadataField {
  key: string
  label: string
  value: any
  type: 'text' | 'date' | 'number' | 'select' | 'textarea' | 'tags'
  editable: boolean
  options?: string[]
}

export function DocumentMetadataPanel({
  document,
  isVisible,
  onToggle,
  onUpdate,
  onDownload,
  onShare,
  className
}: DocumentMetadataPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedFields, setEditedFields] = useState<Record<string, any>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Formatage des données
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileTypeIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="h-4 w-4" />
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType === 'application/pdf') return '📄'
    if (fileType.startsWith('text/')) return '📝'
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊'
    if (fileType.includes('word')) return '📝'
    return <FileText className="h-4 w-4" />
  }

  // Configuration des champs de métadonnées
  const metadataFields: MetadataField[] = [
    {
      key: 'title',
      label: 'Titre',
      value: document.title,
      type: 'text',
      editable: true
    },
    {
      key: 'fileName',
      label: 'Nom du fichier',
      value: document.fileName,
      type: 'text',
      editable: false
    },
    {
      key: 'fileSize',
      label: 'Taille',
      value: document.fileSize ? formatFileSize(document.fileSize) : 'N/A',
      type: 'text',
      editable: false
    },
    {
      key: 'fileType',
      label: 'Type de fichier',
      value: document.fileType?.split('/')[1]?.toUpperCase() || 'N/A',
      type: 'text',
      editable: false
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      value: formatDate(document.createdAt),
      type: 'date',
      editable: false
    },
    {
      key: 'updatedAt',
      label: 'Modifié le',
      value: formatDate(document.updatedAt),
      type: 'date',
      editable: false
    },
    {
      key: 'author',
      label: 'Auteur',
      value: document.author?.name || 'Inconnu',
      type: 'text',
      editable: true
    },
    {
      key: 'description',
      label: 'Description',
      value: document.description || '',
      type: 'textarea',
      editable: true
    },
    {
      key: 'tags',
      label: 'Tags',
      value: document.tags || [],
      type: 'tags',
      editable: true
    },
    {
      key: 'isPublic',
      label: 'Visibilité',
      value: document.isPublic ? 'Public' : 'Privé',
      type: 'select',
      editable: true,
      options: ['Public', 'Privé']
    }
  ]

  // Gestion de l'édition
  const startEditing = () => {
    setIsEditing(true)
    setEditedFields({})
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditedFields({})
  }

  const saveEditing = () => {
    if (onUpdate) {
      onUpdate(editedFields)
    }
    setIsEditing(false)
    setEditedFields({})
  }

  const updateField = (key: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [key]: value }))
  }

  // Copie d'un champ
  const copyField = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(value)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Erreur lors de la copie:', error)
    }
  }

  // Rendu d'un champ
  const renderField = (field: MetadataField) => {
    const isEdited = editedFields.hasOwnProperty(field.key)
    const currentValue = isEdited ? editedFields[field.key] : field.value

    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-title-medium text-muted-foreground">
            {field.label}
          </Label>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyField(String(currentValue))}
              className="h-6 w-6 p-0"
            >
              {copiedField === String(currentValue) ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>

        {isEditing && field.editable ? (
          <div className="space-y-2 px-1">
            {field.type === 'textarea' ? (
              <Textarea
                value={currentValue}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="min-h-[80px]"
                placeholder={`Saisir ${field.label.toLowerCase()}...`}
              />
            ) : field.type === 'select' ? (
              <select
                value={currentValue}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {field.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.type === 'tags' ? (
              <div className="space-y-2">
                <Input
                  value={Array.isArray(currentValue) ? currentValue.join(', ') : currentValue}
                  onChange={(e) => updateField(field.key, e.target.value.split(',').map(tag => tag.trim()))}
                  placeholder="Saisir les tags séparés par des virgules..."
                />
                {Array.isArray(currentValue) && currentValue.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentValue.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Input
                value={currentValue}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={`Saisir ${field.label.toLowerCase()}...`}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            {field.type === 'tags' && Array.isArray(currentValue) ? (
              <div className="flex flex-wrap gap-1">
                {currentValue.length > 0 ? (
                  currentValue.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Aucun tag</span>
                )}
              </div>
            ) : (
              <span className="text-sm">{currentValue || 'Non défini'}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  if (!isVisible) return null

  return (
    <div className={cn("absolute right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-20", className)}>
      <div className="h-full flex flex-col">
        {/* En-tête */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getFileTypeIcon(document.fileType)}</span>
              <h3 className="font-title-semibold">Métadonnées</h3>
            </div>
            <div className="flex items-center space-x-1">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={saveEditing}>
                    <Save className="h-4 w-4 mr-1" />
                    Sauver
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={startEditing}>
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onToggle}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={onDownload} className="flex-1">
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </Button>
            <Button size="sm" variant="outline" onClick={onShare} className="flex-1">
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Informations de base */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Informations de base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metadataFields.slice(0, 6).map(renderField)}
            </CardContent>
          </Card>

          {/* Informations de sécurité */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                {document.isPublic ? (
                  <Globe className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Lock className="h-4 w-4 mr-2 text-orange-500" />
                )}
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metadataFields.slice(6, 8).map(renderField)}
            </CardContent>
          </Card>

          {/* Métadonnées étendues */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Métadonnées étendues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metadataFields.slice(8).map(renderField)}
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vues</span>
                <span>{document.viewCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Téléchargements</span>
                <span>{document.downloadCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Partages</span>
                <span>{document.shareCount || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
