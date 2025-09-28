import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔍 Vérifier le statut de l'utilisateur admin dans les deux tables
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 ===== VÉRIFICATION STATUT ADMIN =====')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    const adminEmail = 'admin@acge-gabon.com'

    // Étape 1: Vérifier dans public.users
    console.log('🔍 Vérification dans public.users...')
    const { data: publicUser, error: publicError } = await admin
      .from('users')
      .select('id, email, name, role, createdAt, updatedAt')
      .eq('email', adminEmail)
      .single()

    // Étape 2: Vérifier dans Supabase Auth
    console.log('🔍 Vérification dans Supabase Auth...')
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers()
    
    let authUser = null
    if (!authError && authUsers) {
      authUser = authUsers.users.find(u => u.email === adminEmail)
    }

    const status = {
      publicUsers: {
        exists: !!publicUser,
        data: publicUser,
        error: publicError?.message
      },
      supabaseAuth: {
        exists: !!authUser,
        data: authUser ? {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          user_metadata: authUser.user_metadata
        } : null,
        error: authError?.message
      },
      synchronization: {
        bothExist: !!(publicUser && authUser),
        emailsMatch: publicUser && authUser ? publicUser.email === authUser.email : false,
        idsMatch: publicUser && authUser ? publicUser.id === authUser.id : false
      }
    }

    console.log('📊 Statut admin:', {
      publicUsers: status.publicUsers.exists,
      supabaseAuth: status.supabaseAuth.exists,
      synchronized: status.synchronization.bothExist && status.synchronization.emailsMatch
    })

    return NextResponse.json({
      success: true,
      message: 'Statut admin récupéré avec succès',
      status
    })

  } catch (error) {
    console.error('💥 Erreur vérification statut admin:', error)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
