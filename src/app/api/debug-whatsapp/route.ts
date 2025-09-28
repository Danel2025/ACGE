import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * API de debug spécifique pour le fichier WhatsApp problématique
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 === DEBUG WHATSAPP ===')

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Base de données non configurée' }, { status: 500 })
    }

    // Chercher tous les documents qui contiennent WhatsApp
    console.log('🔍 Recherche de documents contenant "WhatsApp"...')
    const { data: whatsappDocs, error: whatsappError } = await supabase
      .from('documents')
      .select('id, title, file_name, file_path, author_id, created_at')
      .ilike('file_name', '%whatsapp%')

    if (whatsappError) {
      console.error('❌ Erreur recherche WhatsApp:', whatsappError)
      return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 })
    }

    // Chercher spécifiquement l'ID problématique
    const problematicId = '1758793139139-lb5rak-WhatsApp_Image_2025-09-05_11.42.06_1627251b'
    console.log(`🔍 Recherche spécifique de l'ID: ${problematicId}`)

    const { data: specificDoc, error: specificError } = await supabase
      .from('documents')
      .select('id, title, file_name, file_path, author_id, created_at')
      .eq('id', problematicId)
      .single()

    console.log('📄 Document spécifique trouvé:', specificDoc)
    console.log('❌ Erreur spécifique:', specificError)

    // Chercher par nom de fichier
    console.log('🔍 Recherche par nom de fichier...')
    const { data: filenameDocs, error: filenameError } = await supabase
      .from('documents')
      .select('id, title, file_name, file_path, author_id, created_at')
      .eq('file_name', '1758793139139-lb5rak-WhatsApp_Image_2025-09-05_11.42.06_1627251b.jpg')

    console.log('📄 Documents par nom de fichier:', filenameDocs)
    console.log('❌ Erreur nom de fichier:', filenameError)

    // Chercher tous les documents récents pour voir s'il y a des doublons
    console.log('🔍 Recherche de tous les documents récents...')
    const { data: recentDocs, error: recentError } = await supabase
      .from('documents')
      .select('id, title, file_name, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    console.log('📄 Documents récents:', recentDocs)
    console.log('❌ Erreur documents récents:', recentError)

    return NextResponse.json({
      whatsappDocuments: whatsappDocs || [],
      specificDocument: specificDoc,
      filenameDocuments: filenameDocs || [],
      recentDocuments: recentDocs || [],
      debugInfo: {
        problematicId,
        whatsappCount: whatsappDocs?.length || 0,
        specificFound: !!specificDoc,
        filenameFound: filenameDocs?.length || 0,
        recentCount: recentDocs?.length || 0
      }
    })

  } catch (error) {
    console.error('💥 ERREUR DEBUG WHATSAPP:', error)
    return NextResponse.json({
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ === SUPPRESSION MANUELLE WHATSAPP ===')

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Base de données non configurée' }, { status: 500 })
    }

    const problematicId = '1758793139139-lb5rak-WhatsApp_Image_2025-09-05_11.42.06_1627251b'
    const filename = '1758793139139-lb5rak-WhatsApp_Image_2025-09-05_11.42.06_1627251b.jpg'

    console.log('🗑️ Tentative de suppression du fichier WhatsApp problématique...')

    // Supprimer par ID
    console.log(`🔍 Suppression par ID: ${problematicId}`)
    const { error: idError, count: idCount } = await supabase
      .from('documents')
      .delete()
      .eq('id', problematicId)

    console.log('📊 Résultat suppression par ID:', { idError, idCount })

    // Supprimer par nom de fichier
    console.log(`🔍 Suppression par nom de fichier: ${filename}`)
    const { error: filenameError, count: filenameCount } = await supabase
      .from('documents')
      .delete()
      .eq('file_name', filename)

    console.log('📊 Résultat suppression par nom de fichier:', { filenameError, filenameCount })

    // Supprimer tous les documents contenant WhatsApp
    console.log('🔍 Suppression de tous les documents contenant "WhatsApp"...')
    const { error: whatsappError, count: whatsappCount } = await supabase
      .from('documents')
      .delete()
      .ilike('file_name', '%whatsapp%')

    console.log('📊 Résultat suppression WhatsApp:', { whatsappError, whatsappCount })

    return NextResponse.json({
      success: true,
      message: 'Suppression manuelle WhatsApp effectuée',
      results: {
        byId: { error: idError?.message, count: idCount },
        byFilename: { error: filenameError?.message, count: filenameCount },
        byWhatsapp: { error: whatsappError?.message, count: whatsappCount }
      }
    })

  } catch (error) {
    console.error('💥 ERREUR SUPPRESSION WHATSAPP:', error)
    return NextResponse.json({
      error: 'Erreur lors de la suppression manuelle',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
