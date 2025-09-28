import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🧪 Créer des documents de test directement
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Création documents de test...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // Documents de test basés sur les fichiers existants dans Storage
    const testDocuments = [
      {
        id: crypto.randomUUID(),
        title: 'IMG_20250816_0001',
        description: 'Fichier migré: 1757087766389-kpcfig-IMG_20250816_0001.pdf',
        author_id: 'cmebotahv0000c17w3izkh2k9',
        folder_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: 'Demande_Adhesion_AGAPAC',
        description: 'Fichier migré: 1757087835923-40lhxs-Demande_Adhesion_AGAPAC.docx',
        author_id: 'cmebotahv0000c17w3izkh2k9',
        folder_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    const created = []
    const errors = []

    for (const doc of testDocuments) {
      try {
        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert(doc)
          .select()
          .single()

        if (docError) {
          console.error(`❌ Erreur création ${doc.title}:`, docError)
          errors.push({
            title: doc.title,
            error: docError.message
          })
        } else {
          console.log(`✅ Créé: ${doc.title} → ${document.id}`)
          created.push({
            title: doc.title,
            documentId: document.id
          })
        }
      } catch (error) {
        console.error(`❌ Erreur traitement ${doc.title}:`, error)
        errors.push({
          title: doc.title,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Documents de test créés: ${created.length} succès, ${errors.length} erreurs`,
      created: created.length,
      errors: errors.length,
      details: {
        created,
        errors
      }
    })

  } catch (error) {
    console.error('💥 Erreur création documents test:', error)
    return NextResponse.json(
      { 
        error: 'Erreur création documents test',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
