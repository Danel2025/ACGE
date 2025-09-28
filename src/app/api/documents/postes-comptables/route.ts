import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📊 API POSTES COMPTABLES - ACGE
 * 
 * Récupère la liste des postes comptables depuis Supabase
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Récupération des postes comptables')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer les postes comptables
    const { data: postesComptables, error } = await admin
      .from('postes_comptables')
      .select('*')
      .eq('isActive', true)
      .order('numero', { ascending: true })

    if (error) {
      console.error('❌ Erreur Supabase postes comptables:', error)
      throw error
    }

    console.log(`📊 ${postesComptables?.length || 0} postes comptables trouvés`)
    
    return NextResponse.json({ 
      success: true, 
      postesComptables: postesComptables || [],
      count: postesComptables?.length || 0
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des postes comptables:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des postes comptables',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
