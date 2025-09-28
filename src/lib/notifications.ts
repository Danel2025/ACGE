import { getSupabaseAdmin } from './supabase-server'

export interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'VALIDATION' | 'REJECTION' | 'APPROVAL' | 'SYSTEM'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  expiresAt?: string
}

/**
 * 🔔 Service de notifications centralisé
 * 
 * Crée une notification pour un utilisateur avec gestion d'erreur gracieuse
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    // Essayer d'obtenir l'admin, mais ne pas faire échouer si indisponible
    let admin
    try {
      admin = getSupabaseAdmin()
    } catch (error) {
      console.warn('⚠️ Service Supabase admin indisponible pour les notifications:', error instanceof Error ? error.message : 'Erreur inconnue')
      return false
    }
    
    if (!admin) {
      console.warn('⚠️ Service Supabase indisponible pour les notifications')
      return false
    }

    // Vérifier si la table notifications existe en tentant une requête simple
    const { data: testData, error: tableCheckError } = await admin
      .from('notifications')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      if (tableCheckError.code === 'PGRST116') {
        console.warn('⚠️ Table notifications non trouvée, notification ignorée')
        return false
      } else {
        console.warn('⚠️ Erreur lors de la vérification de la table notifications:', tableCheckError.message)
        return false
      }
    }

    // Créer la notification avec retry automatique
    let retries = 3
    while (retries > 0) {
      try {
        const { error: insertError } = await admin
          .from('notifications')
          .insert({
            user_id: params.userId,
            title: params.title,
            message: params.message,
            type: params.type || 'INFO',
            priority: params.priority || 'MEDIUM',
            action_url: params.actionUrl,
            action_label: params.actionLabel,
            metadata: params.metadata,
            expires_at: params.expiresAt
          })

        if (insertError) {
          if (retries > 1) {
            console.warn(`⚠️ Tentative ${4-retries} échouée, retry...`, insertError.message)
            retries--
            await new Promise(resolve => setTimeout(resolve, 1000)) // Attendre 1s
            continue
          }
          console.error('❌ Erreur création notification après retries:', insertError)
          return false
        }

        console.log(`🔔 Notification créée pour l'utilisateur ${params.userId}: ${params.title}`)
        return true
      } catch (error) {
        if (retries > 1) {
          console.warn(`⚠️ Erreur réseau, retry... (${4-retries}/3)`)
          retries--
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        console.error('❌ Erreur critique création notification:', error)
        return false
      }
    }
    return false

  } catch (error) {
    console.error('❌ Erreur service notifications:', error)
    return false
  }
}

/**
 * 📤 Notification de soumission de dossier
 */
export async function notifyDossierSubmission(dossier: any, secretaire: any): Promise<boolean> {
  if (!dossier || !secretaire) return false

  return await createNotification({
    userId: secretaire.id,
    title: 'Dossier soumis avec succès',
    message: `Votre dossier ${dossier.numeroDossier} a été soumis au Contrôleur Budgétaire pour validation.\n\nObjet: ${dossier.objetOperation}\nBénéficiaire: ${dossier.beneficiaire}`,
    type: 'SUCCESS',
    priority: 'MEDIUM',
    actionUrl: '/folders',
    actionLabel: 'Voir mes dossiers',
    metadata: {
      dossierId: dossier.id,
      numeroDossier: dossier.numeroDossier,
      submittedAt: new Date().toISOString()
    }
  })
}

/**
 * 🔔 Notification pour le CB - Nouveau dossier à valider
 */
export async function notifyCBDossierPending(dossier: any, cbUserId: string): Promise<boolean> {
  if (!dossier || !cbUserId) return false

  return await createNotification({
    userId: cbUserId,
    title: 'Nouveau dossier à valider',
    message: `Un nouveau dossier ${dossier.numeroDossier} a été soumis par ${dossier.secretaire?.name || 'la secrétaire'} et nécessite votre validation.\n\nObjet: ${dossier.objetOperation}\nBénéficiaire: ${dossier.beneficiaire}`,
    type: 'VALIDATION',
    priority: 'HIGH',
    actionUrl: '/cb-dashboard',
    actionLabel: 'Valider le dossier',
    metadata: {
      dossierId: dossier.id,
      numeroDossier: dossier.numeroDossier,
      secretaireId: dossier.secretaireId,
      submittedAt: new Date().toISOString()
    }
  })
}

/**
 * ✅ Notification de validation de dossier
 */
export async function notifyDossierValidation(dossier: any, secretaire: any): Promise<boolean> {
  if (!dossier || !secretaire) return false

  return await createNotification({
    userId: secretaire.id,
    title: 'Dossier validé par le CB',
    message: `Votre dossier ${dossier.numeroDossier} a été validé par le Contrôleur Budgétaire et peut maintenant être transmis à l'ordonnateur.\n\nObjet: ${dossier.objetOperation}\nBénéficiaire: ${dossier.beneficiaire}`,
    type: 'SUCCESS',
    priority: 'MEDIUM',
    actionUrl: '/folders',
    actionLabel: 'Voir le dossier',
    metadata: {
      dossierId: dossier.id,
      numeroDossier: dossier.numeroDossier,
      validatedAt: new Date().toISOString()
    }
  })
}

/**
 * ❌ Notification de rejet de dossier
 */
export async function notifyDossierRejection(dossier: any, secretaire: any, reason: string, details?: string): Promise<boolean> {
  if (!dossier || !secretaire || !reason) return false

  return await createNotification({
    userId: secretaire.id,
    title: 'Dossier rejeté par le CB',
    message: `Votre dossier ${dossier.numeroDossier} a été rejeté par le Contrôleur Budgétaire.\n\nMotif: ${reason}${details ? `\n\nDétails: ${details}` : ''}\n\nVous pouvez corriger et resoumettre le dossier.`,
    type: 'REJECTION',
    priority: 'HIGH',
    actionUrl: '/secretaire-rejected',
    actionLabel: 'Voir les détails',
    metadata: {
      dossierId: dossier.id,
      numeroDossier: dossier.numeroDossier,
      rejectionReason: reason,
      rejectionDetails: details,
      rejectedAt: new Date().toISOString()
    }
  })
}

/**
 * 🔄 Notification de resoumission de dossier
 */
export async function notifyDossierResubmission(dossier: any, cbUserId: string): Promise<boolean> {
  if (!dossier || !cbUserId) return false

  return await createNotification({
    userId: cbUserId,
    title: 'Dossier resoumis pour validation',
    message: `Le dossier ${dossier.numeroDossier} a été corrigé et resoumis par ${dossier.secretaire?.name || 'la secrétaire'} pour une nouvelle validation.\n\nObjet: ${dossier.objetOperation}\nBénéficiaire: ${dossier.beneficiaire}`,
    type: 'VALIDATION',
    priority: 'MEDIUM',
    actionUrl: '/cb-dashboard',
    actionLabel: 'Valider le dossier',
    metadata: {
      dossierId: dossier.id,
      numeroDossier: dossier.numeroDossier,
      resubmittedAt: new Date().toISOString()
    }
  })
}

/**
 * 📝 Notification de mise à jour de dossier
 */
export async function notifyDossierUpdate(dossier: any, cbUserId: string, secretaire: any): Promise<boolean> {
  if (!dossier || !cbUserId || !secretaire) return false

  return await createNotification({
    userId: cbUserId,
    title: 'Dossier mis à jour',
    message: `Le dossier ${dossier.numeroDossier} a été modifié par ${secretaire.name || 'la secrétaire'}.\n\nObjet: ${dossier.objetOperation}\nBénéficiaire: ${dossier.beneficiaire}`,
    type: 'WARNING',
    priority: 'MEDIUM',
    actionUrl: '/cb-dashboard',
    actionLabel: 'Voir les modifications',
    metadata: {
      dossierId: dossier.id,
      numeroDossier: dossier.numeroDossier,
      updatedAt: new Date().toISOString()
    }
  })
}