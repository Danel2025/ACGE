'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompactPageLayout, PageHeader, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import CompactStats from '@/components/shared/compact-stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useNotificationsContext } from '@/contexts/notifications-context'
import { NotificationType, NotificationPriority } from '@/types'
import { ErrorDisplay, useErrorHandler } from '@/components/ui/error-display'
import { 
  LoadingState, 
  ActionLoadingState, 
  ContextualLoading,
  useLoadingStates 
} from '@/components/ui/loading-states'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Settings,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SortAsc,
  SortDesc,
  Archive,
  Star,
  StarOff,
  Calendar,
  FileText,
  RefreshCw,
  X,
  Check,
  Plus,
  Minus,
} from 'lucide-react'

const notificationTypeConfig = {
  INFO: { icon: Info, color: 'bg-blue-100 text-blue-700', label: 'Information' },
  WARNING: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700', label: 'Avertissement' },
  ERROR: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Erreur' },
  SUCCESS: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Succès' },
  VALIDATION: { icon: CheckCircle, color: 'bg-purple-100 text-purple-700', label: 'Validation' },
  REJECTION: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejet' },
  APPROVAL: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Approbation' },
  SYSTEM: { icon: Bell, color: 'bg-gray-100 text-gray-700', label: 'Système' },
}

const priorityConfig = {
  LOW: { color: 'bg-gray-100 text-gray-700', label: 'Faible', order: 1 },
  MEDIUM: { color: 'bg-blue-100 text-blue-700', label: 'Moyenne', order: 2 },
  HIGH: { color: 'bg-orange-100 text-orange-700', label: 'Élevée', order: 3 },
  URGENT: { color: 'bg-red-100 text-red-700', label: 'Urgente', order: 4 },
}

type SortField = 'createdAt' | 'priority' | 'type' | 'title'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'list' | 'compact' | 'grouped'

export default function NotificationsPage() {
  const router = useRouter()
  const {
    notifications,
    stats,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    deleteNotification,
    deleteNotifications,
    clearAllNotifications,
  } = useNotificationsContext()
  
  const { error: globalError, handleError, retry, clearError, hasError } = useErrorHandler()
  const { setLoading, isLoading: isActionLoading } = useLoadingStates()

  // États de base
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READ' | 'UNREAD'>('ALL')
  
  // États avancés
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [groupByDate, setGroupByDate] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // États pour les dialogues
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Pagination
  const totalPages = Math.ceil(notifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  // Filtrer et trier les notifications
  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications.filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'ALL' || notification.type === typeFilter
      const matchesPriority = priorityFilter === 'ALL' || notification.priority === priorityFilter
      const matchesStatus = statusFilter === 'ALL' || 
                           (statusFilter === 'READ' && notification.isRead) ||
                           (statusFilter === 'UNREAD' && !notification.isRead)

      return matchesSearch && matchesType && matchesPriority && matchesStatus
    })

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'priority':
          aValue = priorityConfig[a.priority]?.order || 0
          bValue = priorityConfig[b.priority]?.order || 0
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [notifications, searchTerm, typeFilter, priorityFilter, statusFilter, sortField, sortOrder])

  // Grouper les notifications par date
  const groupedNotifications = useMemo(() => {
    if (!groupByDate || viewMode !== 'grouped') {
      return { 'Toutes': filteredAndSortedNotifications }
    }

    const groups: { [key: string]: typeof filteredAndSortedNotifications } = {}
    
    filteredAndSortedNotifications.forEach(notification => {
      const date = new Date(notification.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let groupKey: string
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Aujourd\'hui'
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Hier'
      } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        groupKey = 'Cette semaine'
      } else if (date.getTime() > today.getTime() - 30 * 24 * 60 * 60 * 1000) {
        groupKey = 'Ce mois'
      } else {
        groupKey = date.toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long' 
        })
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(notification)
    })
    
    return groups
  }, [filteredAndSortedNotifications, groupByDate, viewMode])

  // Notifications paginées
  const paginatedNotifications = useMemo(() => {
    if (viewMode === 'grouped') {
      return groupedNotifications
    }
    
    const paginated = filteredAndSortedNotifications.slice(startIndex, endIndex)
    return { 'Notifications': paginated }
  }, [filteredAndSortedNotifications, startIndex, endIndex, groupedNotifications, viewMode])

  // Gestion de la sélection
  const handleSelectAll = useCallback(() => {
    if (selectedNotifications.size === filteredAndSortedNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredAndSortedNotifications.map(n => n.id)))
    }
  }, [selectedNotifications.size, filteredAndSortedNotifications])

  const handleSelectNotification = useCallback((notificationId: string) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId)
    } else {
      newSelected.add(notificationId)
    }
    setSelectedNotifications(newSelected)
  }, [selectedNotifications])

  // Actions en lot
  const handleBulkMarkAsRead = useCallback(async () => {
    const promises = Array.from(selectedNotifications).map(id => markAsRead(id))
    await Promise.all(promises)
    setSelectedNotifications(new Set())
  }, [selectedNotifications, markAsRead])

  const handleBulkDelete = useCallback(async () => {
    try {
      const notificationIds = Array.from(selectedNotifications)
      const count = await deleteNotifications(notificationIds)
      
      if (count > 0) {
        console.log(`${count} notifications supprimées avec succès`)
        setSelectedNotifications(new Set())
        setShowDeleteDialog(false)
      } else {
        console.error('Aucune notification supprimée')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression en lot:', error)
    }
  }, [selectedNotifications, deleteNotifications])

  // Export
  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    setIsExporting(true)
    try {
      // TODO: Implémenter l'export
      console.log(`Export ${format}:`, filteredAndSortedNotifications)
      setShowExportDialog(false)
    } finally {
      setIsExporting(false)
    }
  }, [filteredAndSortedNotifications])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault()
            handleSelectAll()
            break
          case 'r':
            e.preventDefault()
            refreshNotifications()
            break
          case 'e':
            e.preventDefault()
            setShowExportDialog(true)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSelectAll, refreshNotifications])

  // Utilitaires
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`
  }

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    const count = await markAllAsRead()
    console.log(`${count} notifications marquées comme lues`)
  }

  const handleNotificationClick = async (notification: any) => {
    // Marquer comme lu si non lu
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }

    // Rediriger vers l'action si disponible
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Erreur</CardTitle>
              <CardDescription>
                Impossible de charger les notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={refreshNotifications} className="w-full">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <CompactPageLayout>
        {/* Affichage des erreurs */}
        {hasError && (
          <ErrorDisplay
            error={globalError}
            onRetry={() => retry(refreshNotifications)}
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
            isLoading={isActionLoading('markAsRead') || isActionLoading('delete')}
            loadingMessage="Traitement en cours..."
            successMessage={actionResult.type === 'success' ? actionResult.message : undefined}
            errorMessage={actionResult.type === 'error' ? actionResult.message : undefined}
            onComplete={() => setActionResult(null)}
            className="animate-in slide-in-from-top-2 duration-300"
          />
        )}

        {/* Chargement contextuel */}
        {isLoading && (
          <ContextualLoading
            context="notifications"
            isLoading={true}
            className="animate-in slide-in-from-top-2 duration-300"
          />
        )}

        {/* Header compact avec ligne de séparation subtile */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-title-bold text-primary">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {stats ? `${stats.unreadCount} non lues sur ${stats.totalNotifications}` : 'Chargement...'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={refreshNotifications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant="outline" 
              size="sm"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Mode d'affichage</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={viewMode === 'list'}
                  onCheckedChange={() => setViewMode('list')}
                >
                  <List className="mr-2 h-4 w-4" />
                  Liste
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={viewMode === 'compact'}
                  onCheckedChange={() => setViewMode('compact')}
                >
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  Compact
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={viewMode === 'grouped'}
                  onCheckedChange={() => setViewMode('grouped')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Groupé
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={groupByDate}
                  onCheckedChange={setGroupByDate}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Grouper par date
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {stats && stats.unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Tout marquer
              </Button>
            )}
          </div>
        </div>

        {/* Filtres rapides en ligne */}
        {stats && (
          <div className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Filtres rapides</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL')
                  setPriorityFilter('ALL')
                  setTypeFilter('ALL')
                  setSearchTerm('')
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Tout afficher
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'ALL' && priorityFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL')
                  setPriorityFilter('ALL')
                  setTypeFilter('ALL')
                  setSearchTerm('')
                }}
                className="gap-2 h-9"
              >
                <Bell className="h-4 w-4" />
                <span className="font-medium">Toutes</span>
                <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">
                  {stats.totalNotifications}
                </span>
              </Button>

              <Button
                variant={statusFilter === 'UNREAD' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(statusFilter === 'UNREAD' ? 'ALL' : 'UNREAD')}
                className={`gap-2 h-9 ${
                  statusFilter === 'UNREAD' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''
                }`}
              >
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="font-medium">Non lues</span>
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">
                  {stats.unreadCount}
                </span>
              </Button>

              <Button
                variant={priorityFilter === 'HIGH' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriorityFilter(priorityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
                className={`gap-2 h-9 ${
                  priorityFilter === 'HIGH' ? 'bg-orange-50 border-orange-200 text-orange-700' : ''
                }`}
              >
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Élevée</span>
                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs">
                  {stats.highPriorityCount}
                </span>
              </Button>

              <Button
                variant={priorityFilter === 'URGENT' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriorityFilter(priorityFilter === 'URGENT' ? 'ALL' : 'URGENT')}
                className={`gap-2 h-9 ${
                  priorityFilter === 'URGENT' ? 'bg-red-50 border-red-200 text-red-700' : ''
                }`}
              >
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium">Urgentes</span>
                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-xs">
                  {stats.urgentCount}
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* Filtres compacts avec bordure subtile */}
        {showFilters && (
          <Card className="p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-title-medium">Filtres</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium">Type</label>
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as NotificationType | 'ALL')}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les types</SelectItem>
                    {Object.entries(notificationTypeConfig).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Priorité</label>
                <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as NotificationPriority | 'ALL')}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Toutes les priorités</SelectItem>
                    {Object.entries(priorityConfig).map(([priority, config]) => (
                      <SelectItem key={priority} value={priority}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Statut</label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | 'READ' | 'UNREAD')}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    <SelectItem value="UNREAD">Non lues</SelectItem>
                    <SelectItem value="READ">Lues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sort-field" className="text-xs">Trier par</Label>
                  <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date</SelectItem>
                      <SelectItem value="priority">Priorité</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                      <SelectItem value="title">Titre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sort-order" className="text-xs">Ordre</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="h-8"
                  >
                    {sortOrder === 'asc' ? (
                      <SortAsc className="h-3 w-3" />
                    ) : (
                      <SortDesc className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="items-per-page" className="text-xs">Par page</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Actions en lot compactes */}
        {selectedNotifications.size > 0 && (
          <Card className="bg-blue-50 border-blue-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedNotifications.size} sélectionnée{selectedNotifications.size > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkMarkAsRead}
                  className="h-8"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Marquer lu
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700 h-8"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Supprimer
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedNotifications(new Set())}
                  className="h-8"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Actions de sélection avec ligne de séparation */}
        <div className="flex items-center justify-end mb-3 pb-3 border-b border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="h-8"
          >
            {selectedNotifications.size === filteredAndSortedNotifications.length ? (
              <Minus className="h-3 w-3 mr-1" />
            ) : (
              <Plus className="h-3 w-3 mr-1" />
            )}
            {selectedNotifications.size === filteredAndSortedNotifications.length ? 'Désélectionner' : 'Sélectionner'}
          </Button>
        </div>

        {/* Liste des notifications */}
        <div className="space-y-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : Object.keys(paginatedNotifications).length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-title-medium text-muted-foreground mb-1">
                  Aucune notification trouvée
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || typeFilter !== 'ALL' || priorityFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? 'Essayez de modifier vos filtres de recherche'
                    : 'Vous n\'avez pas encore de notifications'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {Object.entries(paginatedNotifications).map(([groupName, groupNotifications]) => (
                  <div key={groupName}>
                    {viewMode === 'grouped' && (
                      <div className="px-4 py-2 bg-muted/50 border-b">
                        <h3 className="text-xs font-title-medium text-muted-foreground flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {groupName} ({groupNotifications.length})
                        </h3>
                      </div>
                    )}
                    <div>
                      {groupNotifications.map((notification) => {
                        const typeConfig = notificationTypeConfig[notification.type]
                        const priorityConfigItem = priorityConfig[notification.priority]
                        const TypeIcon = typeConfig.icon
                        const isSelected = selectedNotifications.has(notification.id)

                        return (
                          <div
                            key={notification.id}
                            className={`flex items-start space-x-3 p-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer border-b border-gray-50 last:border-b-0 ${
                              !notification.isRead ? 'bg-blue-50/30 border-l-2 border-l-blue-500' : ''
                            } ${isSelected ? 'bg-blue-100 border-blue-200' : ''} ${
                              viewMode === 'compact' ? 'py-2' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleSelectNotification(notification.id)}
                              />
                              <div className="flex-shrink-0">
                                <div className={`p-1.5 rounded-full ${typeConfig.color}`}>
                                  <TypeIcon className="h-3 w-3" />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className={`text-sm font-medium truncate ${
                                      notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                                    }`}>
                                      {notification.title}
                                    </h3>
                                    {!notification.isRead && (
                                      <div className="h-1.5 w-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    )}
                                  </div>
                                  <p className={`text-xs text-muted-foreground mb-1 ${
                                    viewMode === 'compact' ? 'line-clamp-1' : 'overflow-hidden text-ellipsis'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <span>{getTimeAgo(notification.createdAt)}</span>
                                    <span>•</span>
                                    <Badge variant="secondary" className={`${priorityConfigItem.color} text-xs px-1.5 py-0.5`}>
                                      {priorityConfigItem.label}
                                    </Badge>
                                    {viewMode !== 'compact' && (
                                      <>
                                        <span>•</span>
                                        <span>{formatDate(notification.createdAt)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    {!notification.isRead && (
                                      <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                        <Eye className="mr-2 h-3 w-3" />
                                        Marquer comme lu
                                      </DropdownMenuItem>
                                    )}
                                    {notification.action_url && (
                                      <DropdownMenuItem onClick={() => router.push(notification.action_url!)}>
                                        <CheckCircle className="mr-2 h-3 w-3" />
                                        {notification.action_label || 'Voir'}
                                      </DropdownMenuItem>
                                    )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => deleteNotification(notification.id)}
                                      >
                                        <Trash2 className="mr-2 h-3 w-3" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Pagination compacte avec bordure subtile */}
        {viewMode !== 'grouped' && totalPages > 1 && (
          <Card className="p-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {startIndex + 1}-{Math.min(endIndex, filteredAndSortedNotifications.length)} sur {filteredAndSortedNotifications.length}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer h-8"}
                    />
                  </PaginationItem>

                  {/* Pages */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber
                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className="cursor-pointer h-8 w-8"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer h-8"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </Card>
        )}

        {/* Raccourcis clavier avec bordure subtile */}
        <Card className="bg-muted/30 p-3 border-t border-gray-100">
          <div className="text-xs text-muted-foreground">
            <strong>Raccourcis :</strong> Ctrl+A (Sélectionner), Ctrl+R (Actualiser), Ctrl+E (Exporter)
          </div>
        </Card>

      {/* Dialogues */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedNotifications.size} notification{selectedNotifications.size > 1 ? 's' : ''} ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exporter les notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Choisissez le format d'export pour {filteredAndSortedNotifications.length} notification{filteredAndSortedNotifications.length > 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button onClick={() => handleExport('csv')} disabled={isExporting}>
              <FileText className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => handleExport('pdf')} disabled={isExporting}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CompactPageLayout>
  )
}