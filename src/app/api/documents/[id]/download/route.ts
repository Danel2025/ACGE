import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🚀 API DOCUMENTS DOWNLOAD - Téléchargement de documents
 * 
 * API pour télécharger les documents depuis Supabase Storage
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('📄 API Documents Download - Téléchargement:', id)
    
    const documentId = id
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'ID de document requis' },
        { status: 400 }
      )
    }

    // Connexion à Supabase
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      console.error('❌ Supabase non configuré')
      return NextResponse.json(
        { error: 'Service de stockage non disponible' },
        { status: 500 }
      )
    }

    try {
      // Récupérer le document depuis la base de données
      // Note: documentId est l'ID artificiel généré côté client
      // On doit chercher par l'ID artificiel dans une table de mapping ou utiliser une autre logique
      
      // Pour l'instant, on va chercher tous les documents et trouver celui qui correspond
      // C'est une solution temporaire - idéalement il faudrait une table de mapping
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, file_name, file_path, file_type, title, created_at')
        .order('created_at', { ascending: false })
        .limit(1000) // Limite pour éviter de charger trop de données
      
      if (docError) {
        console.error('❌ Erreur récupération documents:', docError)
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des documents' },
          { status: 500 }
        )
      }
      
      // Trouver le document qui correspond à l'ID artificiel
      const document = documents?.find(doc => {
        const timestamp = new Date(doc.created_at).getTime()
        const expectedId = `file-${timestamp}-${documentId.split('-')[2] || ''}`
        return expectedId === documentId
      })
      
      if (!document) {
        console.error('❌ Document non trouvé pour ID artificiel:', documentId)
        return NextResponse.json(
          { error: 'Document non trouvé' },
          { status: 404 }
        )
      }

      console.log('📄 Document trouvé:', document.title, document.file_name)

      // Télécharger le fichier depuis Supabase Storage (dans le sous-dossier documents/)
      const { data: fileData, error: storageError } = await supabase.storage
        .from('documents')
        .download(`documents/${document.file_name}`)

      if (storageError || !fileData) {
        console.error('❌ Erreur Supabase Storage:', storageError)
        return NextResponse.json(
          { error: 'Fichier non trouvé dans le stockage' },
          { status: 404 }
        )
      }

      console.log('✅ Fichier téléchargé depuis Supabase Storage')

      // Convertir le blob en ArrayBuffer
      const arrayBuffer = await fileData.arrayBuffer()
      
      // Retourner le fichier avec les bons headers
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': document.file_type || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${document.title || document.file_name}"`,
          'Cache-Control': 'public, max-age=3600',
        },
      })

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du fichier' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Erreur générale API documents download:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}