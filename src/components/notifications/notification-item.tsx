'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Notification } from '@/types'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  MoreHorizontal,
  Trash2,
  Eye,
  Clock,
} from 'lucide-react'

const notificationTypeConfig = {
  INFO: { icon: Info, color: 'bg-blue-100 text-blue-700', label: 'Information' },
  WARNING: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700', label: 'Avertissement' },
  ERROR: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Erreur' },
  SUCCESS: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Succès' },
  VALIDATION: { icon: CheckCircle, color: 'bg-purple-100 text-purple-700', label: 'Validation' },
  REJECTION: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejet' },
  APPROVAL: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Approbation' },
  SYSTEM: { icon: Clock, color: 'bg-gray-100 text-gray-700', label: 'Système' },
}

const priorityConfig = {
  LOW: { color: 'bg-gray-100 text-gray-700', label: 'Faible' },
  MEDIUM: { color: 'bg-blue-100 text-blue-700', label: 'Moyenne' },
  HIGH: { color: 'bg-orange-100 text-orange-700', label: 'Élevée' },
  URGENT: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
}

interface NotificationItemProps {
  notification: Notification
  isSelected?: boolean
  onSelect?: (id: string) => void
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  viewMode?: 'list' | 'compact' | 'grouped'
  showCheckbox?: boolean
}

export function NotificationItem({
  notification,
  isSelected = false,
  onSelect,
  onMarkAsRead,
  onDelete,
  viewMode = 'list',
  showCheckbox = false
}: NotificationItemProps) {
  const router = useRouter()
  
  const typeConfig = notificationTypeConfig[notification.type]
  const priorityConfigItem = priorityConfig[notification.priority]
  const TypeIcon = typeConfig.icon

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

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      notification.is_read 
        ? 'bg-muted/30 border-muted' 
        : 'bg-background border-border hover:bg-muted/50'
    } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''} ${
      viewMode === 'compact' ? 'p-3' : 'p-4'
    }`}>
      <div className="flex items-start space-x-4">
        {showCheckbox && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(notification.id)}
            className="mt-1"
          />
        )}
        
        <div className="flex-shrink-0">
          <div className={`p-2 rounded-full ${typeConfig.color}`}>
            <TypeIcon className="h-4 w-4" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`text-sm font-medium truncate ${
                  notification.is_read ? 'text-muted-foreground' : 'text-primary'
                }`}>
                  {notification.title}
                </h3>
                {!notification.is_read && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                )}
              </div>
              
              <p className={`text-sm text-muted-foreground mb-2 ${
                viewMode === 'compact' ? 'line-clamp-1' : ''
              }`}>
                {notification.message}
              </p>
              
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{getTimeAgo(notification.created_at)}</span>
                <span>•</span>
                <Badge variant="secondary" className={priorityConfigItem.color}>
                  {priorityConfigItem.label}
                </Badge>
                {viewMode !== 'compact' && (
                  <>
                    <span>•</span>
                    <span>{formatDate(notification.created_at)}</span>
                  </>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!notification.is_read && onMarkAsRead && (
                  <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Marquer comme lu
                  </DropdownMenuItem>
                )}
                {notification.action_url && (
                  <DropdownMenuItem onClick={() => router.push(notification.action_url!)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {notification.action_label || 'Voir'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(notification.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  )
}
