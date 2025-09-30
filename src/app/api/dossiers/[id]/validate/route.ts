import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { NotificationsByRole } from '@/lib/notifications-by-role'
import { CacheRevalidation } from '@/lib/revalidation-utils'
import { verify } from 'jsonwebtoken'

/**
 * ✅ API VALIDATION DOSSIER CB - ACGE
 *
 * Valide un dossier par le Contrôleur Budgétaire
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

    console.log('✅ Validation dossier CB:', id)
    console.log('🔍 Debug: Route de validation mise à jour avec logs détaillés')

    const admin = getSupabaseAdmin()

    if (!admin) {
      console.error('❌ Service de base de données indisponible')
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

      // Vérifier que l'utilisateur est un CB
      if (userRole !== 'CONTROLEUR_BUDGETAIRE' && userRole !== 'ADMIN') {
        console.error('❌ Rôle non autorisé:', userRole)
        return NextResponse.json(
          { error: 'Seuls les contrôleurs budgétaires peuvent valider des dossiers' },
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

    // Récupérer le dossier avec les informations essentielles
    console.log('🔍 Recherche du dossier:', id)
    const { data: dossier, error: fetchError } = await admin
      .from('dossiers')
      .select('*')
      .eq('id', id)
      .single()

    console.log('🔍 Résultat recherche dossier:', {
      dossier: dossier ? { id: dossier.id, numeroDossier: dossier.numeroDossier, statut: dossier.statut } : null,
      fetchError
    })

    if (fetchError) {
      console.error('❌ Dossier non trouvé:', fetchError)
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le dossier est en attente
    console.log('🔍 Vérification statut dossier:', dossier.statut)
    if (dossier.statut !== 'EN_ATTENTE') {
      console.error('❌ Dossier pas en attente:', {
        statut: dossier.statut,
        numeroDossier: dossier.numeroDossier,
        expected: 'EN_ATTENTE'
      })
      return NextResponse.json(
        { error: 'Seuls les dossiers en attente peuvent être validés' },
        { status: 400 }
      )
    }

    // Utiliser l'API de validation-status pour une vérification robuste
    console.log('🔍 Vérification du statut de validation via API interne pour dossier:', id)

    try {
      const validationStatusResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/dossiers/${id}/validation-status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      let canValidate = false
      let statusDetails = null

      if (validationStatusResponse.ok) {
        const statusData = await validationStatusResponse.json()
        console.log('🔍 Statut de validation reçu:', statusData)

        if (statusData.success && statusData.status) {
          canValidate = statusData.status.canValidate
          statusDetails = statusData.status
        }
      } else {
        console.log('⚠️ API validation-status non disponible, fallback vers vérification directe')

        // Fallback vers vérification directe
        const { data: validationTypeOperation, error: validationTypeError } = await admin
          .from('validations_cb')
          .select('id')
          .eq('dossier_id', id)
          .limit(1)

        const { data: validationsControlesFond, error: validationsControlesError } = await admin
          .from('validations_controles_fond')
          .select('id, valide')
          .eq('dossier_id', id)

        const hasOperationTypeValidation = !validationTypeError && validationTypeOperation && validationTypeOperation.length > 0
        const hasControlesFondValidation = !validationsControlesError && validationsControlesFond && validationsControlesFond.length > 0
        const tousControlesValides = validationsControlesFond?.every(v => v.valide) || false

        canValidate = hasOperationTypeValidation && hasControlesFondValidation && tousControlesValides

        statusDetails = {
          hasOperationTypeValidation,
          hasControlesFondValidation,
          canValidate,
          allControlsValid: tousControlesValides,
          operationTypeCount: validationTypeOperation?.length || 0,
          controlesFondCount: validationsControlesFond?.length || 0
        }
      }

      console.log('🔍 Résultat final de validation:', { canValidate, statusDetails })

      if (!canValidate) {
        console.error('❌ Le dossier ne peut pas être validé:', statusDetails)
        return NextResponse.json(
          {
            error: 'Le dossier ne peut pas être validé - validations incomplètes',
            details: statusDetails
          },
          { status: 400 }
        )
      }

      console.log('✅ Toutes les validations sont complètes, procéder à la validation du dossier')

    } catch (error) {
      console.error('❌ Erreur lors de la vérification des validations:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des validations préalables' },
        { status: 500 }
      )
    }

    // Mettre à jour le statut du dossier
    console.log('🔍 Mise à jour du statut vers VALIDÉ_CB pour dossier:', id)
    const { data: updatedDossier, error: updateError } = await admin
      .from('dossiers')
      .update({
        statut: 'VALIDÉ_CB',
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    console.log('🔍 Résultat mise à jour:', {
      updatedDossier: updatedDossier ? { id: updatedDossier.id, numeroDossier: updatedDossier.numeroDossier, statut: updatedDossier.statut } : null,
      updateError
    })

    if (updateError) {
      console.error('❌ Erreur validation dossier:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la validation' },
        { status: 500 }
      )
    }

    console.log('✅ Dossier validé avec succès:', updatedDossier.numeroDossier)

    // 🔄 REVALIDATION DU CACHE
    try {
      await CacheRevalidation.revalidateValidationCB(id)
      console.log('🔄 Cache invalidé après validation CB')
    } catch (revalidateError) {
      console.warn('⚠️ Erreur revalidation cache:', revalidateError)
    }

    // 🔔 NOTIFICATIONS INTELLIGENTES PAR RÔLE
    try {
      // Notifier la secrétaire
      if (dossier.secretaireId) {
        await NotificationsByRole.notifySecretaire({
          userId: dossier.secretaireId,
          dossierId: dossier.id,
          numeroDossier: dossier.numeroDossier,
          action: 'dossier_validated'
        })
        console.log('🔔 Notification envoyée à la secrétaire')
      }

      // Notifier le CB
      const { data: cbUsers } = await admin
        .from('users')
        .select('id')
        .eq('role', 'CONTROLEUR_BUDGETAIRE')
        .limit(1)

      if (cbUsers && cbUsers.length > 0) {
        await NotificationsByRole.notifyCB({
          userId: cbUsers[0].id,
          dossierId: dossier.id,
          numeroDossier: dossier.numeroDossier,
          action: 'dossier_validated'
        })
        console.log('🔔 Notification envoyée au CB')
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
          action: 'dossier_pending'
        })
        console.log('🔔 Notification envoyée à l\'ordonnateur')
      }

    } catch (notificationError) {
      console.warn('⚠️ Erreur envoi notifications:', notificationError)
      // Ne pas faire échouer la validation pour une erreur de notification
    }

    return NextResponse.json(
      {
        success: true,
        dossier: updatedDossier,
        message: 'Dossier validé avec succès'
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate'
        }
      }
    )

  } catch (error) {
    console.error('❌ Erreur lors de la validation du dossier:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la validation du dossier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}