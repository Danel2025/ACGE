import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { NotificationsByRole } from '@/lib/notifications-by-role'

/**
 * 🧮 API COMPTABILISATION DOSSIER - ACGE
 * 
 * Comptabilise un dossier par l'Agent Comptable
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    
    console.log('🧮 Comptabilisation dossier:', id)
    
    const body = await request.json()
    const { type, montant, reference, commentaire } = body
    
    if (!type || !['PAIEMENT', 'RECETTE'].includes(type)) {
      return NextResponse.json(
        { error: 'Type de comptabilisation requis (PAIEMENT ou RECETTE)' },
        { status: 400 }
      )
    }
    
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

    // Vérifier que le dossier est ordonnançé
    if (dossier.statut !== 'VALIDÉ_ORDONNATEUR') {
      return NextResponse.json(
        { error: 'Seuls les dossiers ordonnançés peuvent être comptabilisés' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut du dossier
    const { data: updatedDossier, error: updateError } = await admin
      .from('dossiers')
      .update({
        statut: 'COMPTABILISÉ',
        comptabilisationType: type,
        montantComptabilise: montant ? parseFloat(montant) : null,
        referenceComptabilisation: reference?.trim() || null,
        comptabilisationComment: commentaire?.trim() || null,
        comptabilizedAt: new Date().toISOString(),
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
      console.error('❌ Erreur comptabilisation dossier:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la comptabilisation' },
        { status: 500 }
      )
    }

    console.log('🧮 Dossier comptabilisé avec succès:', updatedDossier.numeroDossier)
    
    // 🔔 NOTIFICATIONS INTELLIGENTES PAR RÔLE
    try {
      // Notifier la secrétaire
      if (dossier.secretaire?.id) {
        await NotificationsByRole.notifySecretaire({
          userId: dossier.secretaire.id,
          dossierId: dossier.id,
          numeroDossier: dossier.numeroDossier,
          action: 'dossier_comptabilized'
        })
        console.log('🔔 Notification envoyée à la secrétaire')
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
          action: 'dossier_comptabilized'
        })
        console.log('🔔 Notification envoyée à l\'agent comptable')
      }

    } catch (notificationError) {
      console.warn('⚠️ Erreur envoi notifications:', notificationError)
      // Ne pas faire échouer la comptabilisation pour une erreur de notification
    }
    
    return NextResponse.json({ 
      success: true,
      dossier: updatedDossier,
      message: 'Dossier comptabilisé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur lors de la comptabilisation du dossier:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la comptabilisation du dossier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
