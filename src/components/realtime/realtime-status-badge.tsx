'use client'

import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/contexts/realtime-context'
import { Wifi, WifiOff } from 'lucide-react'

interface RealtimeStatusBadgeProps {
  showDisconnected?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function RealtimeStatusBadge({
  showDisconnected = false,
  size = 'md'
}: RealtimeStatusBadgeProps) {
  const { isConnected, connectionStatus } = useRealtime()

  // Ne rien afficher si déconnecté et showDisconnected = false
  if (!isConnected && !showDisconnected) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  if (isConnected) {
    return (
      <Badge
        variant="outline"
        className={`bg-green-50 text-green-700 border-green-200 ${sizeClasses[size]}`}
      >
        <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
        <Wifi className="h-3 w-3 mr-1" />
        En temps réel
      </Badge>
    )
  }

  if (connectionStatus === 'connecting') {
    return (
      <Badge
        variant="outline"
        className={`bg-yellow-50 text-yellow-700 border-yellow-200 ${sizeClasses[size]}`}
      >
        <span className="h-2 w-2 bg-yellow-500 rounded-full mr-1.5 animate-pulse" />
        Connexion...
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={`bg-gray-50 text-gray-700 border-gray-200 ${sizeClasses[size]}`}
    >
      <WifiOff className="h-3 w-3 mr-1" />
      Hors ligne
    </Badge>
  )
}