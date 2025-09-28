'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getRelativeTime, getPriorityColor, formatFullDate } from '@/lib/date-utils'
import { Notification } from '@/types'

interface SidebarNotificationItemProps {
  notification: Notification
  onMarkAsRead: (notificationId: string) => void
}

export function SidebarNotificationItem({ 
  notification, 
  onMarkAsRead 
}: SidebarNotificationItemProps) {
  const isUnread = !notification.isRead

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full justify-start h-auto p-2 text-left transition-colors ${
            isUnread 
              ? 'bg-blue-50 hover:bg-blue-100 border-l-2 border-blue-500' 
              : 'hover:bg-muted/50'
          }`}
          onClick={() => onMarkAsRead(notification.id)}
        >
          <div className="flex items-start space-x-2 w-full">
            <div className="flex flex-col items-center space-y-1">
              <Bell className={`h-3 w-3 flex-shrink-0 ${
                isUnread ? 'text-blue-600' : 'text-muted-foreground'
              }`} />
              {notification.priority && (
                <div className={`h-1.5 w-1.5 rounded-full ${getPriorityColor(notification.priority)}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium truncate ${
                  isUnread ? 'text-blue-900 dark:text-blue-100' : 'text-muted-foreground'
                }`}>
                  {notification.title}
                </p>
                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                  {notification.createdAt ? getRelativeTime(notification.createdAt.toISOString()) : 'Date inconnue'}
                </span>
              </div>
              <p className={`text-xs truncate ${
                isUnread ? 'text-blue-800 dark:text-blue-200' : 'text-muted-foreground'
              }`}>
                {notification.message}
              </p>
              {notification.priority && (
                <div className="flex items-center space-x-1 mt-1">
                  <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                    {notification.priority}
                  </span>
                </div>
              )}
            </div>
            {isUnread && (
              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[250px]">
        <div className="space-y-1">
          <p className="font-medium text-primary-foreground">{notification.title}</p>
          <p className="text-sm text-primary-foreground/80">{notification.message}</p>
          {notification.priority && (
            <p className="text-xs text-primary-foreground/70">
              Priorité: {notification.priority}
            </p>
          )}
          <p className="text-xs text-primary-foreground/70">
            {notification.createdAt ? formatFullDate(notification.createdAt.toISOString()) : 'Date inconnue'}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
