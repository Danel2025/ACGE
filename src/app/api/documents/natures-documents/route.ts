import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📄 API NATURES DOCUMENTS - ACGE
 * 
 * Récupère la liste des natures de documents depuis Supabase
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📄 Récupération des natures de documents')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer les natures de documents
    const { data: naturesDocuments, error } = await admin
      .from('natures_documents')
      .select('*')
      .eq('isActive', true)
      .order('numero', { ascending: true })

    if (error) {
      console.error('❌ Erreur Supabase natures documents:', error)
      throw error
    }

    console.log(`📄 ${naturesDocuments?.length || 0} natures de documents trouvées`)
    
    return NextResponse.json({ 
      success: true, 
      naturesDocuments: naturesDocuments || [],
      count: naturesDocuments?.length || 0
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des natures de documents:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des natures de documents',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
