/**
 * 🚀 Optimisations de performance pour le système de notifications
 */

import { createClient } from '@supabase/supabase-js'
import { NotificationType, NotificationPriority } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Cache en mémoire pour les notifications fréquemment utilisées
const notificationCache = new Map<string, any>()
const cacheExpiry = new Map<string, number>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Batch processing pour les notifications multiples
let notificationBatch: any[] = []
let batchTimeout: NodeJS.Timeout | null = null
const BATCH_SIZE = 10
const BATCH_DELAY = 2000 // 2 secondes

/**
 * 📦 Traitement par lots des notifications
 */
export class NotificationBatch {

  /**
   * Ajouter une notification au batch
   */
  static addToBatch(notification: any) {
    notificationBatch.push(notification)

    // Si le batch est plein, traiter immédiatement
    if (notificationBatch.length >= BATCH_SIZE) {
      this.processBatch()
      return
    }

    // Sinon, programmer le traitement
    if (batchTimeout) {
      clearTimeout(batchTimeout)
    }

    batchTimeout = setTimeout(() => {
      this.processBatch()
    }, BATCH_DELAY)
  }

  /**
   * Traiter le batch de notifications
   */
  static async processBatch() {
    if (notificationBatch.length === 0) return

    const batch = [...notificationBatch]
    notificationBatch = []

    if (batchTimeout) {
      clearTimeout(batchTimeout)
      batchTimeout = null
    }

    try {
      if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('⚠️ Variables d\'environnement manquantes pour batch notifications')
        return
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      console.log(`🚀 Traitement batch de ${batch.length} notifications`)

      const { data, error } = await supabase
        .from('notifications')
        .insert(batch)
        .select()

      if (error) {
        console.error('❌ Erreur traitement batch notifications:', error)
        // Reprendre les notifications échouées individuellement
        for (const notif of batch) {
          try {
            await supabase.from('notifications').insert(notif)
          } catch (individualError) {
            console.error('❌ Erreur notification individuelle:', individualError)
          }
        }
      } else {
        console.log(`✅ Batch de ${data?.length || 0} notifications traité avec succès`)
      }

    } catch (error) {
      console.error('❌ Erreur critique batch notifications:', error)
    }
  }
}

/**
 * 🗂️ Cache intelligent pour les notifications
 */
export class NotificationCache {

  /**
   * Obtenir les notifications du cache
   */
  static get(userId: string) {
    const cacheKey = `notifications_${userId}`
    const expiry = cacheExpiry.get(cacheKey)

    if (expiry && Date.now() > expiry) {
      // Cache expiré
      this.clear(userId)
      return null
    }

    return notificationCache.get(cacheKey)
  }

  /**
   * Mettre en cache les notifications
   */
  static set(userId: string, notifications: any[]) {
    const cacheKey = `notifications_${userId}`
    notificationCache.set(cacheKey, notifications)
    cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION)

    // Nettoyer le cache périodiquement
    this.cleanupExpiredCache()
  }

  /**
   * Vider le cache pour un utilisateur
   */
  static clear(userId: string) {
    const cacheKey = `notifications_${userId}`
    notificationCache.delete(cacheKey)
    cacheExpiry.delete(cacheKey)
  }

  /**
   * Vider tout le cache
   */
  static clearAll() {
    notificationCache.clear()
    cacheExpiry.clear()
  }

  /**
   * Nettoyer le cache expiré
   */
  static cleanupExpiredCache() {
    const now = Date.now()
    for (const [key, expiry] of cacheExpiry.entries()) {
      if (now > expiry) {
        notificationCache.delete(key)
        cacheExpiry.delete(key)
      }
    }
  }
}

/**
 * 🎯 Système de priorité et de filtrage intelligent
 */
export class NotificationPriority {

  /**
   * Filtrer les notifications par priorité et importance
   */
  static filterByImportance(notifications: any[], userRole: string) {
    const roleWeights = {
      'ADMIN': 1.0,
      'SECRETAIRE': 0.8,
      'CONTROLEUR_BUDGETAIRE': 0.9,
      'ORDONNATEUR': 0.9,
      'AGENT_COMPTABLE': 0.9
    }

    const weight = roleWeights[userRole as keyof typeof roleWeights] || 0.5

    return notifications
      .map(notif => ({
        ...notif,
        importance: this.calculateImportance(notif, weight)
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 50) // Limiter à 50 notifications max
  }

  /**
   * Calculer l'importance d'une notification
   */
  static calculateImportance(notification: any, userRoleWeight: number) {
    const priorityWeights = {
      'URGENT': 1.0,
      'HIGH': 0.8,
      'MEDIUM': 0.5,
      'LOW': 0.2
    }

    const typeWeights = {
      'ERROR': 1.0,
      'WARNING': 0.8,
      'VALIDATION': 0.7,
      'REJECTION': 0.9,
      'APPROVAL': 0.6,
      'SUCCESS': 0.4,
      'INFO': 0.3,
      'SYSTEM': 0.2
    }

    const priorityWeight = priorityWeights[notification.priority] || 0.3
    const typeWeight = typeWeights[notification.type] || 0.3
    const timeWeight = this.calculateTimeWeight(notification.created_at)
    const readWeight = notification.is_read ? 0.1 : 1.0

    return (priorityWeight * 0.4 + typeWeight * 0.3 + timeWeight * 0.2 + readWeight * 0.1) * userRoleWeight
  }

  /**
   * Calculer le poids temporel
   */
  static calculateTimeWeight(createdAt: string) {
    const now = new Date().getTime()
    const created = new Date(createdAt).getTime()
    const hoursAgo = (now - created) / (1000 * 60 * 60)

    if (hoursAgo < 1) return 1.0      // Moins d'1h = poids max
    if (hoursAgo < 24) return 0.8     // Moins d'1j = poids élevé
    if (hoursAgo < 168) return 0.5    // Moins d'1 semaine = poids moyen
    return 0.2                        // Plus d'1 semaine = poids faible
  }
}

/**
 * 📊 Métriques de performance
 */
export class NotificationMetrics {
  private static metrics = {
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    batchesProcessed: 0,
    notificationsCreated: 0,
    errors: 0,
    responseTime: [] as number[]
  }

  static incrementApiCalls() {
    this.metrics.apiCalls++
  }

  static incrementCacheHits() {
    this.metrics.cacheHits++
  }

  static incrementCacheMisses() {
    this.metrics.cacheMisses++
  }

  static incrementBatchesProcessed() {
    this.metrics.batchesProcessed++
  }

  static incrementNotificationsCreated(count = 1) {
    this.metrics.notificationsCreated += count
  }

  static incrementErrors() {
    this.metrics.errors++
  }

  static addResponseTime(time: number) {
    this.metrics.responseTime.push(time)
    if (this.metrics.responseTime.length > 100) {
      this.metrics.responseTime.shift() // Garder seulement les 100 derniers
    }
  }

  static getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0

    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
      : 0

    return {
      ...this.metrics,
      avgResponseTime: Math.round(avgResponseTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    }
  }

  static resetMetrics() {
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      batchesProcessed: 0,
      notificationsCreated: 0,
      errors: 0,
      responseTime: []
    }
  }
}

/**
 * 🔄 Optimisation des connexions temps réel
 */
export class RealtimeOptimizer {
  private static channels = new Map<string, any>()
  private static heartbeatInterval: NodeJS.Timeout | null = null

  /**
   * Optimiser les connexions temps réel avec pooling
   */
  static optimizeRealtimeConnection(userId: string, supabase: any) {
    const channelKey = `user_${userId}`

    // Réutiliser la connexion existante si possible
    if (this.channels.has(channelKey)) {
      console.log('🔄 Réutilisation connexion temps réel existante')
      return this.channels.get(channelKey)
    }

    // Créer nouvelle connexion optimisée
    const channel = supabase
      .channel(`notifications_${userId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: userId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          console.log('🔔 Notification temps réel optimisée:', payload)
          // Invalider le cache pour cet utilisateur
          NotificationCache.clear(userId)
        }
      )
      .subscribe((status: string) => {
        console.log(`🔗 Statut connexion optimisée ${userId}:`, status)
      })

    this.channels.set(channelKey, channel)
    this.startHeartbeat()

    return channel
  }

  /**
   * Nettoyer les connexions inactives
   */
  static cleanupInactiveConnections() {
    // Implémenter logique de nettoyage basée sur l'activité
    console.log('🧹 Nettoyage connexions inactives...')
  }

  /**
   * Démarrer le heartbeat pour maintenir les connexions
   */
  static startHeartbeat() {
    if (this.heartbeatInterval) return

    this.heartbeatInterval = setInterval(() => {
      this.cleanupInactiveConnections()
    }, 30000) // Toutes les 30 secondes
  }

  /**
   * Arrêter le heartbeat
   */
  static stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Fermer toutes les connexions
   */
  static closeAllConnections(supabase: any) {
    for (const [key, channel] of this.channels.entries()) {
      try {
        supabase.removeChannel(channel)
        console.log(`🔌 Connexion ${key} fermée`)
      } catch (error) {
        console.warn(`⚠️ Erreur fermeture connexion ${key}:`, error)
      }
    }
    this.channels.clear()
    this.stopHeartbeat()
  }
}