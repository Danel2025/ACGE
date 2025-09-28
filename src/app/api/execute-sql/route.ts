import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔧 Exécuter du SQL directement dans Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()
    
    if (!sql) {
      return NextResponse.json(
        { error: 'SQL requis' },
        { status: 400 }
      )
    }

    console.log('🔧 Exécution SQL:', sql.substring(0, 100) + '...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // Exécuter le SQL via une requête brute
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .limit(0) // Juste pour tester la connexion

    if (error && error.message.includes('relation "documents" does not exist')) {
      // La table n'existe pas, on va la créer via une approche différente
      console.log('📋 Table documents n\'existe pas, création nécessaire')
      
      // Utiliser l'API REST de Supabase pour exécuter du SQL
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
        },
        body: JSON.stringify({ sql })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json(
          { error: 'Erreur exécution SQL', details: errorText },
          { status: 500 }
        )
      }

      const result = await response.json()
      return NextResponse.json({
        success: true,
        message: 'SQL exécuté avec succès',
        result
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Table documents existe déjà',
      data
    })

  } catch (error) {
    console.error('💥 Erreur exécution SQL:', error)
    return NextResponse.json(
      { 
        error: 'Erreur exécution SQL',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
