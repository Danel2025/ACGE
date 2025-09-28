import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 🗑️ API SUPPRESSION EN LOT NOTIFICATIONS - ACGE
 * 
 * Supprime plusieurs notifications en une seule fois
 */
export async function POST(request: NextRequest) {
  try {
    const { notificationIds } = await request.json()
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID manquant' },
        { status: 400 }
      )
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste des IDs de notifications manquante' },
        { status: 400 }
      )
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables d\'environnement manquantes pour Supabase Admin')
      return NextResponse.json(
        { error: 'Configuration du service de base de données manquante' },
        { status: 503 }
      )
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Vérifier que toutes les notifications appartiennent à l'utilisateur
    const { data: notifications, error: fetchError } = await admin
      .from('notifications')
      .select('id, user_id')
      .in('id', notificationIds)
      .eq('user_id', userId)

    if (fetchError) {
      console.error('❌ Erreur vérification notifications:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json(
        { error: 'Aucune notification trouvée ou non autorisée' },
        { status: 404 }
      )
    }

    // Supprimer les notifications
    const { error: deleteError } = await admin
      .from('notifications')
      .delete()
      .in('id', notificationIds)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('❌ Erreur Supabase lors de la suppression en lot:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log(`✅ ${notifications.length} notifications supprimées avec succès`)
    
    return NextResponse.json({ 
      success: true, 
      count: notifications.length,
      message: `${notifications.length} notification(s) supprimée(s) avec succès` 
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur inattendue dans l\'API bulk delete notifications:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
