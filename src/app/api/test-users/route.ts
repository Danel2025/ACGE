import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test de récupération des utilisateurs...')
    
    const supabase = getSupabaseAdmin()
    
    // Essayer de récupérer les utilisateurs
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(10)
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Erreur lors de la récupération des utilisateurs',
          details: error.message
        },
        { status: 500 }
      )
    }
    
    console.log('✅ Utilisateurs récupérés:', data?.length || 0)
    
    return NextResponse.json({
      success: true,
      users: data,
      count: data?.length || 0,
      message: 'Utilisateurs récupérés avec succès'
    })
    
  } catch (error) {
    console.error('❌ Erreur lors du test des utilisateurs:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du test des utilisateurs',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}