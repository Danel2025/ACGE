'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { useSidebarData } from '@/hooks/use-sidebar-data'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'
import { SidebarNotificationItem } from '@/components/notifications/sidebar-notification-item'
import { NotificationStats } from '@/components/notifications/notification-stats'
import { EmptyNotifications } from '@/components/notifications/empty-notifications'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  FileText,
  Folder,
  Users,
  Upload,
  CheckCircle,
  FileCheck,
  Calculator,
  XCircle,
  Bell,
  HelpCircle,
  Settings,
  Home,
} from 'lucide-react'

interface SidebarProps {
  className?: string
  inSheet?: boolean
}

interface NavItem {
  title: string
  href: string
  icon: any
  color: string
  role?: string
  adminOnly?: boolean
  excludeRoles?: string[]
}

const mainNav = [
  // Navigation pour Secrétaire
  {
    title: 'Mes fichiers',
    href: '/documents',
    icon: FileText,
    color: 'green',
    role: 'SECRETAIRE'
  },
  {
    title: 'Upload',
    href: '/upload',
    icon: Upload,
    color: 'purple',
    role: 'SECRETAIRE'
  },
  {
    title: 'Dossiers',
    href: '/folders',
    icon: Folder,
    color: 'orange',
    role: 'SECRETAIRE'
  },
  {
    title: 'Dossiers rejetés',
    href: '/secretaire-rejected',
    icon: XCircle,
    color: 'red',
    role: 'SECRETAIRE'
  },
  // Navigation pour Contrôleur Budgétaire
  {
    title: 'Validation CB',
    href: '/cb-dashboard',
    icon: CheckCircle,
    color: 'emerald',
    role: 'CONTROLEUR_BUDGETAIRE'
  },
  {
    title: 'Dossiers rejetés',
    href: '/cb-rejected',
    icon: XCircle,
    color: 'red',
    role: 'CONTROLEUR_BUDGETAIRE'
  },
  // Navigation pour Ordonnateur
  {
    title: 'Ordonnancement',
    href: '/ordonnateur-dashboard',
    icon: FileCheck,
    color: 'blue',
    role: 'ORDONNATEUR'
  },
  // Navigation pour Agent Comptable
  {
    title: 'Comptabilisation',
    href: '/ac-dashboard',
    icon: Calculator,
    color: 'purple',
    role: 'AGENT_COMPTABLE'
  },
  // Navigation pour Admin
  {
    title: 'Utilisateurs',
    href: '/users',
    icon: Users,
    color: 'red',
    adminOnly: true,
  },
  {
    title: 'Mes fichiers',
    href: '/documents',
    icon: FileText,
    color: 'green',
    adminOnly: true,
  },
  {
    title: 'Upload',
    href: '/upload',
    icon: Upload,
    color: 'purple',
    adminOnly: true,
  },
  {
    title: 'Dossiers',
    href: '/folders',
    icon: Folder,
    color: 'orange',
    adminOnly: true,
  },
  {
    title: 'Dossiers rejetés',
    href: '/secretaire-rejected',
    icon: XCircle,
    color: 'red',
    adminOnly: true,
  },
  {
    title: 'Validation CB',
    href: '/cb-dashboard',
    icon: CheckCircle,
    color: 'emerald',
    adminOnly: true,
  },
  {
    title: 'Dossiers rejetés',
    href: '/cb-rejected',
    icon: XCircle,
    color: 'red',
    adminOnly: true,
  },
  {
    title: 'Ordonnancement',
    href: '/ordonnateur-dashboard',
    icon: FileCheck,
    color: 'blue',
    adminOnly: true,
  },
  {
    title: 'Comptabilisation',
    href: '/ac-dashboard',
    icon: Calculator,
    color: 'purple',
    adminOnly: true,
  },
]

export function Sidebar({ className, inSheet = false }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useSupabaseAuth()
  const { stats, isLoading } = useSidebarData()
  const { notifications, stats: notificationStats, markAsRead, refreshNotifications, isLoading: notificationsLoading } = useNotifications()

  // Filtrer les éléments de navigation selon le rôle
  const filteredNav = mainNav.filter((item: NavItem) => {
    // Vérifier les permissions admin
    if (item.adminOnly && user?.role !== 'ADMIN') {
      return false
    }
    
    // Vérifier les rôles exclus
    if (item.excludeRoles && user?.role && item.excludeRoles.includes(user.role)) {
      return false
    }
    
    // Vérifier les rôles spécifiques
    if (item.role && user?.role !== item.role) {
      return false
    }
    
    // Si pas de rôle spécifique, afficher pour tous les utilisateurs
    if (!item.role && !item.adminOnly) {
      return true
    }
    
    return true
  })

  const getIconColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return { bg: 'icon-blue-bg', text: 'icon-blue-fg' }
      case 'green':
        return { bg: 'icon-green-bg', text: 'icon-green-fg' }
      case 'purple':
        return { bg: 'icon-purple-bg', text: 'icon-purple-fg' }
      case 'orange':
        return { bg: 'icon-orange-bg', text: 'icon-orange-fg' }
      case 'red':
        return { bg: 'icon-red-bg', text: 'icon-red-fg' }
      case 'emerald':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' }
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground' }
    }
  }

  return (
    <TooltipProvider>
      <div className={cn(
        'sidebar',
        inSheet
          ? 'relative inset-0 z-40 bg-background border-r flex flex-col h-full w-full'
          : 'fixed left-0 top-16 bottom-0 z-10 bg-background border-r flex flex-col w-64 min-w-[240px] max-w-[320px] sm:w-64 md:w-72 lg:w-80',
        className
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto sidebar-scroll">
            <div className="space-y-3 py-3">
            {/* Navigation principale */}
            <div className="px-3 py-2">
              <h2 className="mb-1 px-3 text-lg font-title-semibold tracking-tight truncate text-primary">
                Navigation
              </h2>
              <div className="space-y-1">
                {filteredNav.map((item) => {
                  const colorClasses = getIconColorClasses(item.color)
                  return (
                    <Link key={item.href} href={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={pathname === item.href ? 'secondary' : 'ghost'}
                            className="w-full justify-start min-h-[40px]"
                          >
                            <item.icon className={`h-4 w-4 mr-2 ${colorClasses.text}`} />
                            <span className="truncate text-left flex-1">
                              {item.title}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px]">
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Navigation rapide - Visible uniquement pour les admins */}
            {user?.role === 'ADMIN' && (
              <div className="px-3 py-2">
                <h2 className="mb-1 px-3 text-lg font-title-semibold tracking-tight truncate text-primary">
                  Accès rapide
                </h2>
                <div className="space-y-1">
                  <Link href="/dashboard">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
                          className="w-full justify-start min-h-[40px]"
                        >
                          <Home className="h-4 w-4 mr-2 icon-blue-fg" />
                          <span className="truncate text-left flex-1">
                            Tableau de bord
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p>Tableau de bord principal</p>
                      </TooltipContent>
                    </Tooltip>
                  </Link>
                  
                  <Link href="/settings">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={pathname === '/settings' ? 'secondary' : 'ghost'}
                          className="w-full justify-start min-h-[40px]"
                        >
                          <Settings className="h-4 w-4 mr-2 icon-purple-fg" />
                          <span className="truncate text-left flex-1">
                            Paramètres
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p>Paramètres et configuration</p>
                      </TooltipContent>
                    </Tooltip>
                  </Link>
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-1 px-3">
                <h2 className="text-lg font-title-semibold tracking-tight truncate flex-1 text-primary">
                  Notifications
                </h2>
                <NotificationStats stats={notificationStats} />
              </div>
              <div className="px-1 max-h-[200px] overflow-y-auto">
                <div className="space-y-1">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 3).map((notification) => (
                      <SidebarNotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                      />
                    ))
                  ) : (
                    <EmptyNotifications 
                      onRefresh={refreshNotifications}
                      isLoading={notificationsLoading}
                    />
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-2 pt-2">
                    <Link href="/notifications">
                      <Button variant="ghost" size="sm" className="w-full text-xs">
                        {notifications.length > 3 
                          ? `Voir toutes les notifications (${notifications.length})`
                          : 'Voir toutes les notifications'
                        }
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Aide */}
            <div className="px-3 py-2">
              <h2 className="mb-1 px-3 text-lg font-title-semibold tracking-tight truncate text-primary">
                Aide
              </h2>
              <div className="space-y-1">
                <Link href="/help">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={pathname === '/help' ? 'secondary' : 'ghost'}
                        className="w-full justify-start min-h-[40px]"
                      >
                        <HelpCircle className="h-4 w-4 mr-2 icon-green-fg" />
                        <span className="truncate text-left flex-1">
                          Documentation
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      <p>Guide d'utilisation et documentation</p>
                    </TooltipContent>
                  </Tooltip>
                </Link>
                
                <Link href="/support">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={pathname === '/support' ? 'secondary' : 'ghost'}
                        className="w-full justify-start min-h-[40px]"
                      >
                        <HelpCircle className="h-4 w-4 mr-2 icon-orange-fg" />
                        <span className="truncate text-left flex-1">
                          Support
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      <p>Contacter le support technique</p>
                    </TooltipContent>
                  </Tooltip>
                </Link>
              </div>
            </div>
            </div>
          </div>

          {/* Statistiques rapides - Positionnées en bas */}
          <div className="px-3 py-2 flex-shrink-0 border-t bg-muted/30">
            <h2 className="mb-2 px-4 text-lg font-title-semibold tracking-tight truncate text-primary">
              Statistiques
            </h2>
            <div className="space-y-2 px-3">
              {isLoading ? (
                // Skeleton pour le chargement
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex justify-between items-center text-sm min-h-[20px]">
                    <Skeleton className="h-4 w-16 flex-shrink-0" />
                    <Skeleton className="h-4 w-12 flex-shrink-0" />
                  </div>
                ))
              ) : (
                // Affichage des vraies statistiques
                <>
                  <div className="flex justify-between items-center text-sm min-h-[20px]">
                    <span className="truncate flex-1 mr-2 text-primary">Fichiers</span>
                    <span className="font-medium flex-shrink-0 text-primary">
                      {stats?.totalDocuments?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm min-h-[20px]">
                    <span className="truncate flex-1 mr-2 text-primary">Espace utilisé</span>
                    <span className="font-medium flex-shrink-0 text-primary">
                      {stats?.spaceUsed?.gb ? `${stats.spaceUsed.gb} GB` : '0 GB'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm min-h-[20px]">
                    <span className="truncate flex-1 mr-2 text-primary">Dossiers</span>
                    <span className="font-medium flex-shrink-0 text-primary">
                      {stats?.totalFolders?.toLocaleString() || 0}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
