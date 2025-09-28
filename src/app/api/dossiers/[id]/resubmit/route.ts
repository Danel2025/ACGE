import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { notifyDossierResubmission } from '@/lib/notifications'
import { verify } from 'jsonwebtoken'

/**
 * 🔄 API RESOUMISSION DOSSIER - ACGE
 * 
 * Permet à une secrétaire de resoumettre un dossier rejeté
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔄 Resoumission du dossier:', id)
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Récupérer l'utilisateur connecté
    let userData = null
    const authToken = request.cookies.get('auth-token')?.value
    
    if (authToken) {
      try {
        const decoded = verify(authToken, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
        const userId = decoded.userId
        
        const { data: user, error: userError } = await admin
          .from('users')
          .select('id, name, email, role, createdAt, updatedAt')
          .eq('id', userId)
          .single()

        if (!userError && user) {
          userData = user
        }
      } catch (jwtError) {
        console.log('⚠️ JWT cookie invalide:', jwtError)
      }
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est une secrétaire
    if (userData.role !== 'SECRETAIRE') {
      return NextResponse.json(
        { error: 'Accès refusé: rôle secrétaire requis' },
        { status: 403 }
      )
    }

    // Récupérer le dossier existant
    const { data: existingDossier, error: fetchError } = await admin
      .from('dossiers')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le dossier appartient à la secrétaire
    if (existingDossier.secretaireId !== userData.id) {
      return NextResponse.json(
        { error: 'Accès refusé: ce dossier ne vous appartient pas' },
        { status: 403 }
      )
    }

    // Vérifier que le dossier est rejeté
    if (existingDossier.statut !== 'REJETÉ_CB') {
      return NextResponse.json(
        { error: 'Seuls les dossiers rejetés peuvent être resoumis' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut du dossier pour le remettre en attente
    const { data: updatedDossier, error: updateError } = await admin
      .from('dossiers')
      .update({
        statut: 'EN_ATTENTE',
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        posteComptable:posteComptableId(*),
        natureDocument:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .single()

    if (updateError) {
      console.error('❌ Erreur resoumission dossier:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la resoumission' },
        { status: 500 }
      )
    }

    console.log('✅ Dossier resoumis avec succès:', updatedDossier.numeroDossier)
    
    // 🔔 NOTIFICATION INTELLIGENTE : Informer le CB
    try {
      const cbUserId = 'cmebotahv0000c17w3izkh2k9' // ID par défaut - à remplacer par la logique de rôles
      await notifyDossierResubmission(updatedDossier, cbUserId)
      console.log('🔔 Notification de resoumission envoyée au CB')
    } catch (notificationError) {
      console.warn('⚠️ Erreur envoi notification:', notificationError)
      // Ne pas faire échouer la resoumission pour une erreur de notification
    }
    
    return NextResponse.json({ 
      success: true,
      dossier: updatedDossier,
      message: 'Dossier resoumis avec succès pour validation par le contrôleur budgétaire'
    })

  } catch (error) {
    console.error('❌ Erreur lors de la resoumission du dossier:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la resoumission du dossier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
