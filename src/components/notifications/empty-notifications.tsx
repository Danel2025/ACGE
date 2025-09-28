'use client'

import { Bell, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyNotificationsProps {
  onRefresh?: () => void
  isLoading?: boolean
}

export function EmptyNotifications({ onRefresh, isLoading = false }: EmptyNotificationsProps) {
  return (
    <div className="px-3 py-3 text-center">
      <Bell className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
      <p className="text-xs text-muted-foreground mb-2">
        Aucune notification
      </p>
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      )}
    </div>
  )
}
