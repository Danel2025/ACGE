import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🎯 API DÉFINITIVE - Documents liés aux dossiers comptables
 *
 * Architecture définitive utilisant folder_id pour stocker l'ID du dossier comptable
 * avec une couche d'abstraction propre
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📄 API Documents Dossier Comptable - Architecture Définitive')

    const { searchParams } = new URL(request.url)
    const dossierComptableId = searchParams.get('dossier_comptable_id')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    if (!dossierComptableId) {
      return NextResponse.json({
        error: 'Paramètre dossier_comptable_id requis'
      }, { status: 400 })
    }

    console.log('📋 Paramètres:', { dossierComptableId, search, page, limit })

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({
        documents: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        error: 'Base de données non configurée'
      }, { status: 500 })
    }

    const offset = (page - 1) * limit

    try {
      // ✨ ARCHITECTURE DÉFINITIVE : folder_id stocke l'ID du dossier comptable
      let query = supabase
        .from('documents')
        .select(`
          id,
          title,
          description,
          author_id,
          folder_id,
          created_at,
          updated_at,
          file_name,
          file_size,
          file_type,
          file_path,
          is_public,
          tags,
          nature_document_id,
          natures_documents!nature_document_id (
            id,
            numero,
            nom,
            description
          )
        `, { count: 'exact' })
        .eq('folder_id', dossierComptableId) // ✨ folder_id = dossier_comptable_id (architecture définitive)

      // Recherche si spécifiée
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`)
      }

      // Tri par date de création
      query = query.order('created_at', { ascending: false })

      // Pagination
      query = query.range(offset, offset + limit - 1)

      const { data: documents, error, count } = await query

      if (error) {
        console.error('❌ Erreur Supabase documents dossier comptable:', error)
        return NextResponse.json({
          documents: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          error: `Erreur base de données: ${error.message}`
        }, { status: 500 })
      }

      console.log(`📄 ${documents?.length || 0} documents trouvés pour dossier comptable ${dossierComptableId}`)

      // ✨ TRANSFORMATION DÉFINITIVE DES DONNÉES
      const enrichedDocuments = (documents || []).map(doc => ({
        // Propriétés essentielles
        id: doc.id,
        title: doc.title,
        description: doc.description || '',

        // Métadonnées de fichier
        fileName: doc.file_name || 'document',
        fileSize: doc.file_size || 0,
        fileType: doc.file_type || 'unknown',
        filePath: doc.file_path || '',
        fileUrl: doc.file_path ?
          `https://wodyrsasfqfoqdydrfew.supabase.co/storage/v1/object/public/documents${doc.file_path}` :
          '',

        // Propriétés système
        isPublic: doc.is_public || false,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,

        // Relations
        authorId: doc.author_id,
        author: {
          id: doc.author_id,
          name: 'Utilisateur',
          email: 'user@example.com'
        },

        // ✨ Architecture définitive : dossier comptable
        dossierComptableId: doc.dossier_comptable_id,
        dossierComptable: {
          id: doc.dossier_comptable_id,
          numero: 'DOSS-ACGE-2025-09-28', // À enrichir si besoin
          name: 'Dossier Comptable'
        },

        // Folder (pour compatibilité avec l'interface existante)
        folder: {
          id: doc.dossier_comptable_id,
          name: 'Dossier Comptable'
        },
        folderId: doc.dossier_comptable_id,

        // Nature du document
        natureDocumentId: doc.nature_document_id,
        natureDocument: doc.natures_documents || null,
        category: doc.natures_documents?.nom || 'Non classé',

        // Propriétés de compatibilité
        originalId: doc.id,
        _count: {
          comments: 0,
          shares: 0
        }
      }))

      const totalPages = Math.ceil((count || 0) / limit)

      return NextResponse.json({
        documents: enrichedDocuments,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        },
        dossierComptableId: dossierComptableId,
        metadata: {
          architecture: 'définitive',
          mapping: 'folder_id → dossier_comptable_id',
          version: '2.0'
        }
      })

    } catch (queryError) {
      console.error('❌ Erreur requête documents dossier comptable:', queryError)
      return NextResponse.json({
        documents: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        error: 'Erreur lors de la récupération des documents'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erreur générale API documents dossier comptable:', error)
    return NextResponse.json({
      documents: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      error: 'Erreur serveur'
    }, { status: 500 })
  }
}