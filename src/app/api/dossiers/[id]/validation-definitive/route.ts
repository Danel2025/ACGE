import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { NotificationsByRole } from '@/lib/notifications-by-role'
import { CacheRevalidation } from '@/lib/revalidation-utils'

/**
 * 🔒 API VALIDATION DÉFINITIVE - ACGE
 *
 * Validation définitive d'un dossier par l'Agent Comptable
 * après vérification du rapport de vérification
 */

// Forcer le mode dynamique (pas de cache statique)
export const dynamic = 'force-dynamic'
export const revalidate = 0
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    
    console.log('🔒 Validation définitive dossier:', id)
    
    const body = await request.json()
    const { commentaire } = body
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer le dossier avec toutes les informations
    const { data: dossier, error: fetchError } = await admin
      .from('dossiers')
      .select(`
        *,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le dossier est validé par l'Ordonnateur
    if (dossier.statut !== 'VALIDÉ_ORDONNATEUR') {
      return NextResponse.json(
        { error: 'Seuls les dossiers validés par l\'Ordonnateur peuvent être validés définitivement' },
        { status: 400 }
      )
    }

    // Vérifier que les vérifications ordonnateur sont complètes
    const { data: syntheseOrdonnateur, error: syntheseError } = await admin
      .from('syntheses_verifications_ordonnateur')
      .select('*')
      .eq('dossier_id', id)
      .maybeSingle()

    if (syntheseError) {
      console.error('❌ Erreur lors de la récupération de la synthèse ordonnateur:', syntheseError)
      return NextResponse.json(
        {
          error: 'Erreur lors de la vérification des validations ordonnateur',
          details: syntheseError.message || 'Erreur inconnue'
        },
        { status: 500 }
      )
    }

    if (!syntheseOrdonnateur) {
      console.error('❌ Synthèse ordonnateur manquante pour le dossier:', id)
      return NextResponse.json(
        {
          error: 'Les vérifications ordonnateur doivent être effectuées avant la validation définitive',
          details: 'Aucune synthèse de vérifications trouvée pour ce dossier'
        },
        { status: 400 }
      )
    }

    if (syntheseOrdonnateur.statut !== 'VALIDÉ') {
      console.error('❌ Synthèse ordonnateur non validée:', syntheseOrdonnateur.statut)
      return NextResponse.json(
        {
          error: `Les vérifications ordonnateur doivent être toutes validées (statut actuel: ${syntheseOrdonnateur.statut})`,
          details: `${syntheseOrdonnateur.verifications_rejetees || 0} vérification(s) rejetée(s) sur ${syntheseOrdonnateur.total_verifications || 0}`
        },
        { status: 400 }
      )
    }

    // Mettre à jour le statut du dossier
    const { data: updatedDossier, error: updateError } = await admin
      .from('dossiers')
      .update({
        statut: 'VALIDÉ_DÉFINITIVEMENT',
        validationDefinitiveComment: commentaire?.trim() || null,
        validatedDefinitivelyAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .single()

    if (updateError) {
      console.error('❌ Erreur validation définitive dossier:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la validation définitive' },
        { status: 500 }
      )
    }

    console.log('🔒 Dossier validé définitivement avec succès:', updatedDossier.numeroDossier)

    // 🔄 REVALIDATION DU CACHE - Invalider les caches concernés
    try {
      await CacheRevalidation.revalidateValidationDefinitive(id)
      console.log('🔄 Cache Next.js invalidé après validation définitive')
    } catch (revalidateError) {
      console.warn('⚠️ Erreur lors de la revalidation du cache:', revalidateError)
      // Ne pas faire échouer la validation pour un problème de cache
    }

    // 🔔 NOTIFICATIONS INTELLIGENTES PAR RÔLE
    try {
      const notificationService = new NotificationsByRole()

      await notificationService.notifyValidationDefinitive({
        dossierId: updatedDossier.id,
        numeroDossier: updatedDossier.numeroDossier,
        objetOperation: updatedDossier.objetOperation,
        beneficiaire: updatedDossier.beneficiaire,
        posteComptable: updatedDossier.poste_comptable?.intitule || 'Non défini',
        montant: updatedDossier.montantOrdonnance || 0,
        commentaire: commentaire?.trim() || null,
        validatedAt: updatedDossier.validatedDefinitivelyAt
      })

      console.log('🔔 Notifications de validation définitive envoyées')
    } catch (notificationError) {
      console.warn('⚠️ Erreur notifications validation définitive:', notificationError)
      // Ne pas faire échouer la validation pour un problème de notification
    }

    return NextResponse.json(
      {
        success: true,
        message: `Dossier ${updatedDossier.numeroDossier} validé définitivement avec succès`,
        dossier: updatedDossier
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate'
        }
      }
    )

  } catch (error) {
    console.error('❌ Erreur validation définitive:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
