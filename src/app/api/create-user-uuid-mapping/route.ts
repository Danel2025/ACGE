import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔗 Créer un mapping entre les IDs utilisateurs existants et des UUIDs
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Création mapping utilisateurs UUID...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')

    if (usersError) {
      return NextResponse.json(
        { error: 'Erreur récupération utilisateurs', details: usersError.message },
        { status: 500 }
      )
    }

    console.log(`👥 ${users?.length || 0} utilisateur(s) trouvé(s)`)

    // Créer un mapping ID -> UUID
    const userMapping = new Map()
    
    for (const user of users || []) {
      const uuid = crypto.randomUUID()
      userMapping.set(user.id, uuid)
      console.log(`🔗 ${user.email} (${user.id}) -> ${uuid}`)
    }

    // Créer des documents de test avec les UUIDs mappés
    const testDocuments = [
      {
        id: crypto.randomUUID(),
        title: 'IMG_20250816_0001',
        description: 'Fichier migré: 1757087766389-kpcfig-IMG_20250816_0001.pdf',
        author_id: userMapping.get('cmebotahv0000c17w3izkh2k9'), // UUID de l'admin
        folder_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: 'Demande_Adhesion_AGAPAC',
        description: 'Fichier migré: 1757087835923-40lhxs-Demande_Adhesion_AGAPAC.docx',
        author_id: userMapping.get('cmebotahv0000c17w3izkh2k9'), // UUID de l'admin
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
            documentId: document.id,
            authorUUID: doc.author_id
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
      message: `Mapping créé et documents testés: ${created.length} succès, ${errors.length} erreurs`,
      userMapping: Object.fromEntries(userMapping),
      created: created.length,
      errors: errors.length,
      details: {
        created,
        errors
      }
    })

  } catch (error) {
    console.error('💥 Erreur création mapping:', error)
    return NextResponse.json(
      { 
        error: 'Erreur création mapping',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
