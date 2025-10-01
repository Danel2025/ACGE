'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { useRealtimeDossiers } from '@/hooks/use-realtime-dossiers'
import { toast } from 'sonner'
import { CompactPageLayout, PageHeader, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import CompactStats from '@/components/shared/compact-stats'
import { AgentComptableGuard } from '@/components/auth/role-guard'
import { getRoleRedirectPath, isRoleAuthorizedForDashboard } from '@/lib/role-redirect'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { RefreshCw, Info } from 'lucide-react'
import { RapportVerification } from '@/components/ac/rapport-verification'
import { RapportComparatif } from '@/components/ac/rapport-comparatif'
import { QuitusDisplay } from '@/components/ac/quitus-display'
import { ACStatusNavigation } from '@/components/ac/ac-status-navigation'
import { DossierContentModal } from '@/components/ui/dossier-content-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Calculator,
  ClipboardCheck,
  FileCheck,
  Award
} from 'lucide-react'

interface DossierComptable {
  id: string
  numeroDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire: string
  statut: 'EN_ATTENTE' | 'VALIDÉ_CB' | 'REJETÉ_CB' | 'VALIDÉ_ORDONNATEUR' | 'VALIDÉ_DÉFINITIVEMENT' | 'TERMINÉ'
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

function ACDashboardContent() {
  const { user } = useSupabaseAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // États pour la gestion des dossiers
  const [dossiers, setDossiers] = React.useState<DossierComptable[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [sortField, setSortField] = React.useState<'numeroDossier' | 'dateDepot' | 'statut' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  
  // États pour les actions de comptabilisation
  const [selectedDossier, setSelectedDossier] = React.useState<DossierComptable | null>(null)
  const [clotureOpen, setClotureOpen] = React.useState(false)
  const [commentaire, setCommentaire] = React.useState('')
  const [actionLoading, setActionLoading] = React.useState(false)
  
  // États pour le rapport de vérification
  const [rapportOpen, setRapportOpen] = React.useState(false)
  const [validationDefinitiveOpen, setValidationDefinitiveOpen] = React.useState(false)
  const rapportValidateRef = React.useRef<(() => void) | null>(null)
  const rapportRejectRef = React.useRef<(() => void) | null>(null)
  const rapportCanValidateRef = React.useRef<boolean>(false)

  // État pour la modal de détails
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  // États pour le rapport comparatif
  const [rapportComparatifOpen, setRapportComparatifOpen] = React.useState(false)

  // États pour le quitus
  const [quitusOpen, setQuitusOpen] = React.useState(false)
  const [quitusData, setQuitusData] = React.useState<any>(null)
  
  // État pour le filtre de statut
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'en_attente' | 'valides_definitivement' | 'termines'>('all')

  // 🔥 Realtime: Écouter les changements de dossiers en temps réel
  const { updates, lastUpdate, isConnected } = useRealtimeDossiers({
    filterByStatus: ['ORDONNE', 'EN_ATTENTE_COMPTABILISATION', 'VALIDE_DEFINITIVEMENT', 'TERMINE', 'REJETE_AC'],
    onNewDossier: (dossier) => {
      console.log('🆕 Nouveau dossier pour comptabilisation:', dossier)
      loadDossiers()
      toast.success('Nouveau dossier à traiter', {
        description: `Dossier ${dossier.numeroDossier} ordonné`
      })
    },
    onUpdateDossier: (dossier) => {
      console.log('🔄 Dossier mis à jour:', dossier)
      loadDossiers()
    }
  })

  // Vérifier si l'utilisateur est autorisé à accéder au dashboard AC
  const hasRedirectedRef = React.useRef(false)
  React.useEffect(() => {
    if (hasRedirectedRef.current) return

    if (user?.role && !isRoleAuthorizedForDashboard(user.role, 'ac')) {
      // Rediriger vers la page appropriée selon le rôle
      hasRedirectedRef.current = true
      const redirectPath = getRoleRedirectPath(user.role)
      console.log(`🔀 Redirection ${user.role} depuis ac-dashboard vers: ${redirectPath}`)
      router.replace(redirectPath)
    }
  }, [user, router])

  // Charger les dossiers validés par Ordonnateur
  const loadDossiers = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      // 🔄 Forcer no-cache pour toujours récupérer les données fraîches
      const response = await fetch('/api/dossiers/ac-all', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store', // Next.js 15: ne JAMAIS cacher cette requête
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDossiers(data.dossiers || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors du chargement des dossiers')
      }
    } catch (error) {
      console.error('Erreur chargement dossiers:', error)
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Charger les dossiers au montage
  React.useEffect(() => {
    loadDossiers()
  }, [loadDossiers])

  // Filtrage et tri des dossiers
  const filteredDossiers = React.useMemo(() => {
    let items = dossiers

    // Filtrage par statut
    switch (statusFilter) {
      case 'en_attente':
        items = items.filter(d => d.statut === 'VALIDÉ_ORDONNATEUR')
        break
      case 'valides_definitivement':
        items = items.filter(d => d.statut === 'VALIDÉ_DÉFINITIVEMENT')
        break
      case 'termines':
        items = items.filter(d => d.statut === 'TERMINÉ')
        break
      case 'all':
      default:
        // Afficher tous les dossiers
        break
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


  const handleCloture = async (dossier: DossierComptable) => {
    try {
      setActionLoading(true)
      
      const response = await fetch(`/api/dossiers/${dossier.id}/cloturer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ commentaire })
      })
      
      if (response.ok) {
        await loadDossiers()
        setClotureOpen(false)
        setSelectedDossier(null)
        resetForm()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la clôture')
      }
    } catch (error) {
      console.error('Erreur clôture:', error)
      setError('Erreur lors de la clôture')
    } finally {
      setActionLoading(false)
    }
  }

  const handleValidationDefinitive = async (dossier: DossierComptable) => {
    try {
      setActionLoading(true)
      
      const response = await fetch(`/api/dossiers/${dossier.id}/validation-definitive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ commentaire })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Validation définitive réussie:', data.message)
        await loadDossiers()
        setValidationDefinitiveOpen(false)
        setSelectedDossier(null)
        resetForm()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || errorData.details || 'Erreur lors de la validation définitive'
        setError(errorMessage)
        console.error('❌ Erreur validation définitive:', errorData)
        alert(`Erreur: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Erreur validation définitive:', error)
      setError('Erreur lors de la validation définitive')
    } finally {
      setActionLoading(false)
    }
  }

  const handleGenerateQuitus = async (dossier: DossierComptable) => {
    try {
      setActionLoading(true)
      
      const response = await fetch(`/api/dossiers/${dossier.id}/generate-quitus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Quitus généré:', data.message)
        setQuitusData(data.quitus)
        setSelectedDossier(dossier)
        setQuitusOpen(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la génération du quitus')
        console.error('❌ Erreur génération quitus:', errorData)
      }
    } catch (error) {
      console.error('Erreur génération quitus:', error)
      setError('Erreur lors de la génération du quitus')
    } finally {
      setActionLoading(false)
    }
  }

  const resetForm = () => {
    setCommentaire('')
  }

  const getStatutBadge = (statut: string) => {
    const configs = {
      'EN_ATTENTE': { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'VALIDÉ_CB': { label: 'Validé CB', className: 'bg-green-100 text-green-800 border-green-200' },
      'REJETÉ_CB': { label: 'Rejeté CB', className: 'bg-red-100 text-red-800 border-red-200' },
      'VALIDÉ_ORDONNATEUR': { label: 'Validé Ordonnateur', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'VALIDÉ_DÉFINITIVEMENT': { label: 'Validé Définitivement', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      'TERMINÉ': { label: 'Terminé', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
    
    const config = configs[statut as keyof typeof configs] || configs['EN_ATTENTE']
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  if (user?.role && user.role !== 'AGENT_COMPTABLE' && user.role !== 'ADMIN') {
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
        title="Dashboard Agent Comptable"
        subtitle="Effectuez les paiements et enregistrez les recettes"
        actions={
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={loadDossiers}
              className="h-8"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Rafraîchir
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log('🔄 Debug: test des permissions utilisateur')
                console.log('User role:', user?.role)
                console.log('User email:', user?.email)
              }}
              className="h-8"
            >
              <Info className="mr-2 h-5 w-5" />
              Debug
            </Button>
          </div>
        }
      />

      <ContentSection
        title="Recherche et filtres"
        actions={
          <div className="flex gap-2">
            <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
              <SelectTrigger className="w-[180px] h-8">
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
              className="h-8"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        }
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Rechercher par numéro, objet ou bénéficiaire..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 h-8"
          />
        </div>
      </ContentSection>

      {/* Statistiques améliorées */}
      <CompactStats
        stats={[
          {
            label: "En attente",
            value: dossiers.filter(d => d.statut === 'VALIDÉ_ORDONNATEUR').length,
            icon: <Clock className="h-5 w-5 text-yellow-600" />,
            subtitle: "À valider définitivement",
            tooltip: "Dossiers en attente de validation définitive par l'agent comptable",
            color: "yellow"
          },
          {
            label: "Validés définitivement",
            value: dossiers.filter(d => d.statut === 'VALIDÉ_DÉFINITIVEMENT').length,
            icon: <Award className="h-5 w-5 text-emerald-600" />,
            subtitle: "Prêts pour traitement",
            tooltip: "Dossiers validés et prêts pour la comptabilisation",
            color: "emerald"
          },
          {
            label: "Terminés",
            value: dossiers.filter(d => d.statut === 'TERMINÉ').length,
            icon: <CheckCircle className="h-5 w-5 text-green-600" />,
            subtitle: "Dossiers clôturés",
            tooltip: "Dossiers complètement traités et archivés",
            color: "green"
          },
          {
            label: "Total",
            value: dossiers.length,
            icon: <FileText className="h-5 w-5 text-blue-600" />,
            subtitle: "Tous les dossiers",
            tooltip: "Nombre total de dossiers dans le système",
            color: "blue",
            badge: "Global"
          }
        ]}
        columns={4}
        size="sm"
        variant="compact"
        colorScheme="default"
        animated={true}
        showTooltips={true}
        className="mb-6"
      />

      {/* Navigation par statut */}
      <ACStatusNavigation
        dossiers={dossiers}
        currentFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <ContentSection
        title={(() => {
          switch (statusFilter) {
            case 'en_attente': return 'Dossiers en attente de validation définitive'
            case 'valides_definitivement': return 'Dossiers validés définitivement'
            case 'termines': return 'Dossiers terminés'
            default: return 'Tous les dossiers'
          }
        })()}
        subtitle={`${filteredDossiers.length} dossier${filteredDossiers.length > 1 ? 's' : ''} trouvé${filteredDossiers.length > 1 ? 's' : ''}`}
      >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredDossiers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Poste Comptable</TableHead>
                    <TableHead>Date Dépôt</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDossiers.map((dossier) => (
                    <TableRow
                      key={dossier.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        console.log('👁️ Clic sur dossier:', dossier.numeroDossier)
                        setSelectedDossier(dossier)
                        setDetailsOpen(true)
                      }}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              console.log('👁️ Ouverture des détails du dossier:', dossier.numeroDossier)
                              setSelectedDossier(dossier)
                              setDetailsOpen(true)
                            }}>
                              <Eye className="mr-2 h-5 w-5" />
                              Voir détails
                            </DropdownMenuItem>
                            
                            {dossier.statut === 'VALIDÉ_ORDONNATEUR' && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedDossier(dossier)
                                  setRapportComparatifOpen(true)
                                }}>
                                  <ClipboardCheck className="mr-2 h-5 w-5" />
                                  Rapport comparatif CB/Ordonnateur
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedDossier(dossier)
                                  setValidationDefinitiveOpen(true)
                                }}>
                                  <FileCheck className="mr-2 h-5 w-5" />
                                  Validation définitive
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            {dossier.statut === 'VALIDÉ_DÉFINITIVEMENT' && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedDossier(dossier)
                                  setRapportOpen(true)
                                }}>
                                  <ClipboardCheck className="mr-2 h-5 w-5" />
                                  Rapport de vérification
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            
                            {dossier.statut === 'VALIDÉ_DÉFINITIVEMENT' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleGenerateQuitus(dossier)
                              }}>
                                <Award className="mr-2 h-5 w-5" />
                                Générer Quitus
                              </DropdownMenuItem>
                            )}
                            
                            {dossier.statut === 'VALIDÉ_ORDONNATEUR' && (
                              <>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={<FileText className="h-10 w-10 text-muted-foreground" />}
                title="Aucun dossier"
                description="Aucun dossier ordonné en attente de comptabilisation."
              />
            )}
            {error && (
              <p className="text-sm text-destructive mt-4">{error}</p>
            )}
      </ContentSection>


        {/* Modal de clôture */}
        <Dialog open={clotureOpen} onOpenChange={setClotureOpen}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Clôturer le dossier</DialogTitle>
              <DialogDescription>
                Clôturez le dossier {selectedDossier?.numeroDossier}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="commentaire-cloture">Commentaire de clôture</Label>
                <Textarea
                  id="commentaire-cloture"
                  placeholder="Commentaire sur la clôture..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setClotureOpen(false)
                resetForm()
              }}>
                Annuler
              </Button>
              <Button 
                onClick={() => selectedDossier && handleCloture(selectedDossier)}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading ? 'Clôture...' : 'Clôturer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal du rapport de vérification */}
        <Dialog open={rapportOpen} onOpenChange={setRapportOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Rapport de Vérification</DialogTitle>
              <DialogDescription>
                Rapport complet des vérifications CB et Ordonnateur pour le dossier {selectedDossier?.numeroDossier}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto">
              {selectedDossier && (
                <RapportVerification
                  dossierId={selectedDossier.id}
                  onValidationComplete={(validated) => {
                    setRapportOpen(false)
                    if (validated) {
                      setValidationDefinitiveOpen(true)
                    }
                  }}
                  onValidateRef={rapportValidateRef}
                  onRejectRef={rapportRejectRef}
                  canValidateRef={rapportCanValidateRef}
                />
              )}
            </div>

            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setRapportOpen(false)}>
                Fermer
              </Button>
              {selectedDossier && selectedDossier.statut !== 'VALIDÉ_DÉFINITIVEMENT' && selectedDossier.statut !== 'TERMINÉ' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (rapportRejectRef.current) {
                        rapportRejectRef.current()
                      }
                    }}
                  >
                    Rejeter le dossier
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      if (rapportValidateRef.current) {
                        rapportValidateRef.current()
                      }
                    }}
                    disabled={!rapportCanValidateRef.current}
                  >
                    Valider définitivement
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de validation définitive */}
        <Dialog open={validationDefinitiveOpen} onOpenChange={setValidationDefinitiveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Validation Définitive</DialogTitle>
              <DialogDescription>
                Confirmer la validation définitive du dossier {selectedDossier?.numeroDossier}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-transparent rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Dossier prêt pour validation définitive</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Toutes les vérifications ont été effectuées et aucune incohérence n'a été détectée.
                </p>
              </div>
              
              <div>
                <label htmlFor="validation-comment" className="block text-sm font-medium mb-1">
                  Commentaire de validation (optionnel)
                </label>
                <Textarea
                  id="validation-comment"
                  placeholder="Commentaire sur la validation définitive..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setValidationDefinitiveOpen(false)
                setCommentaire('')
              }}>
                Annuler
              </Button>
              <Button 
                onClick={() => selectedDossier && handleValidationDefinitive(selectedDossier)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? 'Validation...' : 'Valider définitivement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal du quitus */}
        <Dialog open={quitusOpen} onOpenChange={setQuitusOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] print:!max-w-full print:!max-h-full print:!m-0 print:!p-0 overflow-hidden flex flex-col quitus-print" role="dialog">
            <DialogHeader className="print:hidden">
              <DialogTitle>Quitus Généré</DialogTitle>
              <DialogDescription>
                Quitus officiel pour le dossier {selectedDossier?.numeroDossier}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto print:!overflow-visible print:!block print:!h-auto">
              {quitusData && (
                <QuitusDisplay
                  quitus={quitusData}
                  dossierId={selectedDossier?.id}
                  onDownload={() => {
                    // Ici on implémenterait le téléchargement PDF
                    console.log('Téléchargement du quitus:', quitusData.numeroQuitus)
                  }}
                  onPrint={() => {
                    window.print()
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

      {/* Modal du rapport comparatif */}
      <Dialog open={rapportComparatifOpen} onOpenChange={setRapportComparatifOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Rapport Comparatif CB / Ordonnateur</DialogTitle>
            <DialogDescription>
              Comparaison des validations et commentaires généraux pour le dossier {selectedDossier?.numeroDossier}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {selectedDossier && (
              <RapportComparatif dossierId={selectedDossier.id} />
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setRapportComparatifOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détails du dossier */}
      <DossierContentModal
        dossier={selectedDossier}
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false)
          setSelectedDossier(null)
        }}
      />
    </CompactPageLayout>
  )
}

export default function ACDashboardPage() {
  return (
    <AgentComptableGuard>
      <ACDashboardContent />
    </AgentComptableGuard>
  )
}
