import { createClient } from '@supabase/supabase-js'
import { NotificationType, NotificationPriority } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variables d\'environnement Supabase manquantes')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types pour les notifications par rôle
interface RoleNotificationData {
  userId: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

// Service de notifications par rôle
export class NotificationsByRole {
  
  // Notifications pour Secrétaire
  static async notifySecretaire(data: {
    userId: string
    dossierId: string
    numeroDossier: string
    action: 'dossier_created' | 'dossier_rejected' | 'dossier_validated' | 'dossier_ordonnanced' | 'dossier_comptabilized'
    details?: string
  }) {
    const notifications: RoleNotificationData[] = []

    switch (data.action) {
      case 'dossier_created':
        notifications.push({
          userId: data.userId,
          title: 'Dossier créé avec succès',
          message: `Votre dossier ${data.numeroDossier} a été créé et est en attente de validation par le Contrôleur Budgétaire.`,
          type: 'SUCCESS',
          priority: 'MEDIUM',
          actionUrl: `/folders`,
          actionLabel: 'Voir mes dossiers',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break

      case 'dossier_rejected':
        notifications.push({
          userId: data.userId,
          title: 'Dossier rejeté par le CB',
          message: `Votre dossier ${data.numeroDossier} a été rejeté par le Contrôleur Budgétaire.${data.details ? `\n\nMotif: ${data.details}` : ''}`,
          type: 'REJECTION',
          priority: 'HIGH',
          actionUrl: `/secretaire-rejected`,
          actionLabel: 'Voir les détails',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier, rejectionReason: data.details }
        })
        break

      case 'dossier_validated':
        notifications.push({
          userId: data.userId,
          title: 'Dossier validé par le CB',
          message: `Votre dossier ${data.numeroDossier} a été validé par le Contrôleur Budgétaire et est en attente d'ordonnancement.`,
          type: 'VALIDATION',
          priority: 'MEDIUM',
          actionUrl: `/folders`,
          actionLabel: 'Voir mes dossiers',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break

      case 'dossier_ordonnanced':
        notifications.push({
          userId: data.userId,
          title: 'Dossier ordonnançé',
          message: `Votre dossier ${data.numeroDossier} a été ordonnançé et est en cours de comptabilisation.`,
          type: 'APPROVAL',
          priority: 'MEDIUM',
          actionUrl: `/folders`,
          actionLabel: 'Voir mes dossiers',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break

      case 'dossier_comptabilized':
        notifications.push({
          userId: data.userId,
          title: 'Dossier comptabilisé',
          message: `Votre dossier ${data.numeroDossier} a été comptabilisé et le processus est terminé.`,
          type: 'SUCCESS',
          priority: 'MEDIUM',
          actionUrl: `/folders`,
          actionLabel: 'Voir mes dossiers',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break
    }

    return this.createNotifications(notifications)
  }

  // Notifications pour Contrôleur Budgétaire
  static async notifyCB(data: {
    userId: string
    dossierId: string
    numeroDossier: string
    action: 'dossier_pending' | 'dossier_validated' | 'dossier_rejected' | 'dossier_ordonnanced'
    details?: string
  }) {
    const notifications: RoleNotificationData[] = []

    switch (data.action) {
      case 'dossier_pending':
        notifications.push({
          userId: data.userId,
          title: 'Nouveau dossier à valider',
          message: `Un nouveau dossier ${data.numeroDossier} nécessite votre validation. Veuillez examiner les documents et valider ou rejeter le dossier.`,
          type: 'INFO',
          priority: 'HIGH',
          actionUrl: `/cb-dashboard`,
          actionLabel: 'Valider le dossier',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break

      case 'dossier_validated':
        notifications.push({
          userId: data.userId,
          title: 'Dossier validé',
          message: `Le dossier ${data.numeroDossier} a été validé avec succès et transmis à l'Ordonnateur.`,
          type: 'SUCCESS',
          priority: 'MEDIUM',
          actionUrl: `/cb-dashboard`,
          actionLabel: 'Voir le dashboard',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break

      case 'dossier_rejected':
        notifications.push({
          userId: data.userId,
          title: 'Dossier rejeté',
          message: `Le dossier ${data.numeroDossier} a été rejeté.${data.details ? `\n\nMotif: ${data.details}` : ''}`,
          type: 'WARNING',
          priority: 'MEDIUM',
          actionUrl: `/cb-dashboard`,
          actionLabel: 'Voir le dashboard',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier, rejectionReason: data.details }
        })
        break

      case 'dossier_ordonnanced':
        notifications.push({
          userId: data.userId,
          title: 'Dossier ordonnançé',
          message: `Le dossier ${data.numeroDossier} que vous avez validé a été ordonnançé par l'Ordonnateur.`,
          type: 'INFO',
          priority: 'LOW',
          actionUrl: `/cb-dashboard`,
          actionLabel: 'Voir le dashboard',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break
    }

    return this.createNotifications(notifications)
  }

  // Notifications pour Ordonnateur
  static async notifyOrdonnateur(data: {
    userId: string
    dossierId: string
    numeroDossier: string
    action: 'dossier_pending' | 'dossier_ordonnanced' | 'dossier_rejected'
    details?: string
  }) {
    const notifications: RoleNotificationData[] = []

    switch (data.action) {
      case 'dossier_pending':
        notifications.push({
          userId: data.userId,
          title: 'Dossier à ordonnancer',
          message: `Un dossier ${data.numeroDossier} validé par le CB nécessite votre ordonnancement. Veuillez examiner et ordonnancer la dépense.`,
          type: 'INFO',
          priority: 'HIGH',
          actionUrl: `/ordonnateur-dashboard`,
          actionLabel: 'Ordonnancer le dossier',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break

      case 'dossier_ordonnanced':
        notifications.push({
          userId: data.userId,
          title: 'Dossier ordonnançé',
          message: `Le dossier ${data.numeroDossier} a été ordonnançé avec succès et transmis à l'Agent Comptable.`,
          type: 'SUCCESS',
          priority: 'MEDIUM',
          actionUrl: `/ordonnateur-dashboard`,
          actionLabel: 'Voir le dashboard',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break

      case 'dossier_rejected':
        notifications.push({
          userId: data.userId,
          title: 'Dossier rejeté',
          message: `Le dossier ${data.numeroDossier} a été rejeté.${data.details ? `\n\nMotif: ${data.details}` : ''}`,
          type: 'WARNING',
          priority: 'MEDIUM',
          actionUrl: `/ordonnateur-dashboard`,
          actionLabel: 'Voir le dashboard',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier, rejectionReason: data.details }
        })
        break
    }

    return this.createNotifications(notifications)
  }

  // Notifications pour Agent Comptable
  static async notifyAgentComptable(data: {
    userId: string
    dossierId: string
    numeroDossier: string
    action: 'dossier_pending' | 'dossier_comptabilized' | 'dossier_clotured'
    details?: string
  }) {
    const notifications: RoleNotificationData[] = []

    switch (data.action) {
      case 'dossier_pending':
        notifications.push({
          userId: data.userId,
          title: 'Dossier à comptabiliser',
          message: `Un dossier ${data.numeroDossier} ordonnançé nécessite votre comptabilisation. Veuillez procéder à la comptabilisation.`,
          type: 'INFO',
          priority: 'HIGH',
          actionUrl: `/ac-dashboard`,
          actionLabel: 'Comptabiliser le dossier',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break

      case 'dossier_comptabilized':
        notifications.push({
          userId: data.userId,
          title: 'Dossier comptabilisé',
          message: `Le dossier ${data.numeroDossier} a été comptabilisé avec succès.`,
          type: 'SUCCESS',
          priority: 'MEDIUM',
          actionUrl: `/ac-dashboard`,
          actionLabel: 'Voir le dashboard',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break

      case 'dossier_clotured':
        notifications.push({
          userId: data.userId,
          title: 'Dossier clôturé',
          message: `Le dossier ${data.numeroDossier} a été clôturé et le processus est terminé.`,
          type: 'SUCCESS',
          priority: 'MEDIUM',
          actionUrl: `/ac-dashboard`,
          actionLabel: 'Voir le dashboard',
          metadata: { dossierId: data.dossierId, numeroDossier: data.numeroDossier }
        })
        break
    }

    return this.createNotifications(notifications)
  }

  // Notifications pour Admin
  static async notifyAdmin(data: {
    userId: string
    action: 'user_created' | 'user_updated' | 'user_deleted' | 'system_alert' | 'backup_completed' | 'error_occurred'
    details?: string
    metadata?: Record<string, any>
  }) {
    const notifications: RoleNotificationData[] = []

    switch (data.action) {
      case 'user_created':
        notifications.push({
          userId: data.userId,
          title: 'Nouvel utilisateur créé',
          message: `Un nouvel utilisateur a été créé dans le système.${data.details ? `\n\nDétails: ${data.details}` : ''}`,
          type: 'INFO',
          priority: 'MEDIUM',
          actionUrl: `/users`,
          actionLabel: 'Voir les utilisateurs',
          metadata: data.metadata
        })
        break

      case 'user_updated':
        notifications.push({
          userId: data.userId,
          title: 'Utilisateur modifié',
          message: `Un utilisateur a été modifié dans le système.${data.details ? `\n\nDétails: ${data.details}` : ''}`,
          type: 'INFO',
          priority: 'LOW',
          actionUrl: `/users`,
          actionLabel: 'Voir les utilisateurs',
          metadata: data.metadata
        })
        break

      case 'user_deleted':
        notifications.push({
          userId: data.userId,
          title: 'Utilisateur supprimé',
          message: `Un utilisateur a été supprimé du système.${data.details ? `\n\nDétails: ${data.details}` : ''}`,
          type: 'WARNING',
          priority: 'HIGH',
          actionUrl: `/users`,
          actionLabel: 'Voir les utilisateurs',
          metadata: data.metadata
        })
        break

      case 'system_alert':
        notifications.push({
          userId: data.userId,
          title: 'Alerte système',
          message: data.details || 'Une alerte système nécessite votre attention.',
          type: 'WARNING',
          priority: 'HIGH',
          actionUrl: `/settings`,
          actionLabel: 'Voir les paramètres',
          metadata: data.metadata
        })
        break

      case 'backup_completed':
        notifications.push({
          userId: data.userId,
          title: 'Sauvegarde terminée',
          message: `La sauvegarde du système a été effectuée avec succès.${data.details ? `\n\nDétails: ${data.details}` : ''}`,
          type: 'SUCCESS',
          priority: 'LOW',
          actionUrl: `/settings`,
          actionLabel: 'Voir les paramètres',
          metadata: data.metadata
        })
        break

      case 'error_occurred':
        notifications.push({
          userId: data.userId,
          title: 'Erreur système',
          message: `Une erreur s'est produite dans le système.${data.details ? `\n\nDétails: ${data.details}` : ''}`,
          type: 'ERROR',
          priority: 'URGENT',
          actionUrl: `/settings`,
          actionLabel: 'Voir les paramètres',
          metadata: data.metadata
        })
        break
    }

    return this.createNotifications(notifications)
  }

  // Méthode privée pour créer les notifications
  private static async createNotifications(notifications: RoleNotificationData[]) {
    if (notifications.length === 0) return []

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications.map(notif => ({
          user_id: notif.userId,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          priority: notif.priority,
          action_url: notif.actionUrl,
          action_label: notif.actionLabel,
          metadata: notif.metadata
        })))
        .select()

      if (error) {
        console.error('Erreur création notifications par rôle:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erreur création notifications par rôle:', error)
      return []
    }
  }

  // Méthode pour obtenir les utilisateurs par rôle
  static async getUsersByRole(role: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('role', role)

      if (error) {
        console.error('Erreur récupération utilisateurs par rôle:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erreur récupération utilisateurs par rôle:', error)
      return []
    }
  }

  // Méthode pour notifier tous les utilisateurs d'un rôle
  static async notifyAllUsersByRole(role: string, notificationData: Omit<RoleNotificationData, 'userId'>) {
    try {
      const users = await this.getUsersByRole(role)
      if (users.length === 0) return []

      const notifications = users.map(user => ({
        ...notificationData,
        userId: user.id
      }))

      return this.createNotifications(notifications)
    } catch (error) {
      console.error('Erreur notification tous les utilisateurs par rôle:', error)
      return []
    }
  }
}
