'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNotificationsContext } from '@/contexts/notifications-context'
import { Bell, CheckCircle, Trash2, RefreshCw } from 'lucide-react'

/**
 * Composant de démonstration pour tester la synchronisation des notifications
 * entre le header et la page notifications
 */
export function NotificationDemo() {
  const {
    stats,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    notifications
  } = useNotificationsContext()

  const handleMarkRandomAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead)
    if (unreadNotifications.length > 0) {
      const randomNotif = unreadNotifications[Math.floor(Math.random() * unreadNotifications.length)]
      const success = await markAsRead(randomNotif.id)
      console.log(`🔔 Notification ${randomNotif.id} marquée comme lue:`, success)
    }
  }

  const handleMarkAllAsRead = async () => {
    const count = await markAllAsRead()
    console.log(`🔔 ${count} notifications marquées comme lues`)
  }

  const simulateNotification = async () => {
    // Simulation d'une nouvelle notification
    console.log('🔔 Simulation d\'une nouvelle notification...')
    await refreshNotifications()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Test Synchronisation
        </CardTitle>
        <CardDescription>
          Testez la synchronisation entre l'icône du header et cette page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques en temps réel */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-lg font-bold">{stats?.totalNotifications || 0}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">{stats?.unreadCount || 0}</div>
            <div className="text-xs text-muted-foreground">Non lues</div>
          </div>
        </div>

        {/* Actions de test */}
        <div className="space-y-2">
          <Button
            onClick={handleMarkRandomAsRead}
            variant="outline"
            className="w-full"
            disabled={!stats?.unreadCount}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Marquer 1 au hasard
          </Button>

          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            className="w-full"
            disabled={!stats?.unreadCount}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Marquer toutes lues
          </Button>

          <Button
            onClick={simulateNotification}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Status de connexion */}
        <div className="text-center">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            🔗 Synchronisation active
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Les changements ici se reflètent instantanément dans l'icône du header grâce au contexte global
        </div>
      </CardContent>
    </Card>
  )
}