import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * 🔄 UTILITAIRE CENTRALISÉ DE REVALIDATION - ACGE
 *
 * Gère l'invalidation intelligente du cache Next.js après les mutations
 * de données pour garantir la fraîcheur des informations affichées.
 */
export class CacheRevalidation {
  /**
   * Invalider tous les caches liés aux dossiers
   *
   * @param options.dossierId - ID du dossier à revalider (optionnel)
   * @param options.role - Rôle concerné par la revalidation (cb, ordonnateur, ac, all)
   */
  static async revalidateDossiers(options?: {
    dossierId?: string
    role?: 'cb' | 'ordonnateur' | 'ac' | 'secretaire' | 'all'
  }) {
    try {
      const { dossierId, role = 'all' } = options || {}

      console.log('🔄 Début revalidation cache:', { dossierId, role })

      // Tags généraux
      revalidateTag('dossiers')

      // Tag spécifique au dossier
      if (dossierId) {
        revalidateTag(`dossier-${dossierId}`)
        revalidatePath(`/api/dossiers/${dossierId}`)
        revalidatePath(`/dossiers/${dossierId}`)
      }

      // Revalidation par rôle
      if (role === 'secretaire' || role === 'all') {
        revalidatePath('/dashboard')
        revalidatePath('/api/dossiers')
        revalidatePath('/api/dossiers/secretaire')
        revalidatePath('/api/dossiers/secretaire-rejected')
        revalidateTag('dossiers-secretaire')
      }

      if (role === 'cb' || role === 'all') {
        revalidatePath('/cb-dashboard')
        revalidatePath('/api/dossiers/cb-all')
        revalidatePath('/api/dossiers/cb-pending')
        revalidateTag('dossiers-cb')
      }

      if (role === 'ordonnateur' || role === 'all') {
        revalidatePath('/ordonnateur-dashboard')
        revalidatePath('/api/dossiers/ordonnateur-all')
        revalidatePath('/api/dossiers/ordonnateur-pending')
        revalidateTag('dossiers-ordonnateur')
      }

      if (role === 'ac' || role === 'all') {
        revalidatePath('/ac-dashboard')
        revalidatePath('/api/dossiers/ac-all')
        revalidatePath('/api/dossiers/ac-pending')
        revalidateTag('dossiers-ac')
      }

      console.log('✅ Cache revalidé avec succès', { dossierId, role })
      return { success: true }
    } catch (error) {
      console.error('❌ Erreur lors de la revalidation du cache:', error)
      return { success: false, error }
    }
  }

  /**
   * Invalider le cache après soumission d'un dossier par le Secrétaire
   */
  static async revalidateSubmission(dossierId: string) {
    console.log('🔄 Revalidation après soumission:', dossierId)
    return this.revalidateDossiers({
      dossierId,
      role: 'cb' // Le CB doit voir le nouveau dossier
    })
  }

  /**
   * Invalider le cache après validation/rejet CB
   */
  static async revalidateValidationCB(dossierId: string) {
    console.log('🔄 Revalidation après validation CB:', dossierId)
    return this.revalidateDossiers({
      dossierId,
      role: 'ordonnateur' // L'Ordonnateur doit voir le dossier validé
    })
  }

  /**
   * Invalider le cache après validation/rejet Ordonnateur
   */
  static async revalidateValidationOrdonnateur(dossierId: string) {
    console.log('🔄 Revalidation après validation Ordonnateur:', dossierId)
    return this.revalidateDossiers({
      dossierId,
      role: 'ac' // L'AC doit voir le dossier validé
    })
  }

  /**
   * Invalider le cache après validation définitive AC
   */
  static async revalidateValidationDefinitive(dossierId: string) {
    console.log('🔄 Revalidation après validation définitive:', dossierId)
    return this.revalidateDossiers({
      dossierId,
      role: 'all' // Tout le monde doit voir le changement
    })
  }

  /**
   * Invalider le cache après génération du quitus
   */
  static async revalidateQuitus(dossierId: string) {
    console.log('🔄 Revalidation après génération quitus:', dossierId)
    return this.revalidateDossiers({
      dossierId,
      role: 'all'
    })
  }

  /**
   * Invalider le cache après clôture d'un dossier
   */
  static async revalidateCloture(dossierId: string) {
    console.log('🔄 Revalidation après clôture:', dossierId)
    return this.revalidateDossiers({
      dossierId,
      role: 'all'
    })
  }

  /**
   * Invalider le cache après resoumission d'un dossier rejeté
   */
  static async revalidateResubmission(dossierId: string) {
    console.log('🔄 Revalidation après resoumission:', dossierId)
    return this.revalidateDossiers({
      dossierId,
      role: 'cb' // Le CB doit voir le dossier resoumis
    })
  }

  /**
   * Invalider le cache pour les documents
   */
  static async revalidateDocuments(dossierId?: string) {
    try {
      console.log('🔄 Revalidation documents:', dossierId)

      revalidatePath('/documents')
      revalidatePath('/api/documents')
      revalidateTag('documents')

      if (dossierId) {
        revalidatePath(`/api/dossiers/${dossierId}/documents`)
        revalidateTag(`documents-${dossierId}`)
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Erreur revalidation documents:', error)
      return { success: false, error }
    }
  }

  /**
   * Invalider le cache pour les notifications
   */
  static async revalidateNotifications() {
    try {
      console.log('🔄 Revalidation notifications')

      revalidatePath('/notifications')
      revalidatePath('/api/notifications')
      revalidatePath('/api/notifications-simple')
      revalidateTag('notifications')

      return { success: true }
    } catch (error) {
      console.error('❌ Erreur revalidation notifications:', error)
      return { success: false, error }
    }
  }

  /**
   * Forcer la revalidation complète de toute l'application
   * À utiliser avec précaution (coûteux en performance)
   */
  static async revalidateAll() {
    try {
      console.log('🔄 REVALIDATION COMPLÈTE DE L\'APPLICATION')

      // Dashboards
      revalidatePath('/dashboard')
      revalidatePath('/cb-dashboard')
      revalidatePath('/ordonnateur-dashboard')
      revalidatePath('/ac-dashboard')

      // API routes principales
      revalidatePath('/api/dossiers')
      revalidatePath('/api/documents')
      revalidatePath('/api/notifications')

      // Tags globaux
      revalidateTag('dossiers')
      revalidateTag('documents')
      revalidateTag('notifications')

      console.log('✅ Revalidation complète terminée')
      return { success: true }
    } catch (error) {
      console.error('❌ Erreur revalidation complète:', error)
      return { success: false, error }
    }
  }
}

/**
 * Helper pour logger les revalidations en développement
 */
export function logRevalidation(action: string, details?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 [REVALIDATION] ${action}`, details || '')
  }
}