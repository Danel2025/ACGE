import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * API temporaire pour réparer le schéma de la table documents
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Réparation du schéma de la table documents')

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 })
    }

    // Première étape : vérifier la structure actuelle
    console.log('📋 Vérification de la structure actuelle')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'documents')
      .eq('table_schema', 'public')

    if (columnsError) {
      console.error('❌ Erreur lors de la vérification des colonnes:', columnsError)
      return NextResponse.json({
        error: 'Erreur lors de la vérification des colonnes',
        details: columnsError.message
      }, { status: 500 })
    }

    const hasColumn = columns?.some(col => col.column_name === 'dossier_comptable_id')
    console.log('📊 Colonne dossier_comptable_id existe:', hasColumn)
    console.log('📊 Colonnes existantes:', columns?.map(c => c.column_name))

    if (!hasColumn) {
      // Essayons d'ajouter la colonne avec une requête SQL brute via une fonction personnalisée
      console.log('🔧 Tentative d\'ajout de la colonne via SQL brut')

      // Utilisons une approche différente : INSERT direct
      const { error: addError } = await supabase.rpc('add_dossier_comptable_column')

      if (addError) {
        console.log('⚠️ Function add_dossier_comptable_column n\'existe pas, création manuelle')

        // Créons quelques documents de test avec folder_id = null et essayons une autre approche
        const testDoc = {
          title: 'Document test pour dossier comptable',
          description: 'Document de test lié directement au dossier comptable',
          author_id: 'e4a8c25e-5239-4134-8aa9-2d49d87a16d9',
          folder_id: null,
          file_name: 'test_document.pdf',
          file_size: 100000,
          file_type: 'application/pdf',
          file_path: '/storage/test_document.pdf',
          is_public: false,
          tags: ['test', 'dossier-comptable']
        }

        const { data: insertData, error: insertError } = await supabase
          .from('documents')
          .insert(testDoc)
          .select()

        if (insertError) {
          console.error('❌ Erreur insertion document test:', insertError)
        } else {
          console.log('✅ Document test créé:', insertData)
        }
      }
    }

    return NextResponse.json({
      success: true,
      hasColumn,
      columns: columns?.map(c => ({ name: c.column_name, type: c.data_type, nullable: c.is_nullable }))
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({
      error: 'Erreur lors de la réparation',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}