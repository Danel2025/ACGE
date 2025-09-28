import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🎯 Créer des documents avec la structure correcte (camelCase + UUIDs valides)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Création documents finale...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // Récupérer l'utilisateur admin pour avoir son UUID
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', 'admin@acge-gabon.com')
      .single()

    if (adminError) {
      return NextResponse.json(
        { error: 'Erreur récupération admin', details: adminError.message },
        { status: 500 }
      )
    }

    console.log('👤 Admin trouvé:', admin.email, 'ID:', admin.id)

    // Vérifier si l'ID admin est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const isAdminUUID = uuidRegex.test(admin.id)

    if (!isAdminUUID) {
      // L'ID admin n'est pas un UUID, on va créer un utilisateur avec UUID
      console.log('🔄 Création utilisateur admin avec UUID...')
      
      const adminUUID = crypto.randomUUID()
      const { data: newAdmin, error: newAdminError } = await supabase
        .from('users')
        .insert({
          id: adminUUID,
          email: 'admin-uuid@acge-gabon.com',
          name: 'Admin UUID',
          role: 'ADMIN',
          password: admin.password || 'temp_password',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (newAdminError) {
        return NextResponse.json(
          { error: 'Erreur création admin UUID', details: newAdminError.message },
          { status: 500 }
        )
      }

      console.log('✅ Admin UUID créé:', newAdmin.id)
      admin.id = newAdmin.id
    }

    // Créer des documents avec la structure correcte (camelCase)
    const testDocuments = [
      {
        id: crypto.randomUUID(),
        title: 'IMG_20250816_0001',
        description: 'Fichier migré: 1757087766389-kpcfig-IMG_20250816_0001.pdf',
        authorId: admin.id, // UUID de l'admin
        folderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: 'Demande_Adhesion_AGAPAC',
        description: 'Fichier migré: 1757087835923-40lhxs-Demande_Adhesion_AGAPAC.docx',
        authorId: admin.id, // UUID de l'admin
        folderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    const created = []
    const errors = []

    for (const doc of testDocuments) {
      try {
        console.log(`📄 Création document: ${doc.title}`)
        
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
            authorId: document.authorId
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
      message: `Documents créés: ${created.length} succès, ${errors.length} erreurs`,
      admin: {
        id: admin.id,
        email: admin.email,
        isUUID: uuidRegex.test(admin.id)
      },
      created: created.length,
      errors: errors.length,
      details: {
        created,
        errors
      }
    })

  } catch (error) {
    console.error('💥 Erreur création documents finale:', error)
    return NextResponse.json(
      { 
        error: 'Erreur création documents finale',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
