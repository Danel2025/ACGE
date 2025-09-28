import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🚀 API DOCUMENTS - ACGE avec Supabase (VERSION SIMPLIFIÉE)
 * 
 * Version drastique pour éliminer tous les problèmes de colonnes
 */

export async function GET(request: NextRequest) {
  try {
    console.log('📄 API Documents - Version simplifiée')
    
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const dossierId = searchParams.get('dossierId')
    const unassigned = searchParams.get('unassigned') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    console.log('📄 Paramètres:', { search, dossierId, unassigned, page, limit })

    // Connexion à Supabase
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      console.error('❌ Supabase non configuré')
      return NextResponse.json({
        documents: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        error: 'Base de données non configurée'
      }, { status: 500 })
    }

    const offset = (page - 1) * limit

    try {
      // REQUÊTE AVEC NATURE DU DOCUMENT
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

      // Filtre par dossier si spécifié
      if (dossierId) {
        query = query.eq('folder_id', dossierId)
      }

      // Filtre pour les documents non assignés (sans folder_id)
      if (unassigned) {
        query = query.is('folder_id', null)
      }

      // Recherche simple
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`)
      }

      // Tri par date de création (colonne qui existe)
      query = query.order('created_at', { ascending: false })

      // Pagination
      query = query.range(offset, offset + limit - 1)

      // Exécuter la requête
      const { data: documents, error, count } = await query

      if (error) {
        console.error('❌ Erreur Supabase documents:', error)
        return NextResponse.json({
          documents: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          error: `Erreur base de données: ${error.message}`
        }, { status: 500 })
      }

      console.log(`📄 ${documents?.length || 0} documents trouvés sur ${count || 0} total`)

      // TRANSFORMATION SIMPLE DES DONNÉES
      const enrichedDocuments = (documents || []).map(doc => {
        // Debug: afficher les données brutes
        console.log('📄 Document brut (debug):', {
          id: doc.id,
          title: doc.title,
          file_name: doc.file_name
        })

        // Générer l'URL du fichier
        let fileUrl = null
        if (doc.file_path) {
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(doc.file_path)
          fileUrl = publicUrl
        }

        return {
          id: doc.id, // Utiliser l'ID réel de la base de données
          title: doc.title || 'Document sans titre',
          description: doc.description,
          file_name: doc.file_name || '',
          file_size: doc.file_size || 0,
          file_type: doc.file_type || 'application/octet-stream',
          created_at: doc.created_at,
          author: doc.author_id ? {
            name: 'Utilisateur',
            email: 'user@example.com'
          } : undefined,
          nature_document: doc.natures_documents ? {
            nom: doc.natures_documents.nom,
            numero: doc.natures_documents.numero
          } : undefined,
          // Conserver les autres champs pour compatibilité
          originalId: doc.id,
          fileName: doc.file_name || '',
          fileSize: doc.file_size || 0,
          fileType: doc.file_type || 'application/octet-stream',
          filePath: doc.file_path || '',
          fileUrl: fileUrl,
          isPublic: doc.is_public || false,
          tags: doc.tags || [],
          category: doc.natures_documents?.nom || 'Non classé',
          natureDocumentId: doc.nature_document_id,
          natureDocument: doc.natures_documents ? {
            id: doc.natures_documents.id,
            numero: doc.natures_documents.numero,
            nom: doc.natures_documents.nom,
            description: doc.natures_documents.description
          } : null,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
          authorId: doc.author_id || 'unknown',
          folderId: doc.folder_id || null,
          folder: doc.folder_id ? {
            id: doc.folder_id,
            name: 'Dossier'
          } : null,
          _count: {
            comments: 0,
            shares: 0
          }
        }
      })

      console.log(`✅ ${enrichedDocuments.length} documents enrichis retournés`)
      
      // Debug: afficher les premiers documents pour vérifier la structure
      if (enrichedDocuments.length > 0) {
        console.log('📄 Premier document (debug):', {
          id: enrichedDocuments[0].id,
          originalId: enrichedDocuments[0].originalId,
          title: enrichedDocuments[0].title
        })

        // Vérifier s'il y a des documents avec des IDs suspects
        const suspiciousDocuments = enrichedDocuments.filter(doc =>
          doc.title.includes('WhatsApp') ||
          doc.fileName.includes('WhatsApp') ||
          doc.id.includes('1758793139139')
        )

        if (suspiciousDocuments.length > 0) {
          console.log('⚠️ Documents suspects trouvés:', suspiciousDocuments)
        }
      }

      return NextResponse.json({
        documents: enrichedDocuments,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError)
      return NextResponse.json({
        documents: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        error: `Erreur base de données: ${dbError instanceof Error ? dbError.message : 'Erreur inconnue'}`
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erreur générale API documents:', error)
    return NextResponse.json({
      documents: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}