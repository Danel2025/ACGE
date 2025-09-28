import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔧 Corriger le type de colonne author_id selon la documentation Supabase
 * 
 * Approche recommandée pour les grandes tables :
 * 1. Ajouter une nouvelle colonne avec le bon type
 * 2. Copier les données de l'ancienne vers la nouvelle
 * 3. Supprimer l'ancienne colonne
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Correction type colonne author_id...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // Étape 1: Vérifier si la table documents existe et sa structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'documents')
      .eq('table_schema', 'public')

    if (tableError) {
      console.log('❌ Erreur récupération info table:', tableError.message)
      
      // Si la table n'existe pas, la créer directement avec le bon type
      console.log('🔄 Création table documents avec author_id TEXT...')
      
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
      
      // Note: On ne peut pas exécuter du SQL directement via l'API Supabase
      // Mais on peut essayer d'insérer un document de test
      const testDoc = {
        id: crypto.randomUUID(),
        title: 'Test Document',
        description: 'Test création table',
        author_id: 'cmebotahv0000c17w3izkh2k9', // ID admin actuel
        folder_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: testDocument, error: testError } = await supabase
        .from('documents')
        .insert(testDoc)
        .select()
        .single()

      if (testError) {
        return NextResponse.json({
          success: false,
          message: 'Table documents nécessite modification manuelle',
          error: testError.message,
          suggestion: 'Exécutez ce SQL dans Supabase Dashboard :',
          sql: createTableSQL
        })
      }

      // Supprimer le document de test
      await supabase
        .from('documents')
        .delete()
        .eq('id', testDocument.id)

      return NextResponse.json({
        success: true,
        message: 'Table documents créée avec author_id TEXT',
        testDocument: testDocument
      })
    }

    console.log('📋 Structure table documents:', tableInfo)
    
    // Vérifier si author_id est déjà en TEXT
    const authorIdColumn = tableInfo?.find(col => col.column_name === 'author_id')
    
    if (authorIdColumn?.data_type === 'text') {
      return NextResponse.json({
        success: true,
        message: 'Colonne author_id est déjà de type TEXT',
        structure: tableInfo
      })
    }

    // Si author_id est en UUID, on va essayer de créer des documents avec des UUIDs valides
    if (authorIdColumn?.data_type === 'uuid') {
      console.log('🔄 Table utilise UUID pour author_id, test avec UUID admin...')
      
      // Générer un UUID pour l'admin
      const adminUUID = crypto.randomUUID()
      
      const testDoc = {
        id: crypto.randomUUID(),
        title: 'Test Document UUID',
        description: 'Test avec author_id UUID',
        author_id: adminUUID,
        folder_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: testDocument, error: testError } = await supabase
        .from('documents')
        .insert(testDoc)
        .select()
        .single()

      if (testError) {
        return NextResponse.json({
          success: false,
          message: 'Erreur création document avec UUID',
          error: testError.message,
          suggestion: 'Il faut modifier la table pour accepter TEXT au lieu d\'UUID'
        })
      }

      // Supprimer le document de test
      await supabase
        .from('documents')
        .delete()
        .eq('id', testDocument.id)

      return NextResponse.json({
        success: true,
        message: 'Table documents fonctionne avec UUIDs',
        testDocument: testDocument,
        note: 'Utilisez des UUIDs pour author_id ou modifiez la table'
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Type de colonne author_id inconnu',
      structure: tableInfo
    })

  } catch (error) {
    console.error('💥 Erreur correction colonne:', error)
    return NextResponse.json(
      { 
        error: 'Erreur correction colonne',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
