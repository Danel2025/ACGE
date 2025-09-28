import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🧪 Tester la connexion admin avec le nouveau mot de passe
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 ===== TEST CONNEXION ADMIN =====')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    const adminEmail = 'admin@acge-gabon.com'
    const testPassword = 'Admin2025!'

    // Tester la connexion avec Supabase Auth
    console.log('🔐 Test de connexion avec Supabase Auth...')
    const { data: authData, error: authError } = await admin.auth.signInWithPassword({
      email: adminEmail,
      password: testPassword
    })

    if (authError) {
      console.error('❌ Erreur connexion Supabase Auth:', authError)
      return NextResponse.json({
        success: false,
        message: 'Échec de la connexion',
        error: authError.message,
        details: {
          email: adminEmail,
          passwordProvided: !!testPassword,
          passwordLength: testPassword.length
        }
      })
    }

    console.log('✅ Connexion Supabase Auth réussie!')
    console.log('👤 Utilisateur connecté:', authData.user?.email)

    // Vérifier dans public.users
    console.log('🔍 Vérification dans public.users...')
    const { data: publicUser, error: publicError } = await admin
      .from('users')
      .select('id, email, name, role')
      .eq('email', adminEmail)
      .single()

    if (publicError) {
      console.warn('⚠️ Erreur récupération public.users:', publicError)
    }

    return NextResponse.json({
      success: true,
      message: 'Connexion admin réussie!',
      auth: {
        userId: authData.user?.id,
        email: authData.user?.email,
        role: authData.user?.user_metadata?.role,
        lastSignIn: authData.user?.last_sign_in_at
      },
      publicUser: publicUser ? {
        id: publicUser.id,
        email: publicUser.email,
        name: publicUser.name,
        role: publicUser.role
      } : null,
      testDetails: {
        email: adminEmail,
        passwordTested: true,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('💥 Erreur test connexion admin:', error)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
