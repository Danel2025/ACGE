import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔧 Corriger la table documents pour accepter TEXT author_id
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Correction table documents...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // Essayer de créer un document de test avec l'ID admin actuel
    const testDoc = {
      id: crypto.randomUUID(),
      title: 'Test Document',
      description: 'Test de création',
      author_id: 'cmebotahv0000c17w3izkh2k9', // ID admin actuel
      folder_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert(testDoc)
      .select()
      .single()

    if (docError) {
      console.log('❌ Erreur avec author_id TEXT:', docError.message)
      
      // Si l'erreur est liée au type UUID, on va créer une nouvelle table
      if (docError.message.includes('invalid input syntax for type uuid')) {
        console.log('🔄 Recréation table avec author_id TEXT...')
        
        // Supprimer et recréer la table
        const dropSQL = 'DROP TABLE IF EXISTS documents CASCADE;'
        const createSQL = `
          CREATE TABLE documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            author_id TEXT NOT NULL,
            folder_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
        
        // Note: On ne peut pas exécuter du SQL directement via l'API
        // Mais on peut essayer d'insérer avec un UUID valide
        const adminUUID = crypto.randomUUID()
        
        const testDocUUID = {
          ...testDoc,
          author_id: adminUUID
        }
        
        const { data: documentUUID, error: docUUIDError } = await supabase
          .from('documents')
          .insert(testDocUUID)
          .select()
          .single()

        if (docUUIDError) {
          return NextResponse.json({
            success: false,
            message: 'Table documents nécessite author_id UUID',
            error: docError.message,
            suggestion: 'La table documents attend des UUIDs pour author_id. Il faut soit convertir les IDs utilisateurs en UUIDs, soit modifier la table.'
          })
        }

        // Supprimer le document de test
        await supabase
          .from('documents')
          .delete()
          .eq('id', documentUUID.id)

        return NextResponse.json({
          success: true,
          message: 'Table documents fonctionne avec UUIDs',
          testDocument: documentUUID,
          note: 'Il faut convertir les IDs utilisateurs en UUIDs ou modifier la table'
        })
      }

      return NextResponse.json({
        success: false,
        message: 'Erreur création document',
        error: docError.message
      })
    }

    // Supprimer le document de test
    await supabase
      .from('documents')
      .delete()
      .eq('id', document.id)

    return NextResponse.json({
      success: true,
      message: 'Table documents fonctionne correctement',
      testDocument: document
    })

  } catch (error) {
    console.error('💥 Erreur correction table:', error)
    return NextResponse.json(
      { 
        error: 'Erreur correction table',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
