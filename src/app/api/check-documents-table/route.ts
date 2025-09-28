import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔍 Vérifier la structure de la table documents
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Vérification table documents...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // 1. Vérifier si la table documents existe
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_name', 'documents')
      .eq('table_schema', 'public')

    // 2. Vérifier les colonnes de la table documents
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'documents')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    // 3. Essayer de compter les documents existants
    const { count: docCount, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })

    // 4. Essayer d'insérer un document de test (puis le supprimer)
    let testInsert = null
    let testError = null
    
    try {
      const testId = crypto.randomUUID()
      const { data: testDoc, error: insertError } = await supabase
        .from('documents')
        .insert({
          id: testId,
          title: 'Test Document',
          description: 'Test de structure',
          author_id: 'cmebotahv0000c17w3izkh2k9',
          folder_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        testError = insertError.message
      } else {
        testInsert = 'SUCCESS'
        // Supprimer le test
        await supabase
          .from('documents')
          .delete()
          .eq('id', testId)
      }
    } catch (error) {
      testError = error instanceof Error ? error.message : 'Erreur inconnue'
    }

    return NextResponse.json({
      success: true,
      message: 'Vérification table documents terminée',
      tableExists: tableInfo && tableInfo.length > 0,
      tableInfo: tableInfo || [],
      columns: columns || [],
      columnsError: columnsError?.message,
      documentCount: docCount || 0,
      countError: countError?.message,
      testInsert: testInsert,
      testError: testError
    })

  } catch (error) {
    console.error('💥 Erreur vérification table:', error)
    return NextResponse.json(
      { 
        error: 'Erreur vérification table',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
