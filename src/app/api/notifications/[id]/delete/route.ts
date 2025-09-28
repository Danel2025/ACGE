import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 🗑️ API SUPPRESSION NOTIFICATION - ACGE
 * 
 * Supprime une notification spécifique
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const notificationId = resolvedParams.id
    
    console.log('🗑️ Suppression notification:', notificationId)
    
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID manquant' },
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

    // Vérifier que la notification appartient à l'utilisateur
    const { data: notification, error: fetchError } = await admin
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json(
        { error: 'Notification non trouvée ou non autorisée' },
        { status: 404 }
      )
    }

    // Supprimer la notification
    const { error: deleteError } = await admin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('❌ Erreur Supabase lors de la suppression:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log('✅ Notification supprimée avec succès')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification supprimée avec succès' 
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur inattendue dans l\'API delete notification:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
