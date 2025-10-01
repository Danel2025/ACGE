'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingState } from '@/components/ui/loading-states'
import { AlertTriangle, Save, X, FileText, User, Building, Tag } from 'lucide-react'

interface PosteComptable {
  id: string
  numero: string
  intitule: string
}

interface NatureDocument {
  id: string
  numero: string
  nom: string
}

interface DossierComptable {
  id: string
  nomDossier?: string
  numeroDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire?: string
  statut: string
  dateDepot?: string
  posteComptableId?: string
  natureDocumentId?: string
  poste_comptable?: PosteComptable
  nature_document?: NatureDocument
  secretaire?: {
    id: string
    name: string
    email: string
  }
  _count?: { documents: number }
  createdAt: string
  updatedAt: string
}

interface DossierEditFormProps {
  dossier: DossierComptable | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedDossier: DossierComptable) => void
}

interface FormData {
  nomDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire: string
  posteComptableId: string
  natureDocumentId: string
}

export function DossierEditForm({ dossier, isOpen, onClose, onSave }: DossierEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [postesComptables, setPostesComptables] = useState<PosteComptable[]>([])
  const [naturesDocuments, setNaturesDocuments] = useState<NatureDocument[]>([])
  const [isLoadingReferences, setIsLoadingReferences] = useState(false)

  const form = useForm<FormData>({
    defaultValues: {
      nomDossier: '',
      numeroNature: '',
      objetOperation: '',
      beneficiaire: '',
      posteComptableId: '',
      natureDocumentId: ''
    }
  })

  const { handleSubmit, reset, watch, formState: { errors, isDirty } } = form
  const watchedValues = watch()

  // Charger les données de référence
  useEffect(() => {
    if (isOpen) {
      fetchReferences()
    }
  }, [isOpen])

  // Réinitialiser le formulaire quand le dossier change
  useEffect(() => {
    if (dossier && isOpen) {
      reset({
        nomDossier: dossier.nomDossier || '',
        numeroNature: dossier.numeroNature || '',
        objetOperation: dossier.objetOperation || '',
        beneficiaire: dossier.beneficiaire || '',
        posteComptableId: dossier.posteComptableId || '',
        natureDocumentId: dossier.natureDocumentId || ''
      })
    }
  }, [dossier, isOpen, reset])

  const fetchReferences = async () => {
    setIsLoadingReferences(true)
    try {
      // Charger les postes comptables
      const postesResponse = await fetch('/api/postes-comptables', {
        credentials: 'include'
      })

      if (postesResponse.ok) {
        const postesData = await postesResponse.json()
        setPostesComptables(postesData.postesComptables || [])
      }

      // Charger les natures de documents
      const naturesResponse = await fetch('/api/natures-documents', {
        credentials: 'include'
      })

      if (naturesResponse.ok) {
        const naturesData = await naturesResponse.json()
        setNaturesDocuments(naturesData.naturesDocuments || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des références:', error)
      setError('Erreur lors du chargement des données de référence')
    } finally {
      setIsLoadingReferences(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!dossier) return

    setIsLoading(true)
    setError('')

    console.log('📝 Tentative de mise à jour du dossier:', dossier.id)
    console.log('📝 Données envoyées:', {
      numeroNature: data.numeroNature,
      objetOperation: data.objetOperation,
      beneficiaire: data.beneficiaire,
      posteComptableId: data.posteComptableId,
      natureDocumentId: data.natureDocumentId
    })

    try {
      const response = await fetch(`/api/dossiers/${dossier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          foldername: data.nomDossier,
          numeroNature: data.numeroNature,
          objetOperation: data.objetOperation,
          beneficiaire: data.beneficiaire,
          posteComptableId: data.posteComptableId || null,
          natureDocumentId: data.natureDocumentId || null
        }),
      })

      console.log('📝 Réponse HTTP:', response.status, response.statusText)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Mise à jour réussie:', result)
        onSave(result.dossier)
        onClose()
      } else {
        const errorData = await response.json()
        console.log('❌ Erreur de l\'API:', errorData)
        setError(errorData.error || 'Erreur lors de la mise à jour du dossier')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setError('Erreur de connexion lors de la mise à jour')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (isDirty) {
      if (confirm('Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?')) {
        onClose()
        reset()
        setError('')
      }
    } else {
      onClose()
      reset()
      setError('')
    }
  }

  if (!dossier) return null

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
      'VALIDÉ_ORDONNATEUR': { label: 'Validé Ordonnateur', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'PAYÉ': { label: 'Payé', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'TERMINÉ': { label: 'Terminé', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
    return statuts[statut as keyof typeof statuts] || { label: statut, className: 'bg-gray-100 text-gray-800 border-gray-200' }
  }

  const statutInfo = getStatutInfo(dossier.statut)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Modifier le dossier
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations du dossier <span className="font-medium text-number">{dossier.numeroDossier}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations actuelles du dossier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informations actuelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Nom:</span>
                  <span className="font-medium">{dossier.nomDossier || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Numéro:</span>
                  <span className="font-medium">{dossier.numeroDossier}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Statut:</span>
                  <Badge className={statutInfo.className}>{statutInfo.label}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Créé le:</span>
                  <span className="font-medium">{formatDate(dossier.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulaire de modification */}
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="nomDossier"
                rules={{
                  required: 'Le nom du dossier est requis',
                  minLength: {
                    value: 3,
                    message: 'Le nom du dossier doit contenir au moins 3 caractères'
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Nom du dossier *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Dossier de dépenses Q1 2025"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroNature"
                rules={{
                  required: 'Le numéro nature est requis',
                  minLength: {
                    value: 1,
                    message: 'Le numéro nature est requis'
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Numéro nature *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 96595"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objetOperation"
                rules={{
                  required: 'L\'objet de l\'opération est requis',
                  minLength: {
                    value: 5,
                    message: 'L\'objet de l\'opération doit contenir au moins 5 caractères'
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objet de l'opération *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez l'objet de cette opération..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beneficiaire"
                rules={{
                  required: 'Le bénéficiaire est requis',
                  minLength: {
                    value: 2,
                    message: 'Le nom du bénéficiaire doit contenir au moins 2 caractères'
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Bénéficiaire *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nom du bénéficiaire"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="posteComptableId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Poste comptable
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un poste comptable" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingReferences ? (
                            <SelectItem value="loading" disabled>
                              <div className="mr-2 h-4 w-4">
                                <LoadingState isLoading={true} size="sm" showText={false} noPadding={true} />
                              </div>
                              Chargement...
                            </SelectItem>
                          ) : (
                            <>
                              {postesComptables.map((poste) => (
                                <SelectItem key={poste.id} value={poste.id}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-number">{poste.numero}</span>
                                    <span className="text-muted-foreground">-</span>
                                    <span>{poste.intitule}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="natureDocumentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Nature du document
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une nature de document" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingReferences ? (
                            <SelectItem value="loading" disabled>
                              <div className="mr-2 h-4 w-4">
                                <LoadingState isLoading={true} size="sm" showText={false} noPadding={true} />
                              </div>
                              Chargement...
                            </SelectItem>
                          ) : (
                            <>
                              {naturesDocuments.map((nature) => (
                                <SelectItem key={nature.id} value={nature.id}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-number">{nature.numero}</span>
                                    <span className="text-muted-foreground">-</span>
                                    <span>{nature.nom}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading || isLoadingReferences || !isDirty}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4">
                  <LoadingState isLoading={true} size="sm" showText={false} />
                </div>
                Modification...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Modifier le dossier
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
