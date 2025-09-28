import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔍 API de vérification du stockage Supabase
 * 
 * Vérifie que Supabase Storage est configuré et accessible
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Vérification Supabase Storage...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Client Supabase non configuré',
        details: 'Vérifiez les variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY'
      }, { status: 500 })
    }

    // 1. Vérifier que le bucket 'documents' existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de lister les buckets',
        details: bucketsError.message
      }, { status: 500 })
    }

    const documentsBucket = buckets?.find(b => b.name === 'documents')
    
    if (!documentsBucket) {
      console.log('⚠️ Bucket "documents" non trouvé, création...')
      
      // Créer le bucket s'il n'existe pas
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp'
        ]
      })

      if (createError) {
        return NextResponse.json({
          success: false,
          error: 'Impossible de créer le bucket',
          details: createError.message
        }, { status: 500 })
      }

      console.log('✅ Bucket "documents" créé avec succès')
    }

    // 2. Lister les fichiers existants dans le bucket (dans le sous-dossier documents/)
    const { data: files, error: listError } = await supabase.storage
      .from('documents')
      .list('documents', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de lister les fichiers',
        details: listError.message
      }, { status: 500 })
    }

    // 3. Vérifier la table documents
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('id, title, file_name')
      .limit(5)

    if (dbError) {
      return NextResponse.json({
        success: false,
        error: 'Table documents non accessible',
        details: dbError.message,
        suggestion: 'Exécutez les migrations Supabase'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase Storage est configuré correctement',
      storage: {
        bucket: 'documents',
        public: documentsBucket?.public || true,
        filesCount: files?.length || 0,
        recentFiles: files?.slice(0, 3).map(f => ({
          name: f.name,
          size: f.metadata?.size,
          created: f.created_at
        }))
      },
      database: {
        table: 'documents',
        documentsCount: documents?.length || 0,
        recentDocuments: documents?.slice(0, 3).map(d => ({
          id: d.id,
          title: d.title,
          fileName: d.file_name
        }))
      }
    })

  } catch (error) {
    console.error('❌ Erreur vérification storage:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
