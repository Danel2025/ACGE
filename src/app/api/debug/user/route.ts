import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔍 API DEBUG USER - ACGE
 * 
 * Script de diagnostic pour vérifier l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnostic de l\'utilisateur')
    
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    let decoded: any
    try {
      decoded = verify(token, process.env.NEXTAUTH_SECRET || 'dev-secret') as any
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide', details: error instanceof Error ? error.message : 'Erreur inconnue' },
        { status: 401 }
      )
    }

    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Récupérer l'utilisateur depuis la base de données
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id, name, email, role, createdAt, updatedAt')
      .eq('id', decoded.userId)
      .single()

    if (userError) {
      console.error('❌ Erreur Supabase user:', userError)
      throw userError
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    console.log(`🔍 Utilisateur trouvé: ${user.name} (${user.email}) - Rôle: ${user.role}`)
    
    // Vérifier aussi via l'API auth/me
    let authMeData = null
    try {
      const authMeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (authMeResponse.ok) {
        authMeData = await authMeResponse.json()
        console.log('🔍 Auth/me data:', authMeData)
      }
    } catch (error) {
      console.error('❌ Erreur auth/me:', error)
    }
    
    return NextResponse.json({ 
      success: true,
      token: {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email
      },
      user: user,
      authMe: authMeData
    })

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic de l\'utilisateur:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors du diagnostic de l\'utilisateur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
