'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { CheckCircle, Circle, ArrowRight, ArrowLeft, FileText, Folder, Eye, EyeOff, Calendar, User, HardDrive } from 'lucide-react'
import { DocumentItem } from '@/types/document'

interface FolderItem {
  id: string
  name: string
  description?: string
  parentId?: string | null
}

interface DocumentEditFormProps {
  document: DocumentItem
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
  categories?: Array<{ value: string; label: string }>
  categoriesLoading?: boolean
}

interface FormData {
  title: string
  description: string
  category: string
  isPublic: boolean
  folderId: string
}

const steps = [
  { id: 1, title: 'Informations du document', description: 'Titre et description' },
  { id: 2, title: 'Classification', description: 'Catégorie et dossier' },
  { id: 3, title: 'Validation', description: 'Vérification des modifications' }
]

// Catégories par défaut (fallback)
const defaultCategories = [
  { value: 'Non classé', label: 'Non classé' }
]

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function DocumentEditForm({ 
  document, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  categories = defaultCategories,
  categoriesLoading = false
}: DocumentEditFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [foldersLoading, setFoldersLoading] = useState(false)

  const form = useForm<FormData>({
    defaultValues: {
      title: document.title || '',
      description: document.description || '',
      category: document.category || '',
      isPublic: document.isPublic || false,
      folderId: document.folderId || 'root'
    }
  })

  const { watch, trigger, formState: { errors } } = form
  const watchedValues = watch()

  // Charger les dossiers disponibles
  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    setFoldersLoading(true)
    try {
      const response = await fetch('/api/folders', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const foldersArray = Array.isArray(data) ? data : (data.folders || [])
        setFolders(foldersArray)
      } else {
        console.error('❌ Erreur API sidebar/folders:', response.status)
        setFolders([])
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des dossiers:', error)
      setFolders([])
    } finally {
      setFoldersLoading(false)
    }
  }

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof FormData)[] = []

    switch (step) {
      case 1:
        fieldsToValidate = ['title']
        break
      case 2:
        fieldsToValidate = ['category', 'folderId']
        break
    }

    const isValid = await trigger(fieldsToValidate)
    return isValid
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1)
      } else {
        // À la dernière étape, soumettre le formulaire
        handleSubmit()
      }
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      onSubmit(watchedValues)
    }
  }

  const getCategoryLabel = (value: string) => {
    const category = categories.find(cat => cat.value === value)
    return category ? category.label : value
  }

  const getFolderName = (folderId: string) => {
    if (folderId === 'root') return 'Racine'
    const folder = folders.find(f => f.id === folderId)
    return folder ? folder.name : 'Dossier inconnu'
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 px-2">
            <FormField
              control={form.control}
              name="title"
              rules={{
                required: 'Le titre est requis',
                minLength: {
                  value: 2,
                  message: 'Le titre doit contenir au moins 2 caractères'
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Titre du document *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ex: Facture fournisseur 2025"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description optionnelle du document"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-6 px-2">
            <FormField
              control={form.control}
              name="category"
              rules={{
                required: 'La catégorie est requise'
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Catégorie *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoriesLoading ? (
                        <SelectItem value="loading" disabled>
                          Chargement des catégories...
                        </SelectItem>
                      ) : categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-categories" disabled>
                          Aucune catégorie disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="folderId"
              rules={{
                required: 'Le dossier est requis'
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Dossier *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un dossier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="root">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          Racine
                        </div>
                      </SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            {folder.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Document public
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Les autres utilisateurs pourront voir ce document
                    </div>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-title-semibold mb-2">Récapitulatif</h3>
              <p className="text-muted-foreground">
                Vérifiez les modifications avant de sauvegarder
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-title-medium mb-2">Informations du document</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Titre:</span> {watchedValues.title}</p>
                    <p><span className="text-muted-foreground">Description:</span> {watchedValues.description || 'Aucune'}</p>
                    <p><span className="text-muted-foreground">Catégorie:</span> {getCategoryLabel(watchedValues.category)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-title-medium mb-2">Classification</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Dossier:</span> {getFolderName(watchedValues.folderId)}</p>
                    <p><span className="text-muted-foreground">Visibilité:</span> 
                      {watchedValues.isPublic ? 'Public' : 'Privé'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informations du fichier original */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-title-medium mb-2">Fichier original</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Nom:</span> {document.fileName}</p>
                  <p><span className="text-muted-foreground">Taille:</span> {formatFileSize(document.fileSize)}</p>
                  <p><span className="text-muted-foreground">Type:</span> {document.fileType}</p>
                  <p><span className="text-muted-foreground">Créé le:</span> {formatDate(document.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-border mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            disabled={isLoading}
          >
            {currentStep === 1 ? (
              'Annuler'
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Précédent
              </>
            )}
          </Button>

          <div className="flex gap-2">
            {currentStep < steps.length ? (
              <Button onClick={handleNext} disabled={isLoading || foldersLoading}>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Form>
  )
}
