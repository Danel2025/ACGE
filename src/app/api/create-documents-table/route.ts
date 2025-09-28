import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🏗️ Créer la table documents dans Supabase
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🏗️ Création table documents...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // SQL pour créer la table documents
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT,
          author_id TEXT NOT NULL,
          folder_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Exécuter la création de table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (createError) {
      console.error('❌ Erreur création table:', createError)
      return NextResponse.json(
        { error: 'Erreur création table', details: createError.message },
        { status: 500 }
      )
    }

    // Créer les index
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_documents_author_id ON documents(author_id);
      CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
    `

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexesSQL
    })

    if (indexError) {
      console.warn('⚠️ Erreur création index:', indexError.message)
    }

    // Activer RLS
    const enableRLSSQL = `
      ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
    `

    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: enableRLSSQL
    })

    if (rlsError) {
      console.warn('⚠️ Erreur activation RLS:', rlsError.message)
    }

    // Vérifier que la table a été créée
    const { data: testQuery, error: testError } = await supabase
      .from('documents')
      .select('*')
      .limit(1)

    if (testError) {
      return NextResponse.json(
        { error: 'Table créée mais erreur de test', details: testError.message },
        { status: 500 }
      )
    }

    console.log('✅ Table documents créée avec succès')

    return NextResponse.json({
      success: true,
      message: 'Table documents créée avec succès',
      tableExists: true,
      testQuery: testQuery || []
    })

  } catch (error) {
    console.error('💥 Erreur création table:', error)
    return NextResponse.json(
      { 
        error: 'Erreur création table',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
