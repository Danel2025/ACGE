'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { createNotification } from '@/lib/notifications'
import { ErrorDisplay, useErrorHandler } from '@/components/ui/error-display'
import { 
  LoadingState, 
  TableLoadingSkeleton, 
  ActionLoadingState, 
  ContextualLoading,
  ButtonLoading,
  useLoadingStates 
} from '@/components/ui/loading-states'
import { DossierContentModal } from '@/components/ui/dossier-content-modal'
import { VerificationsOrdonnateurForm } from '@/components/ordonnateur/verifications-ordonnateur-form'
import { OrdonnateurStatusNavigation } from '@/components/ordonnateur/ordonnateur-status-navigation'
import { CompactPageLayout, PageHeader, CompactStats, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import { OrdonnateurGuard } from '@/components/auth/role-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  MoreHorizontal, 
  Eye, 
  ArrowLeft, 
  Download, 
  Share2,
  Filter,
  Search,
  RefreshCw,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  List,
  Grid3X3,
  ClipboardCheck,
  Settings
} from 'lucide-react'

interface DossierComptable {
  id: string
  numeroDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire: string
  statut: 'EN_ATTENTE' | 'VALIDÉ_CB' | 'REJETÉ_CB' | 'VALIDÉ_ORDONNATEUR' | 'PAYÉ' | 'TERMINÉ'
  dateDepot: string
  poste_comptable: {
    id: string
    numero: string
    intitule: string
  }
  nature_document: {
    id: string
    numero: string
    nom: string
  }
  secretaire: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  // Colonnes de rejet
  rejectedAt?: string
  rejectionReason?: string
  rejectionDetails?: string
}

function OrdonnateurDashboardContent() {
  const { user } = useSupabaseAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { error, handleError, retry, clearError, hasError } = useErrorHandler()
  const { setLoading, isLoading, getProgress } = useLoadingStates()
  
  // États pour la gestion des dossiers
  const [dossiers, setDossiers] = React.useState<DossierComptable[]>([])
  const [isLoadingDossiers, setIsLoadingDossiers] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [sortField, setSortField] = React.useState<'numeroDossier' | 'dateDepot' | 'statut' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'en_attente' | 'verifications_en_cours' | 'ordonnes' | 'rejetes'>('all')
  
  // États pour les actions d'ordonnancement
  const [selectedDossier, setSelectedDossier] = React.useState<DossierComptable | null>(null)
  const [ordonnancementOpen, setOrdonnancementOpen] = React.useState(false)
  const [ordonnancementComment, setOrdonnancementComment] = React.useState('')
  const [actionLoading, setActionLoading] = React.useState(false)
  const [actionResult, setActionResult] = React.useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  // États pour la modal de contenu du dossier
  const [dossierContentOpen, setDossierContentOpen] = React.useState(false)
  
  // États pour les vérifications ordonnateur
  const [verificationsOpen, setVerificationsOpen] = React.useState(false)
  const [verificationsMode, setVerificationsMode] = React.useState<'validation' | 'consultation'>('validation')
  const [verificationsStatus, setVerificationsStatus] = React.useState<Record<string, { completed: boolean, status: 'VALIDÉ' | 'EN_COURS' | 'REJETÉ' | null }>>({})
  const [verificationsSummary, setVerificationsSummary] = React.useState<any>(null)
  
  

  // Vérifier si l'utilisateur est Ordonnateur
  React.useEffect(() => {
    if (user?.role !== 'ORDONNATEUR') {
      router.push('/dashboard')
    }
  }, [user, router])

  // Charger le statut des vérifications pour un dossier
  const loadVerificationsStatus = React.useCallback(async (dossierId: string) => {
    try {
      const response = await fetch(`/api/dossiers/${dossierId}/verifications-ordonnateur`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const status = data.synthese?.statut || null
        const completed = status !== null
        
        setVerificationsStatus(prev => ({
          ...prev,
          [dossierId]: {
            completed,
            status: status as 'VALIDÉ' | 'EN_COURS' | 'REJETÉ' | null
          }
        }))
      }
    } catch (error) {
      console.error('Erreur lors du chargement du statut des vérifications:', error)
    }
  }, [])

  const loadVerificationsSummary = React.useCallback(async (dossierId: string) => {
    try {
      const response = await fetch(`/api/dossiers/${dossierId}/verifications-ordonnateur`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setVerificationsSummary(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du résumé des vérifications:', error)
    }
  }, [])

  // Charger les dossiers validés par CB
  const loadDossiers = React.useCallback(async () => {
    try {
      setIsLoadingDossiers(true)
      setLoading('dossiers', true)
      clearError()
      
      const response = await fetch('/api/dossiers/ordonnateur-all', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDossiers(data.dossiers || [])
        
        // Charger le statut des vérifications pour chaque dossier
        if (data.dossiers) {
          for (const dossier of data.dossiers) {
            await loadVerificationsStatus(dossier.id)
          }
        }
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Erreur lors du chargement des dossiers'
        
        // Déterminer le type d'erreur
        let errorType: 'network' | 'server' | 'validation' | 'permission' | 'notFound' | 'generic' = 'generic'
        if (response.status === 401 || response.status === 403) {
          errorType = 'permission'
        } else if (response.status === 404) {
          errorType = 'notFound'
        } else if (response.status >= 500) {
          errorType = 'server'
        } else if (response.status >= 400) {
          errorType = 'validation'
        }
        
        handleError(errorMessage, errorType, 'Chargement des dossiers')
      }
    } catch (error) {
      console.error('Erreur chargement dossiers:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion'
      handleError(errorMessage, 'network', 'Chargement des dossiers')
    } finally {
      setIsLoadingDossiers(false)
      setLoading('dossiers', false)
    }
  }, [clearError, handleError, setLoading, loadVerificationsStatus])

  // Charger les dossiers au montage
  React.useEffect(() => {
    loadDossiers()
  }, [loadDossiers])

  // Créer une notification pour les nouveaux dossiers
  React.useEffect(() => {
    if (dossiers.length > 0 && !isLoadingDossiers) {
      const nouveauxDossiers = dossiers.filter(d => d.statut === 'VALIDÉ_CB')
      if (nouveauxDossiers.length > 0) {
        createNotification({
          userId: user?.id || '',
          title: 'Nouveaux dossiers à ordonner',
          message: `${nouveauxDossiers.length} nouveau${nouveauxDossiers.length > 1 ? 'x' : ''} dossier${nouveauxDossiers.length > 1 ? 's' : ''} validé${nouveauxDossiers.length > 1 ? 's' : ''} par le CB en attente d'ordonnancement.`,
          type: 'INFO',
          priority: 'MEDIUM',
          actionUrl: '/ordonnateur-dashboard',
          actionLabel: 'Voir les dossiers',
          metadata: {
            dossiersCount: nouveauxDossiers.length,
            dossiersIds: nouveauxDossiers.map(d => d.id),
            loadedAt: new Date().toISOString()
          }
        })
      }
    }
  }, [dossiers, isLoadingDossiers, user?.id])

  // Filtrage et tri des dossiers
  const filteredDossiers = React.useMemo(() => {
    let items = dossiers

    // Filtrage par statut
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'en_attente':
          items = items.filter(d => d.statut === 'VALIDÉ_CB')
          break
        case 'verifications_en_cours':
          // Pour l'instant, on considère que tous les dossiers VALIDÉ_CB sont en cours de vérifications
          // Plus tard, on pourra ajouter un statut spécifique pour les vérifications en cours
          items = items.filter(d => d.statut === 'VALIDÉ_CB')
          break
        case 'ordonnes':
          items = items.filter(d => ['VALIDÉ_ORDONNATEUR', 'PAYÉ', 'TERMINÉ'].includes(d.statut))
          break
        case 'rejetes':
          items = items.filter(d => d.statut === 'REJETÉ_CB')
          break
      }
    }

    // Filtrage par recherche textuelle
    if (query) {
      items = items.filter(d => 
        d.numeroDossier.toLowerCase().includes(query.toLowerCase()) ||
        d.objetOperation.toLowerCase().includes(query.toLowerCase()) ||
        d.beneficiaire.toLowerCase().includes(query.toLowerCase())
      )
    }

    // Tri
    items.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'numeroDossier':
          aValue = a.numeroDossier.toLowerCase()
          bValue = b.numeroDossier.toLowerCase()
          break
        case 'dateDepot':
          aValue = new Date(a.dateDepot).getTime()
          bValue = new Date(b.dateDepot).getTime()
          break
        case 'statut':
          aValue = a.statut
          bValue = b.statut
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    return items
  }, [dossiers, query, sortField, sortOrder, statusFilter])

  // Actions pour les vérifications ordonnateur
  const handleVerifications = (dossier: DossierComptable, mode: 'validation' | 'consultation' = 'validation') => {
    setSelectedDossier(dossier)
    setVerificationsMode(mode)
    setVerificationsOpen(true)
  }

  const handleVerificationsComplete = async (success: boolean) => {
    if (success) {
      // Recharger le statut des vérifications pour le dossier sélectionné
      if (selectedDossier) {
        await loadVerificationsStatus(selectedDossier.id)
      }
      await loadDossiers() // Recharger la liste
      setVerificationsOpen(false)
      setSelectedDossier(null)
      
      // Créer une notification de succès
      if (user?.id && selectedDossier) {
        await createNotification({
          userId: user.id,
          title: 'Vérifications ordonnateur terminées',
          message: `Les vérifications ordonnateur pour le dossier ${selectedDossier.numeroDossier} ont été enregistrées avec succès.`,
          type: 'SUCCESS',
          priority: 'MEDIUM',
          actionUrl: '/ordonnateur-dashboard',
          actionLabel: 'Voir le dashboard',
          metadata: {
            dossierId: selectedDossier.id,
            numeroDossier: selectedDossier.numeroDossier,
            verificationsCompletedAt: new Date().toISOString()
          }
        })
      }
    } else {
      setVerificationsOpen(false)
      setSelectedDossier(null)
    }
  }

  // Actions d'ordonnancement
  const handleOrdonnance = async (dossier: DossierComptable) => {
    try {
      setActionLoading(true)
      setLoading('ordonnancement', true)
      setActionResult(null)
      
      const response = await fetch(`/api/dossiers/${dossier.id}/ordonnance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ comment: ordonnancementComment })
      })
      
      if (response.ok) {
        // Soumettre automatiquement à l'AC après ordonnancement
        try {
          const acResponse = await fetch(`/api/dossiers/${dossier.id}/comptabilize`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              comment: `Soumission automatique à l'AC après ordonnancement par ${user?.name || 'l\'ordonnateur'}` 
            })
          })

          if (acResponse.ok) {
            setActionResult({
              type: 'success',
              message: `Dossier ${dossier.numeroDossier} ordonné et soumis à l'AC avec succès`
            })

            // Créer une notification de succès
            await createNotification({
              userId: user?.id || '',
              title: 'Dossier ordonné et soumis à l\'AC',
              message: `Le dossier ${dossier.numeroDossier} a été ordonné et automatiquement soumis à l'Agent Comptable.\n\nObjet: ${dossier.objetOperation}\nBénéficiaire: ${dossier.beneficiaire}${ordonnancementComment ? `\n\nCommentaire: ${ordonnancementComment}` : ''}`,
              type: 'SUCCESS',
              priority: 'MEDIUM',
              actionUrl: '/ordonnateur-dashboard',
              actionLabel: 'Voir le dashboard',
              metadata: {
                dossierId: dossier.id,
                numeroDossier: dossier.numeroDossier,
                ordonnedAt: new Date().toISOString(),
                submittedToAC: true,
                comment: ordonnancementComment
              }
            })
          } else {
            // Ordonnancement réussi mais soumission AC échouée
            setActionResult({
              type: 'success',
              message: `Dossier ${dossier.numeroDossier} ordonné avec succès (soumission AC en attente)`
            })

            await createNotification({
              userId: user?.id || '',
              title: 'Dossier ordonné - Soumission AC en attente',
              message: `Le dossier ${dossier.numeroDossier} a été ordonné avec succès, mais la soumission automatique à l'AC a échoué. Veuillez contacter l'administrateur.`,
              type: 'WARNING',
              priority: 'MEDIUM',
              actionUrl: '/ordonnateur-dashboard',
              actionLabel: 'Voir le dashboard',
              metadata: {
                dossierId: dossier.id,
                numeroDossier: dossier.numeroDossier,
                ordonnedAt: new Date().toISOString(),
                submittedToAC: false,
                comment: ordonnancementComment
              }
            })
          }
        } catch (acError) {
          console.error('Erreur lors de la soumission à l\'AC:', acError)
          setActionResult({
            type: 'success',
            message: `Dossier ${dossier.numeroDossier} ordonné avec succès (soumission AC en attente)`
          })
        }

        await loadDossiers() // Recharger la liste
        setOrdonnancementOpen(false)
        setSelectedDossier(null)
        setOrdonnancementComment('')
      } else {
        const errorData = await response.json()
        let errorMessage = errorData.error || 'Erreur lors de l\'ordonnancement'
        
        // Gérer les erreurs spécifiques aux vérifications ordonnateur
        if (errorData.code === 'VERIFICATIONS_ORDONNATEUR_MANQUANTES') {
          errorMessage = 'Les vérifications ordonnateur doivent être effectuées avant l\'ordonnancement'
          
          setActionResult({
            type: 'error',
            message: errorMessage + '. Cliquez sur "Effectuer les vérifications" pour commencer.'
          })
          
          setOrdonnancementOpen(false)
          return
        } else if (errorData.code === 'VERIFICATIONS_ORDONNATEUR_NON_VALIDEES') {
          errorMessage = 'Toutes les vérifications ordonnateur doivent être validées avant l\'ordonnancement'
          
          setActionResult({
            type: 'error',
            message: errorMessage + '. Vérifiez et complétez vos vérifications.'
          })
          
          setOrdonnancementOpen(false)
          return
        }
        
        setActionResult({
          type: 'error',
          message: errorMessage
        })
        
        // Déterminer le type d'erreur
        let errorType: 'network' | 'server' | 'validation' | 'permission' | 'notFound' | 'generic' = 'generic'
        if (response.status === 401 || response.status === 403) {
          errorType = 'permission'
        } else if (response.status === 404) {
          errorType = 'notFound'
        } else if (response.status >= 500) {
          errorType = 'server'
        } else if (response.status >= 400) {
          errorType = 'validation'
        }
        
        handleError(errorMessage, errorType, 'Ordonnancement du dossier')
        
        // Créer une notification d'erreur
        await createNotification({
          userId: user?.id || '',
          title: 'Erreur lors de l\'ordonnancement',
          message: `Impossible d'ordonner le dossier ${dossier.numeroDossier}.\n\nErreur: ${errorMessage}`,
          type: 'ERROR',
          priority: 'HIGH',
          actionUrl: '/ordonnateur-dashboard',
          actionLabel: 'Réessayer',
          metadata: {
            dossierId: dossier.id,
            numeroDossier: dossier.numeroDossier,
            error: errorMessage,
            failedAt: new Date().toISOString()
          }
        })
      }
    } catch (error) {
      console.error('Erreur ordonnancement:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion'
      
      setActionResult({
        type: 'error',
        message: errorMessage
      })
      
      handleError(errorMessage, 'network', 'Ordonnancement du dossier')
      
      // Créer une notification d'erreur
      await createNotification({
        userId: user?.id || '',
        title: 'Erreur de connexion',
        message: `Impossible d'ordonner le dossier ${dossier.numeroDossier}.\n\nErreur de connexion: ${errorMessage}`,
        type: 'ERROR',
        priority: 'HIGH',
        actionUrl: '/ordonnateur-dashboard',
        actionLabel: 'Réessayer',
        metadata: {
          dossierId: dossier.id,
          numeroDossier: dossier.numeroDossier,
          error: errorMessage,
          failedAt: new Date().toISOString()
        }
      })
    } finally {
      setActionLoading(false)
      setLoading('ordonnancement', false)
    }
  }

  // Fonction pour ouvrir la modal de contenu du dossier
  const handleDossierClick = (dossier: DossierComptable) => {
    setSelectedDossier(dossier)
    setDossierContentOpen(true)
  }

  const getStatutBadge = (statut: string) => {
    const configs = {
      'EN_ATTENTE': { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'VALIDÉ_CB': { label: 'Validé CB', className: 'bg-green-100 text-green-800 border-green-200' },
      'REJETÉ_CB': { label: 'Rejeté CB', className: 'bg-red-100 text-red-800 border-red-200' },
      'VALIDÉ_ORDONNATEUR': { label: 'Validé Ordonnateur', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'PAYÉ': { label: 'Payé', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'TERMINÉ': { label: 'Terminé', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
    
    const config = configs[statut as keyof typeof configs] || configs['EN_ATTENTE']
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  if (user?.role !== 'ORDONNATEUR') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-muted-foreground" />
                Accès refusé
              </CardTitle>
              <CardDescription>
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard')}>
                Retour au dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <CompactPageLayout>
      <PageHeader
        title="Dashboard Ordonnateur"
        subtitle="Ordonnez les dépenses validées par le Contrôleur Budgétaire"
        actions={
          <Button 
            variant="outline" 
            onClick={loadDossiers} 
            disabled={isLoadingDossiers}
            className="w-full sm:w-auto h-8"
          >
            <ButtonLoading
              isLoading={isLoadingDossiers}
              loadingText="Chargement..."
              variant="refresh"
              size="sm"
              color="primary"
            >
              Rafraîchir
            </ButtonLoading>
          </Button>
        }
      />

        {/* Affichage des erreurs */}
        {hasError && (
          <ErrorDisplay
            error={error}
            onRetry={() => retry(loadDossiers)}
            onDismiss={clearError}
            showRetry={true}
            showDismiss={true}
            variant="card"
            className="animate-in slide-in-from-top-2 duration-300"
          />
        )}

        {/* Affichage des résultats d'actions */}
        {actionResult && (
          <ActionLoadingState
            isLoading={actionLoading}
            loadingMessage="Ordonnancement en cours..."
            successMessage={actionResult.type === 'success' ? actionResult.message : undefined}
            errorMessage={actionResult.type === 'error' ? actionResult.message : undefined}
            onComplete={() => setActionResult(null)}
            className="animate-in slide-in-from-top-2 duration-300"
          />
        )}

        {/* Chargement contextuel */}
        {isLoading('dossiers') && (
          <ContextualLoading
            context="dossiers"
            isLoading={true}
            className="animate-in slide-in-from-top-2 duration-300"
          />
        )}

        {/* Barre de recherche et filtres */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par numéro, objet ou bénéficiaire..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date de création</SelectItem>
                    <SelectItem value="numeroDossier">Numéro dossier</SelectItem>
                    <SelectItem value="dateDepot">Date de dépôt</SelectItem>
                    <SelectItem value="statut">Statut</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats globales du dashboard - Layout en colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <div className="text-2xl font-bold text-yellow-600">
                  {dossiers.filter(d => d.statut === 'VALIDÉ_CB').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Dossiers validés par le CB</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vérifications en cours</p>
                <div className="text-2xl font-bold text-orange-600">
                  {dossiers.filter(d => d.statut === 'VALIDÉ_CB').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">En cours de vérifications ordonnateur</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ordonnés</p>
                <div className="text-2xl font-bold text-blue-600">
                  {dossiers.filter(d => d.statut === 'VALIDÉ_ORDONNATEUR').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Dépenses ordonnées</p>
              </div>
              <FileCheck className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejetés</p>
                <div className="text-2xl font-bold text-red-600">
                  {dossiers.filter(d => d.statut === 'REJETÉ_CB').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Dossiers rejetés</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <div className="text-2xl font-bold text-primary">
                  {dossiers.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tous les dossiers</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Navigation horizontale par statut */}
        <OrdonnateurStatusNavigation
          dossiers={dossiers}
          currentFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        {/* Liste des dossiers */}
        <Card>
          <CardHeader>
            <CardTitle>
              {statusFilter === 'all' ? 'Tous les dossiers' :
               statusFilter === 'en_attente' ? 'Dossiers en attente' :
               statusFilter === 'verifications_en_cours' ? 'Vérifications en cours' :
               statusFilter === 'ordonnes' ? 'Dossiers ordonnés' :
               statusFilter === 'rejetes' ? 'Dossiers rejetés' : 'Dossiers'}
            </CardTitle>
            <CardDescription>
              {filteredDossiers.length} dossier{filteredDossiers.length > 1 ? 's' : ''} trouvé{filteredDossiers.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDossiers ? (
              <TableLoadingSkeleton rows={5} columns={7} />
            ) : filteredDossiers.length > 0 ? (
              (
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Poste Comptable</TableHead>
                    <TableHead>Date Dépôt</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Vérifications</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDossiers.map((dossier) => (
                    <TableRow 
                      key={dossier.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleDossierClick(dossier)}
                    >
                      <TableCell className="font-medium text-reference">{dossier.numeroDossier}</TableCell>
                      <TableCell className="max-w-xs truncate">{dossier.objetOperation}</TableCell>
                      <TableCell>{dossier.beneficiaire}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-code">{dossier.poste_comptable?.numero || 'N/A'}</div>
                          <div className="text-muted-foreground">{dossier.poste_comptable?.intitule || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-date">{new Date(dossier.dateDepot).toLocaleDateString('fr-FR')}</span>
                      </TableCell>
                      <TableCell>{getStatutBadge(dossier.statut)}</TableCell>
                      <TableCell>
                        {(() => {
                          const verifStatus = verificationsStatus[dossier.id]
                          if (!verifStatus || !verifStatus.completed) {
                            return (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <Clock className="mr-1 h-3 w-3" />
                                En attente
                              </Badge>
                            )
                          }
                          
                          switch (verifStatus.status) {
                            case 'VALIDÉ':
                              return (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Validé
                                </Badge>
                              )
                            case 'EN_COURS':
                              return (
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                                  <ClipboardCheck className="mr-1 h-3 w-3" />
                                  En cours
                                </Badge>
                              )
                            case 'REJETÉ':
                              return (
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Rejeté
                                </Badge>
                              )
                            default:
                              return (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                                  <Clock className="mr-1 h-3 w-3" />
                                  En attente
                                </Badge>
                              )
                          }
                        })()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleDossierClick(dossier)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            {dossier.statut === 'VALIDÉ_CB' && (
                              <>
                                <DropdownMenuSeparator />
                                {(() => {
                                  const verifStatus = verificationsStatus[dossier.id]
                                  const verificationsDejaEffectuees = verifStatus?.completed
                                  
                                  return (
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (verificationsDejaEffectuees) {
                                          handleVerifications(dossier, 'consultation')
                                        } else {
                                          handleVerifications(dossier, 'validation')
                                        }
                                      }}
                                      className={verificationsDejaEffectuees ? "text-gray-400" : "text-orange-600"}
                                    >
                                      <ClipboardCheck className="mr-2 h-4 w-4" />
                                      {verificationsDejaEffectuees ? 'Consulter les vérifications' : 'Effectuer les vérifications'}
                                    </DropdownMenuItem>
                                  )
                                })()}
                                {(() => {
                                  const verifStatus = verificationsStatus[dossier.id]
                                  const canOrdonnance = verifStatus?.completed && verifStatus?.status === 'VALIDÉ'
                                  
                                  return (
                                    <DropdownMenuItem 
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        if (canOrdonnance) {
                                          setSelectedDossier(dossier)
                                          await loadVerificationsSummary(dossier.id)
                                          setOrdonnancementOpen(true)
                                        }
                                      }}
                                      className={canOrdonnance ? "text-blue-600" : "text-gray-400 cursor-not-allowed"}
                                      disabled={!canOrdonnance}
                                    >
                                      <FileCheck className="mr-2 h-4 w-4" />
                                      {canOrdonnance ? 'Ordonner la dépense' : 'Ordonner (vérifications requises)'}
                                    </DropdownMenuItem>
                                  )
                                })()}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">Aucun dossier</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aucun dossier validé par le CB en attente d'ordonnancement.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal d'ordonnancement */}
        <Dialog open={ordonnancementOpen} onOpenChange={setOrdonnancementOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Ordonner la dépense</DialogTitle>
              <DialogDescription>
                Ordonnez la dépense pour le dossier {selectedDossier?.numeroDossier}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto space-y-6">
              {/* Résumé des vérifications */}
              {verificationsSummary && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Résumé des vérifications</h3>
                  </div>
                  
                  {/* Statistiques globales */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {verificationsSummary.statistiques?.validees || 0}
                      </div>
                      <div className="text-sm text-green-700">Validées</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {verificationsSummary.statistiques?.rejetees || 0}
                      </div>
                      <div className="text-sm text-red-700">Rejetées</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {verificationsSummary.statistiques?.total || 0}
                      </div>
                      <div className="text-sm text-blue-700">Total</div>
                    </div>
                  </div>

                  {/* Détail par catégorie */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Détail par catégorie</h4>
                    {verificationsSummary.validationsParCategorie && Object.values(verificationsSummary.validationsParCategorie).map((categorie: any) => (
                      <div key={categorie.categorie.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${categorie.categorie.couleur}-500`}></div>
                            <span className="font-medium">{categorie.categorie.nom}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {categorie.validations.filter((v: any) => v.valide).length} / {categorie.validations.length} validées
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {categorie.validations.map((validation: any) => (
                            <div key={validation.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                {validation.valide ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="text-sm">{validation.verification.nom}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(validation.valide_le).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commentaire d'ordonnancement */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Commentaire d'ordonnancement</h3>
                </div>
                <div>
                  <Label htmlFor="ordonnancement-comment">Commentaire (optionnel)</Label>
                  <Textarea
                    id="ordonnancement-comment"
                    placeholder="Ajoutez un commentaire sur l'ordonnancement..."
                    value={ordonnancementComment}
                    onChange={(e) => setOrdonnancementComment(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => {
                setOrdonnancementOpen(false)
                setOrdonnancementComment('')
                setVerificationsSummary(null)
              }}>
                Annuler
              </Button>
              <Button 
                onClick={() => selectedDossier && handleOrdonnance(selectedDossier)}
                disabled={actionLoading || isLoading('ordonnancement')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading || isLoading('ordonnancement') ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ordonnancement...
                  </>
                ) : (
                  'Ordonner'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de contenu du dossier */}
        <DossierContentModal
          dossier={selectedDossier}
          isOpen={dossierContentOpen}
          onClose={() => {
            setDossierContentOpen(false)
            setSelectedDossier(null)
          }}
        />

        {/* Modal des vérifications ordonnateur */}
        <Dialog open={verificationsOpen} onOpenChange={setVerificationsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {verificationsMode === 'consultation' ? 'Consultation des vérifications' : 'Vérifications ordonnateur'}
              </DialogTitle>
              <DialogDescription>
                {verificationsMode === 'consultation' 
                  ? `Consultation des vérifications effectuées pour le dossier ${selectedDossier?.numeroDossier}`
                  : `Effectuez les vérifications nécessaires avant d'ordonnancer le dossier ${selectedDossier?.numeroDossier}`
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto">
              {selectedDossier && (
                <VerificationsOrdonnateurForm
                  dossierId={selectedDossier.id}
                  dossierNumero={selectedDossier.numeroDossier}
                  onValidationComplete={handleVerificationsComplete}
                  onCancel={() => handleVerificationsComplete(false)}
                  mode={verificationsMode}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
     </CompactPageLayout>
  )
}

export default function OrdonnateurDashboardPage() {
  return (
    <OrdonnateurGuard>
      <OrdonnateurDashboardContent />
    </OrdonnateurGuard>
  )
}
