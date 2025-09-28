'use client'

import { NotificationStats } from '@/types'

interface NotificationStatsProps {
  stats: NotificationStats | null
  className?: string
}

export function NotificationStats({ stats, className = '' }: NotificationStatsProps) {
  if (!stats) return null

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {stats.unreadCount > 0 && (
        <>
          <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          <span className="text-xs text-muted-foreground">
            {stats.unreadCount}
          </span>
        </>
      )}
      {stats.urgentCount > 0 && (
        <div className="flex items-center space-x-1 ml-2">
          <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-xs text-red-600 font-medium">
            {stats.urgentCount} urgent{stats.urgentCount > 1 ? 'es' : ''}
          </span>
        </div>
      )}
      {stats.highPriorityCount > 0 && stats.urgentCount === 0 && (
        <div className="flex items-center space-x-1 ml-2">
          <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
          <span className="text-xs text-orange-600 font-medium">
            {stats.highPriorityCount} prioritaire{stats.highPriorityCount > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
