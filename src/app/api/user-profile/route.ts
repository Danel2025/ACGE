import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  
  try {
    console.log('🔍 User profile - Début')
    
    // Pour l'instant, retourner un utilisateur de test
    // En production, vous vérifieriez le token d'authentification
    
    const admin = getSupabaseAdmin()
    const { data: testUser, error } = await admin
      .from('users')
      .select('id, name, email, role, created_at')
      .limit(1)
      .maybeSingle()
    
    if (error) {
      console.error('Erreur récupération utilisateur:', error)
      // Essayer avec un nom de colonne différent
      const { data: testUserAlt } = await admin
        .from('users')
        .select('id, name, email, role')
        .limit(1)
        .maybeSingle()
      
      if (testUserAlt) {
        return NextResponse.json({
          success: true,
          user: testUserAlt,
          message: 'Profil utilisateur récupéré',
          timestamp: new Date().toISOString()
        })
      }
    }
    
    if (testUser) {
      return NextResponse.json({
        success: true,
        user: testUser,
        message: 'Profil utilisateur récupéré',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Aucun utilisateur trouvé',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }
    
  } catch (error: any) {
    console.error('❌ Erreur user profile:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
