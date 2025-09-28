import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔍 Récupérer l'UUID de l'utilisateur admin
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Récupération UUID admin...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // Récupérer l'utilisateur admin
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', 'admin@acge-gabon.com')
      .single()

    if (adminError) {
      return NextResponse.json(
        { error: 'Erreur récupération admin', details: adminError.message },
        { status: 500 }
      )
    }

    // Vérifier si l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const isUUID = uuidRegex.test(admin.id)

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isUUID: isUUID,
        length: admin.id.length
      }
    })

  } catch (error) {
    console.error('💥 Erreur récupération admin:', error)
    return NextResponse.json(
      { 
        error: 'Erreur récupération admin',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
