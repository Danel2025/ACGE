import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { NotificationsByRole } from '@/lib/notifications-by-role'

/**
 * 🔒 API CLÔTURE DOSSIER - ACGE
 * 
 * Clôture un dossier par l'Agent Comptable
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    
    console.log('🔒 Clôture dossier:', id)
    
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

    // Vérifier que le dossier est comptabilisé
    if (dossier.statut !== 'COMPTABILISÉ') {
      return NextResponse.json(
        { error: 'Seuls les dossiers comptabilisés peuvent être clôturés' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut du dossier
    const { data: updatedDossier, error: updateError } = await admin
      .from('dossiers')
      .update({
        statut: 'CLÔTURÉ',
        clotureComment: commentaire?.trim() || null,
        cloturedAt: new Date().toISOString(),
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
      console.error('❌ Erreur clôture dossier:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la clôture' },
        { status: 500 }
      )
    }

    console.log('🔒 Dossier clôturé avec succès:', updatedDossier.numeroDossier)
    
    // 🔔 NOTIFICATIONS INTELLIGENTES PAR RÔLE
    try {
      // Notifier la secrétaire
      if (dossier.secretaire?.id) {
        await NotificationsByRole.notifySecretaire({
          userId: dossier.secretaire.id,
          dossierId: dossier.id,
          numeroDossier: dossier.numeroDossier,
          action: 'dossier_comptabilized' // Utiliser le même type pour la clôture
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
          action: 'dossier_clotured'
        })
        console.log('🔔 Notification envoyée à l\'agent comptable')
      }

      // Notifier l'admin pour suivi
      const { data: adminUsers } = await admin
        .from('users')
        .select('id')
        .eq('role', 'ADMIN')
        .limit(1)

      if (adminUsers && adminUsers.length > 0) {
        await NotificationsByRole.notifyAdmin({
          userId: adminUsers[0].id,
          action: 'system_alert',
          details: `Dossier ${dossier.numeroDossier} clôturé avec succès`,
          metadata: {
            dossierId: dossier.id,
            numeroDossier: dossier.numeroDossier,
            cloturedAt: new Date().toISOString()
          }
        })
        console.log('🔔 Notification envoyée à l\'admin')
      }

    } catch (notificationError) {
      console.warn('⚠️ Erreur envoi notifications:', notificationError)
      // Ne pas faire échouer la clôture pour une erreur de notification
    }
    
    return NextResponse.json({ 
      success: true,
      dossier: updatedDossier,
      message: 'Dossier clôturé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur lors de la clôture du dossier:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la clôture du dossier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
