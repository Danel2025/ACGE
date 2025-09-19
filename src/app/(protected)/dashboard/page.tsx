'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompactPageLayout, PageHeader, CompactStats, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingState } from '@/components/ui/loading-states'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import type { DashboardStats, DashboardActivity } from '@/hooks/use-dashboard-data'
import { formatFileSize, formatRelativeTime, getFileTypeLabel } from '@/lib/utils'
import { redirectByRole, getRoleRedirectPath } from '@/lib/role-redirect'
import { useEffect } from 'react'
import { 
  FileText, 
  FolderOpen, 
  Users, 
  Upload, 
  TrendingUp, 
  Clock,
  Eye,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  FileCheck,
  Calculator,
  Shield,
  ArrowRight,
  Home,
  XCircle
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const { stats, activity, isLoading, error, refreshData } = useDashboardData()

  // Redirection automatique basée sur le rôle
  useEffect(() => {
    console.log('🔍 Dashboard useEffect - authLoading:', authLoading, 'user:', user)
    
    if (!authLoading && user && user.role) {
      console.log(`👤 Utilisateur connecté: ${user.name} (${user.role})`)
      
      // Seuls les admins restent sur cette page
      if (user.role !== 'ADMIN') {
        console.log(`🔀 Redirection ${user.role} vers page spécialisée`)
        
        // Forcer la redirection immédiatement
        const redirectPath = getRoleRedirectPath(user.role)
        console.log(`🎯 Redirection vers: ${redirectPath}`)
        
        // Utiliser window.location pour forcer la redirection
        if (typeof window !== 'undefined') {
          window.location.href = redirectPath
        } else {
          redirectByRole(user.role, router)
        }
      } else {
        console.log(`✅ Admin reste sur dashboard`)
      }
    } else {
      console.log('⏳ En attente du chargement ou utilisateur non connecté')
    }
  }, [user, authLoading, router])

  // Afficher un message de chargement pendant la redirection
  if (!authLoading && user && user.role && user.role !== 'ADMIN') {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingState
              isLoading={true}
              message="Redirection vers votre interface..."
              variant="spinner"
              size="lg"
              color="primary"
              showText={true}
            />
          </div>
        </div>
      </MainLayout>
    )
  }

  const handleNewDocument = () => {
    router.push('/upload')
  }

  const handleNewFolder = () => {
    router.push('/folders')
  }

  const handleShare = () => {
    router.push('/documents')
  }

  const handleHistory = () => {
    router.push('/documents')
  }

  const handleViewAllDocuments = () => {
    router.push('/documents')
  }

  const handleViewUsers = () => {
    router.push('/users')
  }

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = fileName || 'document'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        console.error('Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error)
    }
  }

  const handleViewDocument = (documentId: string) => {
    router.push(`/documents?view=${documentId}`)
  }

  // Configuration selon le rôle
  const getRoleConfig = () => {
    switch (user?.role) {
      case 'ADMIN':
        return {
          title: 'Tableau de bord Administrateur',
          description: 'Gestion globale du système et des utilisateurs',
          primaryAction: { label: 'Gérer les utilisateurs', action: () => router.push('/users'), icon: Users },
          quickActions: [
            { label: 'Tableau de bord', action: () => router.push('/dashboard'), icon: Home, color: 'blue' },
            { label: 'Utilisateurs', action: () => router.push('/users'), icon: Users, color: 'red' },
            { label: 'Documents', action: () => router.push('/documents'), icon: FileText, color: 'green' },
            { label: 'Upload', action: () => router.push('/upload'), icon: Upload, color: 'purple' }
          ]
        }
      case 'SECRETAIRE':
        return {
          title: 'Tableau de bord Secrétaire',
          description: 'Gestion des dossiers et documents',
          primaryAction: { label: 'Mes fichiers', action: () => router.push('/documents'), icon: FileText },
          quickActions: [
            { label: 'Dossiers rejetés', action: () => router.push('/secretaire-rejected'), icon: XCircle, color: 'red' },
            { label: 'Mes fichiers', action: () => router.push('/documents'), icon: FileText, color: 'green' },
            { label: 'Upload', action: () => router.push('/upload'), icon: Upload, color: 'purple' },
            { label: 'Dossiers', action: () => router.push('/folders'), icon: FolderOpen, color: 'orange' }
          ]
        }
      case 'CONTROLEUR_BUDGETAIRE':
        return {
          title: 'Tableau de bord Contrôleur Budgétaire',
          description: 'Validation des dossiers en attente',
          primaryAction: { label: 'Validation CB', action: () => router.push('/cb-dashboard'), icon: CheckCircle },
          quickActions: [
            { label: 'Validation CB', action: () => router.push('/cb-dashboard'), icon: CheckCircle, color: 'emerald' },
            { label: 'Dossiers rejetés', action: () => router.push('/cb-rejected'), icon: XCircle, color: 'red' },
            { label: 'Documents', action: () => router.push('/documents'), icon: FileText, color: 'green' }
          ]
        }
      case 'ORDONNATEUR':
        return {
          title: 'Tableau de bord Ordonnateur',
          description: 'Ordonnancement des dépenses validées',
          primaryAction: { label: 'Ordonnancement', action: () => router.push('/ordonnateur-dashboard'), icon: FileCheck },
          quickActions: [
            { label: 'Ordonnancement', action: () => router.push('/ordonnateur-dashboard'), icon: FileCheck, color: 'blue' },
            { label: 'Documents', action: () => router.push('/documents'), icon: FileText, color: 'green' }
          ]
        }
      case 'AGENT_COMPTABLE':
        return {
          title: 'Tableau de bord Agent Comptable',
          description: 'Comptabilisation des paiements',
          primaryAction: { label: 'Comptabilisation', action: () => router.push('/ac-dashboard'), icon: Calculator },
          quickActions: [
            { label: 'Comptabilisation', action: () => router.push('/ac-dashboard'), icon: Calculator, color: 'purple' },
            { label: 'Documents', action: () => router.push('/documents'), icon: FileText, color: 'green' }
          ]
        }
      default:
        return {
          title: 'Tableau de bord',
          description: 'Vue d\'ensemble de vos fichiers et activités',
          primaryAction: { label: 'Nouveau document', action: handleNewDocument, icon: Upload },
          quickActions: [
            { label: 'Documents', action: () => router.push('/documents'), icon: FileText, color: 'green' },
            { label: 'Upload', action: () => router.push('/upload'), icon: Upload, color: 'purple' },
            { label: 'Dossiers', action: () => router.push('/folders'), icon: FolderOpen, color: 'orange' }
          ]
        }
    }
  }

  const roleConfig = getRoleConfig()

  return (
    <CompactPageLayout>
      <PageHeader
        title={roleConfig.title}
        subtitle={roleConfig.description}
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {error && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData} 
                className="w-full sm:w-auto h-8"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            )}
            <Button 
              onClick={roleConfig.primaryAction.action} 
              className="w-full sm:w-auto h-8"
            >
              <roleConfig.primaryAction.icon className="mr-2 h-4 w-4" />
              {roleConfig.primaryAction.label}
            </Button>
          </div>
        }
      />

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">
              Erreur lors du chargement des données: {error}
            </p>
          </div>
        </div>
      )}

      <CompactStats
        stats={[
          {
            label: "Total Fichiers",
            value: isLoading ? <Skeleton className="h-8 w-16" /> : (stats?.totalDocuments?.toLocaleString() || 0),
            icon: <FileText className="h-4 w-4 text-red-600" />,
            color: "text-red-600"
          },
          {
            label: "Dossiers",
            value: isLoading ? <Skeleton className="h-8 w-16" /> : (stats?.totalFolders?.toLocaleString() || 0),
            icon: <FolderOpen className="h-4 w-4 text-orange-600" />,
            color: "text-orange-600"
          },
          {
            label: "Espace utilisé",
            value: isLoading ? <Skeleton className="h-8 w-16" /> : (stats?.spaceUsed ? `${stats.spaceUsed.gb} GB` : '0 GB'),
            icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
            color: "text-blue-600"
          },
          {
            label: "Utilisateurs",
            value: isLoading ? <Skeleton className="h-8 w-16" /> : (stats?.totalUsers?.toLocaleString() || 0),
            icon: <Users className="h-4 w-4 text-purple-600" />,
            color: "text-purple-600"
          }
        ]}
        columns={4}
      />

      {/* Role-specific information */}
      {(user?.role === 'CONTROLEUR_BUDGETAIRE' || user?.role === 'ORDONNATEUR' || user?.role === 'AGENT_COMPTABLE') && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-800" />
            <h3 className="text-sm font-medium text-blue-800">Interface spécialisée</h3>
          </div>
          <p className="text-xs text-blue-700 mb-3">
            {user?.role === 'CONTROLEUR_BUDGETAIRE' && 'Accédez à votre interface de validation des dossiers'}
            {user?.role === 'ORDONNATEUR' && 'Accédez à votre interface d\'ordonnancement des dépenses'}
            {user?.role === 'AGENT_COMPTABLE' && 'Accédez à votre interface de comptabilisation des paiements'}
          </p>
          <Button 
            onClick={roleConfig.primaryAction.action}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8"
          >
            <roleConfig.primaryAction.icon className="mr-2 h-4 w-4" />
            {roleConfig.primaryAction.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Documents récents */}
        <ContentSection
          title="Fichiers récents"
          subtitle="Vos derniers fichiers ajoutés ou modifiés"
          actions={
            <Button variant="outline" size="sm" onClick={handleViewAllDocuments} className="h-8">
              Voir tous
            </Button>
          }
          className="col-span-4"
        >
              <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="w-8 h-8 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="w-8 h-8" />
                        <Skeleton className="w-8 h-8" />
                      </div>
                    </div>
                  ))
                ) : stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
                  stats.recentDocuments.map((doc: DashboardStats['recentDocuments'][number]) => (
                    <div key={doc.id} className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-powder-blue/20 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-powder-blue" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{doc.title || doc.name}</p>
                        <p className="text-xs text-primary">
                          {formatRelativeTime(doc.updatedAt)} • {formatFileSize(doc.size)} • {getFileTypeLabel(doc.type)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleViewDocument(doc.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Voir le document</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleDownloadDocument(doc.id, doc.name)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Télécharger</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 icon-red-fg" />
                    <h3 className="mt-2 text-sm font-medium text-primary">Aucun document</h3>
                    <p className="mt-1 text-sm text-primary">
                      Commencez par télécharger votre premier document.
                    </p>
                    <div className="mt-6">
                      <Button onClick={handleNewDocument}>
                        <Upload className="mr-2 h-4 w-4" />
                        Télécharger un document
                      </Button>
                    </div>
                  </div>
                )}
              </div>
        </ContentSection>

        {/* Activité récente */}
        <ContentSection
          title="Activité récente"
          subtitle="Dernières actions sur vos fichiers"
          className="col-span-3"
        >
              <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Skeleton className="w-2 h-2 rounded-full mt-2" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))
                ) : activity?.activities && activity.activities.length > 0 ? (
                  activity.activities.map((act: DashboardActivity['activities'][number]) => (
                    <div key={act.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-powder-blue rounded-full mt-2"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{act.action}</p>
                        <p className="text-xs text-primary">{act.target}</p>
                        <p className="text-xs text-primary">{formatRelativeTime(act.timestamp)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-8 w-8 icon-blue-fg" />
                    <h3 className="mt-2 text-sm font-medium text-primary">Aucune activité</h3>
                    <p className="mt-1 text-xs text-primary">
                      Vos activités récentes apparaîtront ici.
                    </p>
                  </div>
                )}
              </div>
        </ContentSection>

        {/* Quick Actions */}
        <ContentSection
          title="Actions rapides"
          subtitle="Accédez rapidement aux fonctionnalités de votre rôle"
          className="col-span-3"
        >
          <div className="grid gap-4 md:grid-cols-4">
            {roleConfig.quickActions.map((action, index) => {
              const getColorClasses = (color: string) => {
                switch (color) {
                  case 'red': return 'text-red-600'
                  case 'green': return 'text-green-600'
                  case 'purple': return 'text-purple-600'
                  case 'orange': return 'text-orange-600'
                  case 'blue': return 'text-blue-600'
                  case 'emerald': return 'text-emerald-600'
                  default: return 'text-muted-foreground'
                }
              }
              
              return (
                <Button 
                  key={index}
                  variant="outline" 
                  className="h-20 flex-col hover:bg-accent/50 transition-colors" 
                  onClick={action.action}
                >
                  <action.icon className={`h-6 w-6 mb-2 ${getColorClasses(action.color)}`} />
                  <span>{action.label}</span>
                </Button>
              )
            })}
          </div>
        </ContentSection>
      </div>
    </CompactPageLayout>
  )
}
