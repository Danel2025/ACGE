import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * API pour récupérer les natures de documents
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 API Natures Documents - Récupération')

    // Connexion à Supabase
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      console.error('❌ Supabase non configuré')
      return NextResponse.json({
        naturesDocuments: [],
        error: 'Base de données non configurée'
      }, { status: 500 })
    }

    try {
      // Récupérer toutes les natures de documents actives
      const { data: naturesDocuments, error } = await supabase
      .from('natures_documents')
        .select('id, numero, nom, description, isActive')
      .eq('isActive', true)
        .order('numero')

    if (error) {
        console.error('❌ Erreur Supabase natures_documents:', error)
        return NextResponse.json({
          naturesDocuments: [],
          error: `Erreur base de données: ${error.message}`
        }, { status: 500 })
      }

      console.log(`📋 ${naturesDocuments?.length || 0} natures de documents trouvées`)

    return NextResponse.json({ 
        naturesDocuments: naturesDocuments || []
      })

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError)
      return NextResponse.json({
        naturesDocuments: [],
        error: `Erreur base de données: ${dbError instanceof Error ? dbError.message : 'Erreur inconnue'}`
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erreur générale API natures-documents:', error)
    return NextResponse.json({
      naturesDocuments: [],
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}