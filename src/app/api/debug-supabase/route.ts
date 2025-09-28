import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG SUPABASE - Test complet')

    // 1. Vérifier les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('📋 Variables d\'environnement:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl, supabaseUrl?.substring(0, 30) + '...')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey, supabaseAnonKey?.substring(0, 30) + '...')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey, supabaseServiceKey?.substring(0, 30) + '...')

    // 2. Tester la connexion Supabase
    let supabaseStatus = 'NOT_CONFIGURED'
    let supabaseError = null
    let usersCount = 0

    try {
      const supabase = getSupabaseAdmin()
      console.log('✅ Client Supabase admin créé')
      supabaseStatus = 'CLIENT_OK'

      // 3. Tester une requête simple
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .limit(5)

      if (usersError) {
        console.error('❌ Erreur requête users:', usersError)
        supabaseError = usersError.message
        supabaseStatus = 'QUERY_ERROR'
      } else {
        console.log('✅ Requête users réussie, nombre:', users?.length || 0)
        usersCount = users?.length || 0
        supabaseStatus = 'FULLY_WORKING'
      }

    } catch (error: any) {
      console.error('❌ Erreur client Supabase:', error.message)
      supabaseError = error.message
      supabaseStatus = 'CLIENT_ERROR'
    }

    // 4. Tester spécifiquement l'utilisateur admin
    let adminUser = null
    let adminError = null

    try {
      const supabase = getSupabaseAdmin()
      const { data: adminUsers, error: adminQueryError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('email', 'admin@acge-gabon.com')
        .limit(1)

      if (adminQueryError) {
        adminError = adminQueryError.message
      } else {
        adminUser = adminUsers?.[0] || null
      }
    } catch (error: any) {
      adminError = error.message
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseAnonKey: !!supabaseAnonKey,
        hasSupabaseServiceKey: !!supabaseServiceKey,
        supabaseUrlPreview: supabaseUrl?.substring(0, 50) + '...',
      },
      supabase: {
        status: supabaseStatus,
        error: supabaseError,
        usersCount,
        adminUser,
        adminError
      },
      diagnosis: {
        canConnectToSupabase: supabaseStatus === 'FULLY_WORKING',
        adminUserExists: !!adminUser,
        readyForAuth: supabaseStatus === 'FULLY_WORKING' && !!adminUser
      }
    })

  } catch (error: any) {
    console.error('💥 Erreur debug supabase:', error)
    return NextResponse.json({
      error: 'Erreur lors du debug Supabase',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
