import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * API temporaire pour exécuter du SQL brut
 */
export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ error: 'Paramètre sql requis' }, { status: 400 })
    }

    console.log('🔧 Exécution SQL:', sql)

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 })
    }

    // Exécuter le SQL directement
    const { data, error } = await supabase.from('_').select('*').limit(0) // Test de connexion

    // Utiliser une requête brute si disponible
    const { data: result, error: sqlError } = await supabase.rpc('exec_sql', { sql })

    if (sqlError) {
      console.error('❌ Erreur SQL:', sqlError)
      return NextResponse.json({
        error: 'Erreur lors de l\'exécution du SQL',
        details: sqlError.message
      }, { status: 500 })
    }

    console.log('✅ SQL exécuté avec succès')
    return NextResponse.json({
      success: true,
      result: result
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'exécution',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}