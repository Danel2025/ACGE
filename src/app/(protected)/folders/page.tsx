'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompactPageLayout, PageHeader, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import CompactStats from '@/components/shared/compact-stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFolders, type DossierData } from '@/hooks/use-folders'
import { FileText, Plus, MoreHorizontal, Edit, Trash2, Eye, Send, Clock, FolderOpen, Calculator, FileCheck, CheckCircle, Loader2 } from 'lucide-react'
import { DossierEditModal } from '@/components/ui/dossier-edit-modal'

const getStatutBadge = (statut: string) => {
  const statusMap = {
    'BROUILLON': { variant: 'secondary' as const, label: 'Brouillon' },
    'EN_ATTENTE': { variant: 'default' as const, label: 'En attente' },
    'VALIDÉ_CB': { variant: 'default' as const, label: 'Validé CB' },
    'REJETÉ_CB': { variant: 'destructive' as const, label: 'Rejeté CB' },
    'VALIDÉ_ORDONNATEUR': { variant: 'default' as const, label: 'Validé Ordonnateur' },
    'PAYÉ': { variant: 'default' as const, label: 'Payé' },
    'TERMINÉ': { variant: 'default' as const, label: 'Terminé' }
  }

  const status = statusMap[statut as keyof typeof statusMap] || { variant: 'secondary' as const, label: statut }
  return <Badge variant={status.variant}>{status.label}</Badge>
}

export default function DossiersPage() {
  const router = useRouter()
  const { folders: dossiers, stats, isLoading, error, refresh } = useFolders()

  // États pour la création de dossiers
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [createForm, setCreateForm] = useState({
    // Étape 1: Informations de base
    nomDossier: '',
    description: '',
    // Étape 2: Informations comptables
    posteComptableId: '',
    natureDocumentId: '',
    // Étape 3: Détails de l'opération
    numeroNature: '',
    beneficiaire: '',
    objetOperation: '',
    montant: ''
  })

  // États pour les données de référence
  const [postesComptables, setPostesComptables] = useState<any[]>([])
  const [naturesDocuments, setNaturesDocuments] = useState<any[]>([])
  const [loadingReferenceData, setLoadingReferenceData] = useState(false)

  // États pour la recherche et filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Calculer les statistiques par statut
  const getStatusStats = () => {
    const stats = {
      all: dossiers.length,
      'EN_ATTENTE': dossiers.filter(d => d.statut === 'EN_ATTENTE').length,
      'VALIDÉ_CB': dossiers.filter(d => d.statut === 'VALIDÉ_CB').length,
      'REJETÉ_CB': dossiers.filter(d => d.statut === 'REJETÉ_CB').length,
      'BROUILLON': dossiers.filter(d => d.statut === 'BROUILLON').length,
      'VALIDÉ_ORDONNATEUR': dossiers.filter(d => d.statut === 'VALIDÉ_ORDONNATEUR').length,
      'PAYÉ': dossiers.filter(d => d.statut === 'PAYÉ').length,
      'TERMINÉ': dossiers.filter(d => d.statut === 'TERMINÉ').length
    }
    return stats
  }

  const statusStats = getStatusStats()

  // États pour les actions des dossiers
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDossier, setEditingDossier] = useState<DossierData | null>(null)
  const [editForm, setEditForm] = useState({
    nomDossier: '',
    numeroDossier: '',
    description: '',
    numeroNature: '',
    beneficiaire: '',
    objetOperation: '',
    posteComptableId: '',
    natureDocumentId: ''
  })
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)

  // Charger les données de référence
  useEffect(() => {
    const loadReferenceData = async () => {
      setLoadingReferenceData(true)
      try {
        // Charger les postes comptables
        const postesResponse = await fetch('/api/postes-comptables')
        if (postesResponse.ok) {
          const postesData = await postesResponse.json()
          setPostesComptables(postesData.postesComptables || [])
        }

        // Charger les natures de documents
        const naturesResponse = await fetch('/api/natures-documents')
        if (naturesResponse.ok) {
          const naturesData = await naturesResponse.json()
          setNaturesDocuments(naturesData.naturesDocuments || [])
      }
    } catch (error) {
        console.error('Erreur lors du chargement des données de référence:', error)
    } finally {
        setLoadingReferenceData(false)
      }
    }

    if (createModalOpen) {
      loadReferenceData()
    }
  }, [createModalOpen])

  // Navigation dans les étapes
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Validation des étapes
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return createForm.nomDossier.trim() !== ''
      case 2:
        // Les champs comptables sont optionnels
        return true
      case 3:
        return createForm.objetOperation.trim() !== ''
      case 4:
        return true
      default:
        return false
    }
  }

  // Fonction pour créer un nouveau dossier
  const handleCreateDossier = async () => {
    if (!isStepValid(3)) {
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomDossier: createForm.nomDossier,
          description: createForm.description,
          numeroNature: createForm.numeroNature,
          objetOperation: createForm.objetOperation,
          beneficiaire: createForm.beneficiaire,
          montant: createForm.montant ? parseFloat(createForm.montant) : null,
          posteComptableId: createForm.posteComptableId || null,
          natureDocumentId: createForm.natureDocumentId || null
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Dossier créé:', result.dossier?.numeroDossier)
        handleCloseModal()
        refresh()
      } else {
        const errorData = await response.json()
        console.error('Erreur création dossier:', errorData)
        alert('Erreur lors de la création du dossier: ' + (errorData.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setCreating(false)
    }
  }

  // Fermer le modal et réinitialiser
  const handleCloseModal = () => {
    setCreateModalOpen(false)
    setCurrentStep(1)
    setCreateForm({
      nomDossier: '',
      description: '',
      posteComptableId: '',
      natureDocumentId: '',
      numeroNature: '',
      beneficiaire: '',
      objetOperation: '',
      montant: ''
    })
  }

  // Ouvrir le modal d'édition
  const handleOpenEditModal = (dossier: DossierData) => {
    setEditingDossier(dossier)
    setEditForm({
      nomDossier: dossier.nomDossier || dossier.numeroDossier,
      numeroDossier: dossier.numeroDossier,
      description: '',
      numeroNature: dossier.numeroNature,
      beneficiaire: dossier.beneficiaire || '',
      objetOperation: dossier.objetOperation,
      posteComptableId: dossier.posteComptableId || '',
      natureDocumentId: dossier.natureDocumentId || ''
    })
    setEditModalOpen(true)
  }

  // Fermer le modal d'édition
  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setEditingDossier(null)
    setEditForm({
      nomDossier: '',
      numeroDossier: '',
      description: '',
      numeroNature: '',
      beneficiaire: '',
      objetOperation: '',
      posteComptableId: '',
      natureDocumentId: ''
    })
  }

  // Modifier un dossier (ancienne version)
  const handleUpdateDossier = async () => {
    if (!editingDossier) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/dossiers/${editingDossier.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomDossier: editForm.nomDossier,
          numeroNature: editForm.numeroNature,
          objetOperation: editForm.objetOperation,
          beneficiaire: editForm.beneficiaire,
          posteComptableId: editForm.posteComptableId || null,
          natureDocumentId: editForm.natureDocumentId || null
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Dossier modifié:', result)
        handleCloseEditModal()
        refresh()
      } else {
        const errorData = await response.json()
        console.error('Erreur modification dossier:', errorData)
        alert('Erreur lors de la modification du dossier: ' + (errorData.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la modification du dossier')
    } finally {
      setUpdating(false)
    }
  }

  // Nouvelle fonction pour gérer la sauvegarde depuis le nouveau composant
  const handleUpdateDossierSave = async (updatedDossier: any) => {
    if (!updatedDossier) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/dossiers/${updatedDossier.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nomDossier: updatedDossier.nomDossier,
          numeroDossier: updatedDossier.numeroDossier,
          numeroNature: updatedDossier.numeroNature,
          objetOperation: updatedDossier.objetOperation,
          beneficiaire: updatedDossier.beneficiaire,
          posteComptableId: updatedDossier.posteComptableId || null,
          natureDocumentId: updatedDossier.natureDocumentId || null
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Dossier modifié:', result)
        refresh()
      } else {
        const errorData = await response.json()
        console.error('Erreur modification dossier:', errorData)
        alert('Erreur lors de la modification du dossier: ' + (errorData.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la modification du dossier')
    } finally {
      setUpdating(false)
    }
  }

  // Supprimer un dossier
  const handleDeleteDossier = async (dossier: DossierData) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le dossier ${dossier.numeroDossier} ?`)) {
      return
    }

    setDeleting(dossier.id)
    try {
      const response = await fetch(`/api/dossiers/${dossier.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Dossier supprimé:', result)
        refresh()
      } else {
        const errorData = await response.json()
        console.error('Erreur suppression dossier:', errorData)
        alert('Erreur lors de la suppression du dossier: ' + (errorData.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression du dossier')
    } finally {
      setDeleting(null)
    }
  }

  // Soumettre un dossier au CB
  const handleSubmitDossier = async (dossier: DossierData) => {
    if (!confirm(`Êtes-vous sûr de vouloir soumettre le dossier ${dossier.numeroDossier} au Contrôleur Budgétaire ?`)) {
      return
    }

    setSubmitting(dossier.id)
    try {
      const response = await fetch(`/api/dossiers/${dossier.id}/submit`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Dossier soumis:', result)
        refresh()
      } else {
        const errorData = await response.json()
        console.error('Erreur soumission dossier:', errorData)
        alert('Erreur lors de la soumission du dossier: ' + (errorData.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la soumission du dossier')
    } finally {
      setSubmitting(null)
    }
  }

  // Filtrer les dossiers
  const filteredDossiers = dossiers.filter((dossier) => {
    const matchesSearch =
      dossier.numeroDossier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dossier.objetOperation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dossier.beneficiaire && dossier.beneficiaire.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || dossier.statut === statusFilter

    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <CompactPageLayout>
        <PageHeader title="Dossiers" />
        <ContentSection>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
        </ContentSection>
      </CompactPageLayout>
    )
  }

  if (error) {
    return (
      <CompactPageLayout>
        <PageHeader title="Dossiers" />
        <ContentSection>
          <div className="text-center py-8">
            <p className="text-red-600">Erreur: {error}</p>
            <Button onClick={refresh} className="mt-4">
              Réessayer
                            </Button>
          </div>
          </ContentSection>
      </CompactPageLayout>
    )
  }

  return (
    <CompactPageLayout>
      <PageHeader
        title="Gestion des Dossiers"
        subtitle={`${filteredDossiers.length} dossier(s) trouvé(s)`}
        actions={
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Dossier
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
              <DialogHeader className="pb-2">
                <DialogTitle className="text-xl font-title-semibold text-foreground">Création du dossier comptable</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                    Remplissez les informations requises pour créer un nouveau dossier comptable.
                  </DialogDescription>
                </DialogHeader>

              {/* Progress Steps */}
              <div className="flex items-center justify-between px-6 py-6 border-b">
                {[
                  { step: 1, icon: FolderOpen, label: 'Informations de base', sublabel: 'Nom et description du dossier' },
                  { step: 2, icon: Calculator, label: 'Informations comptables', sublabel: 'Poste comptable et nature du document' },
                  { step: 3, icon: FileCheck, label: 'Détails de l\'opération', sublabel: 'Objet et bénéficiaire' },
                  { step: 4, icon: CheckCircle, label: 'Validation', sublabel: 'Vérification des informations' }
                ].map(({ step, icon: Icon, label, sublabel }, index) => (
                  <div key={step} className="flex flex-col items-center space-y-3 relative">
                    <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                      currentStep === step
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110'
                        : currentStep > step
                        ? 'bg-green-600 border-green-600 text-white shadow-md'
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40'
                    }`}>
                      <Icon className="w-6 h-6" />
                      {currentStep > step && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-600 rounded-full">
                          <CheckCircle className="w-5 h-5 text-white" />
                </div>
                      )}
              </div>
                    <div className="text-center max-w-[140px]">
                      <div className={`text-sm font-medium transition-colors duration-200 ${
                        currentStep >= step ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {label}
            </div>
                      <div className="text-xs text-muted-foreground mt-1 leading-tight">
                        {sublabel}
          </div>
              </div>
                    {index < 3 && (
                      <div className={`absolute top-6 left-full w-16 h-0.5 transition-colors duration-200 ${
                        currentStep > step ? 'bg-green-600' : 'bg-muted-foreground/30'
                      }`} style={{ transform: 'translateX(50%)' }} />
                    )}
                          </div>
                ))}
                </div>

              {/* Step Content */}
              <div className="py-6">
                {/* Étape 1: Informations de base */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <FolderOpen className="w-8 h-8 text-primary" />
              </div>
                      <h3 className="text-lg font-title-semibold text-foreground">Informations de base</h3>
                      <p className="text-sm text-muted-foreground">Définissez le nom et la description de votre dossier</p>
                    </div>

               <div className="space-y-4">
                      <div>
                        <Label htmlFor="nomDossier" className="text-sm font-title-medium text-foreground">Nom du dossier *</Label>
                     <Input
                          id="nomDossier"
                          value={createForm.nomDossier}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, nomDossier: e.target.value }))}
                          placeholder="Ex: Dossier ENS 2025"
                          className="mt-1.5"
                     />
                   </div>

                      <div>
                        <Label htmlFor="description" className="text-sm font-title-medium text-foreground">Description</Label>
                        <Textarea
                          id="description"
                          value={createForm.description}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Description optionnelle du dossier"
                          rows={3}
                          className="mt-1.5 resize-none"
                     />
                   </div>
                 </div>
                 </div>
                )}

                {/* Étape 2: Informations comptables */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Calculator className="w-8 h-8 text-primary" />
                 </div>
                      <h3 className="text-lg font-title-semibold text-foreground">Informations comptables</h3>
                      <p className="text-sm text-muted-foreground">Renseignez les détails comptables du dossier</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="posteComptable" className="text-sm font-title-medium text-foreground">Poste comptable *</Label>
                     <Select
                          value={createForm.posteComptableId}
                          onValueChange={(value) => setCreateForm(prev => ({ ...prev, posteComptableId: value }))}
                     >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Sélectionner un poste comptable" />
                       </SelectTrigger>
                       <SelectContent>
                         {postesComptables.map((poste) => (
                           <SelectItem key={poste.id} value={poste.id}>
                             {poste.numero} - {poste.intitule}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>

                      <div>
                        <Label htmlFor="natureDocument" className="text-sm font-title-medium text-foreground">Nature du document *</Label>
                     <Select
                          value={createForm.natureDocumentId}
                          onValueChange={(value) => setCreateForm(prev => ({ ...prev, natureDocumentId: value }))}
                     >
                          <SelectTrigger className="mt-1.5">
                         <SelectValue placeholder="Sélectionner une nature" />
                       </SelectTrigger>
                       <SelectContent>
                         {naturesDocuments.map((nature) => (
                           <SelectItem key={nature.id} value={nature.id}>
                             {nature.numero} - {nature.nom}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
               </div>
                )}

                {/* Étape 3: Détails de l'opération */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <FileCheck className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-title-semibold text-foreground">Détails de l'opération</h3>
                      <p className="text-sm text-muted-foreground">Complétez les informations spécifiques à l'opération</p>
                    </div>

                 <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="numeroNature" className="text-sm font-title-medium text-foreground">Numéro nature</Label>
                          <Input
                            id="numeroNature"
                            value={createForm.numeroNature}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, numeroNature: e.target.value }))}
                            placeholder="Ex: 01"
                            className="mt-1.5"
                          />
                   </div>

                        <div>
                          <Label htmlFor="beneficiaire" className="text-sm font-title-medium text-foreground">Bénéficiaire *</Label>
                          <Input
                            id="beneficiaire"
                            value={createForm.beneficiaire}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, beneficiaire: e.target.value }))}
                            placeholder="Nom du bénéficiaire"
                            className="mt-1.5"
                          />
                               </div>
                             </div>

                      <div>
                        <Label htmlFor="objetOperation" className="text-sm font-title-medium text-foreground">Objet de l'opération *</Label>
                        <Textarea
                          id="objetOperation"
                          value={createForm.objetOperation}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, objetOperation: e.target.value }))}
                          placeholder="Description détaillée de l'opération"
                          rows={3}
                          className="mt-1.5 resize-none"
                        />
                           </div>
                    </div>
                       </div>
                     )}

                {/* Étape 4: Validation */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                   </div>
                      <h3 className="text-lg font-title-semibold text-foreground">Validation</h3>
                      <p className="text-sm text-muted-foreground">Vérifiez les informations avant de créer le dossier</p>
                                 </div>

                    <div className="bg-muted/30 rounded-lg p-6 space-y-4 border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-title-medium text-foreground mb-2">Informations de base</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Nom:</span> {createForm.nomDossier || 'Non renseigné'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Description:</span> {createForm.description || 'Aucune'}
                            </p>
                               </div>
                             </div>

                        <div>
                          <h4 className="font-title-medium text-foreground mb-2">Informations comptables</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Poste:</span> {postesComptables.find(p => p.id === createForm.posteComptableId)?.intitule || 'Non sélectionné'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Nature:</span> {naturesDocuments.find(n => n.id === createForm.natureDocumentId)?.nom || 'Non sélectionnée'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-title-medium text-foreground mb-2">Détails de l'opération</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Numéro nature:</span> {createForm.numeroNature || 'Non renseigné'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Bénéficiaire:</span> {createForm.beneficiaire || 'Non renseigné'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Objet:</span> {createForm.objetOperation || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                       </div>
                     </div>
                   )}
                 </div>

              <DialogFooter className="border-t pt-6 bg-muted/20">
                <div className="flex justify-between w-full items-center">
                  <div>
                    {currentStep > 1 && (
                      <Button variant="outline" onClick={prevStep} className="min-w-[100px]">
                        Précédent
                      </Button>
               )}
             </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCloseModal} className="min-w-[100px]">
                      Annuler
                    </Button>

                    {currentStep < 4 ? (
               <Button
                        onClick={nextStep}
                        disabled={!isStepValid(currentStep)}
                        className="min-w-[100px]"
                      >
                        Suivant
               </Button>
                    ) : (
               <Button
                        onClick={handleCreateDossier}
                        disabled={creating || !isStepValid(3)}
                        className="min-w-[140px]"
                      >
                        {creating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Création...
                          </>
                        ) : (
                          'Créer le dossier'
                        )}
               </Button>
                    )}
                  </div>
                </div>
             </DialogFooter>
           </DialogContent>
         </Dialog>
        }
      />

      {/* Modal d'édition */}
      <DossierEditModal
        dossier={editingDossier}
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSave={(updatedDossier) => {
          handleUpdateDossierSave(updatedDossier)
          setEditModalOpen(false)
        }}
      />

      {/* Stats */}
      {stats && (
        <CompactStats
          stats={[
            {
              label: "Total Dossiers",
              value: (stats.totalDossiers || 0).toString(),
              icon: <FileText />
            },
            {
              label: "Documents",
              value: (stats.totalDocuments || 0).toString(),
              icon: <FileText />
            }
          ]}
        />
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Rechercher par numéro, objet ou bénéficiaire..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />

        {/* Filtres de statut avec badges */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="h-9 px-3 text-sm"
          >
            Tous les dossiers
            <Badge
              variant={statusFilter === 'all' ? 'secondary' : 'outline'}
              className="ml-2 h-5 px-1.5 text-xs bg-background border"
            >
              {statusStats.all}
            </Badge>
          </Button>

          <Button
            variant={statusFilter === 'EN_ATTENTE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('EN_ATTENTE')}
            className="h-9 px-3 text-sm"
          >
            En attente
            <Badge
              variant={statusFilter === 'EN_ATTENTE' ? 'secondary' : 'outline'}
              className="ml-2 h-5 px-1.5 text-xs bg-background border"
            >
              {statusStats.EN_ATTENTE}
            </Badge>
          </Button>

          <Button
            variant={statusFilter === 'VALIDÉ_CB' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('VALIDÉ_CB')}
            className="h-9 px-3 text-sm"
          >
            Validés
            <Badge
              variant={statusFilter === 'VALIDÉ_CB' ? 'secondary' : 'outline'}
              className="ml-2 h-5 px-1.5 text-xs bg-background border"
            >
              {statusStats.VALIDÉ_CB}
            </Badge>
          </Button>

          <Button
            variant={statusFilter === 'REJETÉ_CB' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('REJETÉ_CB')}
            className="h-9 px-3 text-sm"
          >
            Rejetés
            <Badge
              variant={statusFilter === 'REJETÉ_CB' ? 'secondary' : 'outline'}
              className="ml-2 h-5 px-1.5 text-xs bg-background border"
            >
              {statusStats.REJETÉ_CB}
            </Badge>
          </Button>
        </div>
      </div>

      <ContentSection>
        {filteredDossiers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Nom du dossier</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Poste Comptable</TableHead>
                <TableHead>Date Dépôt</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Validations</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDossiers.map((dossier) => (
                <TableRow
                  key={dossier.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dossiers/${dossier.id}`)}
                >
                  <TableCell className="font-medium text-number">
                    {dossier.numeroDossier}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium text-blue-600">
                    {dossier.foldername || dossier.nomDossier || dossier.numeroDossier}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {dossier.objetOperation}
                  </TableCell>
                  <TableCell>
                    {dossier.beneficiaire || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-number">{dossier.poste_comptable?.numero || 'N/A'}</div>
                      <div className="text-muted-foreground truncate max-w-[150px]">{dossier.poste_comptable?.intitule || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-date">{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</span>
                  </TableCell>
                  <TableCell>
                    {getStatutBadge(dossier.statut)}
                  </TableCell>
                  <TableCell>
                    {dossier.statut === 'EN_ATTENTE' ? (
                      <span className="text-yellow-600 text-sm">En cours de validation</span>
                    ) : dossier.statut === 'VALIDÉ_CB' ? (
                      <span className="text-green-600 text-sm">Validé par CB</span>
                    ) : dossier.statut === 'REJETÉ_CB' ? (
                      <span className="text-red-600 text-sm">Rejeté par CB</span>
                    ) : dossier.statut === 'VALIDÉ_ORDONNATEUR' ? (
                      <span className="text-blue-600 text-sm">Validé par Ordonnateur</span>
                    ) : dossier.statut === 'PAYÉ' ? (
                      <span className="text-purple-600 text-sm">Payé</span>
                    ) : dossier.statut === 'TERMINÉ' ? (
                      <span className="text-gray-600 text-sm">Terminé</span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dossiers/${dossier.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Action de modification - disponible selon le statut */}
                        <DropdownMenuItem
                          onClick={() => handleOpenEditModal(dossier)}
                          disabled={!['EN_ATTENTE', 'REJETÉ_CB'].includes(dossier.statut)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>

                        {/* Action de soumission - disponible selon le statut */}
                        <DropdownMenuItem
                          onClick={() => handleSubmitDossier(dossier)}
                          disabled={!['BROUILLON', 'REJETÉ_CB'].includes(dossier.statut) || submitting === dossier.id}
                        >
                          {submitting === dossier.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-4 w-4" />
                          )}
                          {dossier.statut === 'REJETÉ_CB' ? 'Resoumettre au CB' : 'Soumettre au CB'}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Action de suppression - disponible selon le statut */}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteDossier(dossier)}
                          disabled={!['BROUILLON', 'REJETÉ_CB'].includes(dossier.statut) || deleting === dossier.id}
                        >
                          {deleting === dossier.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Aucun dossier trouvé"
            description={
              searchQuery || statusFilter !== 'all'
                ? "Aucun dossier ne correspond aux critères de recherche"
                : "Créez votre premier dossier pour commencer"
            }
            action={
              !searchQuery && statusFilter === 'all' ? {
                label: "Créer un dossier",
                onClick: () => setCreateModalOpen(true)
              } : undefined
            }
          />
        )}
      </ContentSection>
      </CompactPageLayout>
    )
}