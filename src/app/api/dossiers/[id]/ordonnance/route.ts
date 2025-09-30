import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { NotificationsByRole } from '@/lib/notifications-by-role'
import { CacheRevalidation } from '@/lib/revalidation-utils'
import { verify } from 'jsonwebtoken'

/**
 * 📋 API ORDONNANCEMENT DOSSIER - ACGE
 *
 * Ordonnance un dossier par l'Ordonnateur
 */

// Forcer le mode dynamique
export const dynamic = 'force-dynamic'
export const revalidate = 0
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    console.log('📋 Ordonnancement dossier:', id)

    const admin = getSupabaseAdmin()

    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // 🔐 Récupérer l'utilisateur depuis le JWT
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      console.error('❌ Cookie auth-token manquant')
      return NextResponse.json(
        { error: 'Non authentifié - Token manquant' },
        { status: 401 }
      )
    }

    let userId: string
    let userRole: string

    try {
      const decoded = verify(authToken, process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'unified-jwt-secret-for-development') as any
      userId = decoded.userId
      userRole = decoded.role

      console.log('🔐 JWT décodé:', { userId, role: userRole })

      // Vérifier que l'utilisateur est un ordonnateur
      if (userRole !== 'ORDONNATEUR' && userRole !== 'ADMIN') {
        console.error('❌ Rôle non autorisé:', userRole)
        return NextResponse.json(
          { error: 'Seuls les ordonnateurs peuvent ordonnancer des dossiers' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      console.error('❌ JWT invalide:', jwtError)
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { commentaire, montant } = body
    
    // Récupérer le dossier avec toutes les informations
    const { data: dossier, error: fetchError } = await admin
      .from('dossiers')
      .select(`
        id,
        numeroDossier,
        numeroNature,
        objetOperation,
        beneficiaire,
        statut,
        createdAt,
        updatedAt,
        posteComptableId,
        natureDocumentId,
        secretaireId,
        folderid,
        montant,
        montantordonnance,
        validatedat,
        commentaires,
        dateordonnancement
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('❌ Erreur récupération dossier:', fetchError)
      console.error('❌ Détails erreur:', JSON.stringify(fetchError, null, 2))
      return NextResponse.json(
        { error: 'Dossier non trouvé', details: fetchError },
        { status: 404 }
      )
    }

    console.log('✅ Dossier trouvé:', dossier)

    // Vérifier que le dossier est validé par CB
    if (dossier.statut !== 'VALIDÉ_CB') {
      return NextResponse.json(
        { error: 'Seuls les dossiers validés par le CB peuvent être ordonnançés' },
        { status: 400 }
      )
    }

    // 🔍 NOUVELLE VÉRIFICATION : Contrôler que toutes les vérifications ordonnateur sont validées
    const { data: syntheseVerifications, error: syntheseError } = await admin
      .from('syntheses_verifications_ordonnateur')
      .select('*')
      .eq('dossier_id', id)
      .single()
    
    if (syntheseError && syntheseError.code !== 'PGRST116') {
      console.error('❌ Erreur récupération synthèse vérifications:', syntheseError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des contrôles ordonnateur' },
        { status: 500 }
      )
    }
    
    // Vérifier que les vérifications ordonnateur ont été effectuées et sont toutes validées
    if (!syntheseVerifications) {
      return NextResponse.json(
        { 
          error: 'Les vérifications ordonnateur doivent être effectuées avant l\'ordonnancement',
          code: 'VERIFICATIONS_ORDONNATEUR_MANQUANTES'
        },
        { status: 400 }
      )
    }
    
    if (syntheseVerifications.statut !== 'VALIDÉ') {
      return NextResponse.json(
        { 
          error: 'Toutes les vérifications ordonnateur doivent être validées avant l\'ordonnancement',
          code: 'VERIFICATIONS_ORDONNATEUR_NON_VALIDEES',
          details: {
            statut: syntheseVerifications.statut,
            totalVerifications: syntheseVerifications.total_verifications,
            verificationsValidees: syntheseVerifications.verifications_validees,
            verificationsRejetees: syntheseVerifications.verifications_rejetees
          }
        },
        { status: 400 }
      )
    }
    
    console.log('✅ Vérifications ordonnateur validées:', {
      total: syntheseVerifications.total_verifications,
      validees: syntheseVerifications.verifications_validees,
      statut: syntheseVerifications.statut
    })

    // Mettre à jour le statut du dossier
    const { data: updatedDossier, error: updateError } = await admin
      .from('dossiers')
      .update({
        statut: 'VALIDÉ_ORDONNATEUR',
        commentaires: commentaire?.trim() || null,
        montantordonnance: montant ? parseFloat(montant) : null,
        dateordonnancement: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ Erreur ordonnancement dossier:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'ordonnancement' },
        { status: 500 }
      )
    }

    console.log('📋 Dossier ordonnançé avec succès:', updatedDossier.numeroDossier)

    // 🔄 REVALIDATION DU CACHE
    try {
      await CacheRevalidation.revalidateValidationOrdonnateur(id)
      console.log('🔄 Cache invalidé après ordonnancement')
    } catch (revalidateError) {
      console.warn('⚠️ Erreur revalidation cache:', revalidateError)
    }

    // 🔔 NOTIFICATIONS INTELLIGENTES PAR RÔLE
    try {
      // Notifier la secrétaire
      if (dossier.secretaire?.id) {
        await NotificationsByRole.notifySecretaire({
          userId: dossier.secretaire.id,
          dossierId: dossier.id,
          numeroDossier: dossier.numeroDossier,
          action: 'dossier_ordonnanced'
        })
        console.log('🔔 Notification envoyée à la secrétaire')
      }

      // Notifier l'ordonnateur
      const { data: ordonnateurUsers } = await admin
        .from('users')
        .select('id')
        .eq('role', 'ORDONNATEUR')
        .limit(1)

      if (ordonnateurUsers && ordonnateurUsers.length > 0) {
        await NotificationsByRole.notifyOrdonnateur({
          userId: ordonnateurUsers[0].id,
          dossierId: dossier.id,
          numeroDossier: dossier.numeroDossier,
          action: 'dossier_ordonnanced'
        })
        console.log('🔔 Notification envoyée à l\'ordonnateur')
      }

      // Notifier l'agent comptable
      const { data: acUsers } = await admin
        .from('users')
        .select('id')
        .eq('role', 'AGENT_COMPTABLE')
        .limit(1)

      if (acUsers && acUsers.length > 0) {
        await NotificationsByRole.notifyAgentComptable({
          userId: acUsers[0].id,
          dossierId: dossier.id,
          numeroDossier: dossier.numeroDossier,
          action: 'dossier_pending'
        })
        console.log('🔔 Notification envoyée à l\'agent comptable')
      }

    } catch (notificationError) {
      console.warn('⚠️ Erreur envoi notifications:', notificationError)
      // Ne pas faire échouer l'ordonnancement pour une erreur de notification
    }
    
    return NextResponse.json(
      {
        success: true,
        dossier: updatedDossier,
        message: 'Dossier ordonnançé avec succès'
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate'
        }
      }
    )

  } catch (error) {
    console.error('❌ Erreur lors de l\'ordonnancement du dossier:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'ordonnancement du dossier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}