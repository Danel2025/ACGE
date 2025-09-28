'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { supabase } from '@/lib/supabase'
import { Notification, NotificationStats, NotificationType, NotificationPriority } from '@/types'

interface UseNotificationsReturn {
  notifications: Notification[]
  stats: NotificationStats | null
  isLoading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<boolean>
  markAllAsRead: () => Promise<number>
  refreshNotifications: () => Promise<void>
  createNotification: (notification: CreateNotificationData) => Promise<boolean>
  deleteNotification: (notificationId: string) => Promise<boolean>
  deleteNotifications: (notificationIds: string[]) => Promise<number>
  clearAllNotifications: () => Promise<number>
}

interface CreateNotificationData {
  userId: string
  title: string
  message: string
  type?: NotificationType
  priority?: NotificationPriority
  expiresAt?: Date
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

// Fonction utilitaire pour transformer les données snake_case en camelCase
function transformNotificationData(rawNotification: any): Notification {
  return {
    id: rawNotification.id,
    userId: rawNotification.user_id,
    title: rawNotification.title,
    message: rawNotification.message,
    type: rawNotification.type,
    priority: rawNotification.priority,
    isRead: rawNotification.is_read,
    readAt: rawNotification.read_at ? new Date(rawNotification.read_at) : null,
    expiresAt: rawNotification.expires_at ? new Date(rawNotification.expires_at) : null,
    actionUrl: rawNotification.action_url,
    actionLabel: rawNotification.action_label,
    metadata: rawNotification.metadata,
    createdAt: new Date(rawNotification.created_at),
    updatedAt: new Date(rawNotification.updated_at),
    user: {} as any // Placeholder, pas utilisé dans ce contexte
  }
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useSupabaseAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      console.log('🔍 useNotifications: Pas d\'utilisateur connecté')
      setNotifications([])
      setStats(null)
      setIsLoading(false)
      return
    }

    if (!supabase) {
      console.warn('🔍 useNotifications: Client Supabase non initialisé')
      setNotifications([])
      setStats(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log(`🔍 useNotifications: Récupération des notifications pour l'utilisateur ${user.id}`)

      // Utiliser l'API route pour contourner les problèmes RLS
      const response = await fetch('/api/notifications-simple', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        }
      })

      if (!response.ok) {
        console.error('❌ useNotifications: Erreur API notifications:', response.status, response.statusText)
        // Mode démo si l'API échoue
        console.log('📋 useNotifications: Système de notifications en mode démo (API non disponible)')
        setNotifications([])
        setStats({
          totalNotifications: 0,
          unreadCount: 0,
          highPriorityCount: 0,
          urgentCount: 0
        })
        return
      }

      const apiData = await response.json()
      const notificationsData = apiData.notifications
      const statsData = apiData.stats

      // Utiliser les statistiques de l'API
      setStats(statsData)

      // Transformer les données snake_case en camelCase
      const transformedNotifications = notificationsData ? 
        notificationsData.map(transformNotificationData) : []
      
      setNotifications(transformedNotifications)
      console.log(`✅ useNotifications: ${notificationsData?.length || 0} notifications chargées`)
      
      // Log des notifications pour debug
      if (notificationsData && notificationsData.length > 0) {
        console.log('📋 useNotifications: Notifications trouvées:')
        notificationsData.forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.title} (${notif.type}, ${notif.priority}) - ${notif.isRead ? 'Lue' : 'Non lue'}`)
        })
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      // En cas d'erreur, initialiser avec des données vides plutôt que de planter
      setNotifications([])
      setStats({
        totalNotifications: 0,
        unreadCount: 0,
        highPriorityCount: 0,
        urgentCount: 0
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      // Mettre à jour l'état local d'abord (optimistic update)
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      )

      // Mettre à jour les statistiques
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - 1)
        } : null)
      }

      // Utiliser l'API pour marquer comme lu
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ notificationId })
      })

      const result = await response.json()

      if (!response.ok && !result.success) {
        console.error('❌ Erreur API mark-read:', response.status, response.statusText)
        // Annuler l'optimistic update en cas d'échec
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: false, readAt: null }
              : notification
          )
        )
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            unreadCount: prev.unreadCount + 1
          } : null)
        }
        return false
      }

      if (result.simulated || result.warning) {
        console.log('🔔 Notification marquée en mode gracieux:', result.message)
      }

      return true
    } catch (err) {
      console.error('Erreur lors du marquage de la notification:', err)
      // Annuler l'optimistic update en cas d'erreur
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: false, readAt: null }
            : notification
        )
      )
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          unreadCount: prev.unreadCount + 1
        } : null)
      }
      return false
    }
  }, [user?.id, stats])

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async (): Promise<number> => {
    if (!user?.id) return 0

    const unreadNotifications = notifications.filter(n => !n.isRead)
    const unreadCount = unreadNotifications.length

    try {
      // Optimistic update - marquer toutes comme lues d'abord
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date()
        }))
      )

      // Mettre à jour les statistiques
      setStats(prev => prev ? {
        ...prev,
        unreadCount: 0
      } : null)

      // Utiliser l'API pour marquer toutes comme lues
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        }
      })

      const result = await response.json()

      if (!response.ok && !result.success) {
        console.error('❌ Erreur API mark-all-read:', response.status, response.statusText)
        // Annuler l'optimistic update
        setNotifications(prev =>
          prev.map(notification => {
            const wasUnread = unreadNotifications.find(n => n.id === notification.id)
            return wasUnread
              ? { ...notification, isRead: false, readAt: null }
              : notification
          })
        )
        setStats(prev => prev ? {
          ...prev,
          unreadCount
        } : null)
        return 0
      }

      if (result.simulated || result.warning) {
        console.log('🔔 Toutes les notifications marquées en mode gracieux:', result.message)
      }

      return result.count || unreadCount
    } catch (err) {
      console.error('Erreur lors du marquage de toutes les notifications:', err)
      // Annuler l'optimistic update
      setNotifications(prev =>
        prev.map(notification => {
          const wasUnread = unreadNotifications.find(n => n.id === notification.id)
          return wasUnread
            ? { ...notification, isRead: false, readAt: null }
            : notification
        })
      )
      setStats(prev => prev ? {
        ...prev,
        unreadCount
      } : null)
      return 0
    }
  }, [user?.id, notifications])

  // Créer une notification (pour les admins)
  const createNotification = useCallback(async (notificationData: CreateNotificationData): Promise<boolean> => {
    if (!supabase) {
      console.warn('Client Supabase non initialisé')
      return false
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'INFO',
          priority: notificationData.priority || 'MEDIUM',
          expires_at: notificationData.expiresAt?.toISOString(),
          action_url: notificationData.actionUrl,
          action_label: notificationData.actionLabel,
          metadata: notificationData.metadata
        })

      if (error) {
        // Si la table n'existe pas, ne pas faire échouer
        if (error.message?.includes('relation "notifications" does not exist')) {
          console.warn('Table notifications non trouvée, notification non créée')
          return false
        }
        throw error
      }

      return true
    } catch (err) {
      console.error('Erreur lors de la création de la notification:', err)
      return false
    }
  }, [])

  // Rafraîchir les notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Charger les notifications au montage et quand l'utilisateur change
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Écouter les changements en temps réel avec gestion d'erreur
  useEffect(() => {
    if (!user?.id || !supabase) return

    let channel: any = null

    try {
      channel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 Changement notifications temps réel:', payload)
            // Rafraîchir les notifications quand il y a un changement
            fetchNotifications()
          }
        )
        .subscribe((status) => {
          console.log('🔄 Statut connexion temps réel notifications:', status)
        })
    } catch (error) {
      console.warn('⚠️ Erreur connexion temps réel notifications:', error)
    }

    return () => {
      if (channel && supabase) {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          console.warn('⚠️ Erreur déconnexion canal notifications:', error)
        }
      }
    }
  }, [user?.id, fetchNotifications])

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const response = await fetch(`/api/notifications/${notificationId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erreur suppression notification:', errorData.error)
        return false
      }

      // Mettre à jour l'état local
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      // Recalculer les stats
      const updatedNotifications = notifications.filter(n => n.id !== notificationId)
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length
      const highPriorityCount = updatedNotifications.filter(n => !n.isRead && n.priority === 'HIGH').length
      const urgentCount = updatedNotifications.filter(n => !n.isRead && n.priority === 'URGENT').length

      setStats({
        totalNotifications: updatedNotifications.length,
        unreadCount,
        highPriorityCount,
        urgentCount,
      })

      console.log('✅ Notification supprimée avec succès')
      return true
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error)
      return false
    }
  }, [user?.id, notifications])

  // Supprimer plusieurs notifications
  const deleteNotifications = useCallback(async (notificationIds: string[]): Promise<number> => {
    if (!user?.id || notificationIds.length === 0) return 0

    try {
      const response = await fetch('/api/notifications/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erreur suppression en lot:', errorData.error)
        return 0
      }

      const data = await response.json()
      
      // Mettre à jour l'état local
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)))
      
      // Recalculer les stats
      const updatedNotifications = notifications.filter(n => !notificationIds.includes(n.id))
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length
      const highPriorityCount = updatedNotifications.filter(n => !n.isRead && n.priority === 'HIGH').length
      const urgentCount = updatedNotifications.filter(n => !n.isRead && n.priority === 'URGENT').length

      setStats({
        totalNotifications: updatedNotifications.length,
        unreadCount,
        highPriorityCount,
        urgentCount,
      })

      console.log(`✅ ${data.count} notifications supprimées avec succès`)
      return data.count
    } catch (error) {
      console.error('❌ Erreur suppression en lot:', error)
      return 0
    }
  }, [user?.id, notifications])

  // Supprimer toutes les notifications
  const clearAllNotifications = useCallback(async (): Promise<number> => {
    if (!user?.id) return 0

    const allNotificationIds = notifications.map(n => n.id)
    return await deleteNotifications(allNotificationIds)
  }, [user?.id, notifications, deleteNotifications])

  return {
    notifications,
    stats,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    createNotification,
    deleteNotification,
    deleteNotifications,
    clearAllNotifications
  }
}
