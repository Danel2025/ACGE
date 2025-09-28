import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API notifications-simple: Début de la requête')
    
    // Créer directement le client admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables d\'environnement manquantes')
      return NextResponse.json(
        { error: 'Configuration manquante' },
        { status: 503 }
      )
    }
    
    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // Récupérer l'utilisateur depuis les headers (optionnel pour les tests)
    const userId = request.headers.get('x-user-id')
    console.log('🔍 API notifications-simple: userId:', userId)
    
    // Si pas d'userId, retourner une liste vide pour les tests
    if (!userId) {
      console.log('ℹ️  Aucun user ID fourni - retour liste vide pour test')
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
        totalCount: 0,
        message: 'Aucune notification sans authentification'
      })
    }
    
    // Récupérer les notifications avec l'admin (contourne RLS)
    console.log('🔍 API notifications-simple: Récupération des notifications...')
    const { data: notifications, error } = await admin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('is_read', { ascending: true }) // Non lues en premier
      .order('created_at', { ascending: false }) // Puis par date décroissante
      .limit(50)
    
    console.log('🔍 API notifications-simple: Résultat requête:', { 
      notificationsCount: notifications?.length || 0, 
      error: error?.message || 'Aucune erreur' 
    })
    
    if (error) {
      console.error('❌ Erreur récupération notifications:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des notifications' },
        { status: 500 }
      )
    }
    
    // Calculer les statistiques
    const unreadCount = notifications?.filter(n => !n.is_read).length || 0
    const highPriorityCount = notifications?.filter(n => !n.is_read && n.priority === 'HIGH').length || 0
    const urgentCount = notifications?.filter(n => !n.is_read && n.priority === 'URGENT').length || 0
    
    console.log('🔍 API notifications-simple: Stats calculées:', {
      totalNotifications: notifications?.length || 0,
      unreadCount,
      highPriorityCount,
      urgentCount
    })
    
    return NextResponse.json({
      notifications: notifications || [],
      stats: {
        totalNotifications: notifications?.length || 0,
        unreadCount,
        highPriorityCount,
        urgentCount
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur API notifications-simple:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
