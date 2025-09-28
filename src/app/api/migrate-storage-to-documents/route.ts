import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔄 MIGRATION: Supabase Storage → Table Documents
 * 
 * Ce script migre les fichiers existants dans Supabase Storage
 * vers la table documents pour les rendre visibles dans l'interface
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Début migration Storage → Documents')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // 1. Lister tous les fichiers dans le bucket 'documents' (dans le sous-dossier documents/)
    const { data: files, error: listError } = await supabase.storage
      .from('documents')
      .list('documents', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listError) {
      console.error('❌ Erreur listage fichiers:', listError)
      return NextResponse.json(
        { error: 'Erreur listage fichiers', details: listError.message },
        { status: 500 }
      )
    }

    console.log(`📁 ${files?.length || 0} fichiers trouvés dans Storage`)

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun fichier à migrer',
        migrated: 0,
        errors: []
      })
    }

    // 2. Parcourir récursivement les dossiers et fichiers
    const migrated = []
    const errors = []

    async function processItem(item: any, folderPath = '') {
      try {
        // Si c'est un dossier, lister son contenu
        if (!item.metadata?.mimetype || item.metadata?.mimetype === 'folder') {
          console.log(`📁 Traitement dossier: ${item.name}`)
          
          const { data: folderFiles, error: folderError } = await supabase.storage
            .from('documents')
            .list(`documents/${item.name}`, { limit: 100 })
          
          if (folderError) {
            console.error(`❌ Erreur listage dossier ${item.name}:`, folderError)
            return
          }

          // Traiter chaque fichier dans le dossier
          for (const folderFile of folderFiles || []) {
            await processItem(folderFile, `${folderPath}/${item.name}`)
          }
          return
        }

        // C'est un fichier réel - l'ignorer si c'est un placeholder
        if (item.name === '.emptyFolderPlaceholder') {
          return
        }

        console.log(`📄 Traitement fichier: ${item.name}`)

        // Générer un UUID v4 pour la compatibilité Supabase
        const documentId = crypto.randomUUID()
        
        // Extraire le nom du fichier (sans le préfixe timestamp)
        const fileName = item.name.replace(/^\d+-[a-z0-9]+-/, '')
        const title = fileName.split('.')[0] || 'Document sans nom'

        // Créer l'entrée document
        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert({
            id: documentId,
            title: title,
            description: `Fichier migré: ${item.name}${folderPath ? ` (dossier: ${folderPath})` : ''}`,
            author_id: 'cmebotahv0000c17w3izkh2k9', // Admin par défaut (TEXT)
            folder_id: null,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (docError) {
          console.error(`❌ Erreur migration ${item.name}:`, docError)
          errors.push({
            file: item.name,
            error: docError.message
          })
        } else {
          console.log(`✅ Migré: ${item.name} → ${document.id}`)
          migrated.push({
            file: item.name,
            documentId: document.id,
            title: document.title,
            folder: folderPath
          })
        }

      } catch (error) {
        console.error(`❌ Erreur traitement ${item.name}:`, error)
        errors.push({
          file: item.name,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }

    // Traiter chaque élément racine
    for (const file of files) {
      await processItem(file)
    }

    console.log(`📊 Migration terminée: ${migrated.length} succès, ${errors.length} erreurs`)

    return NextResponse.json({
      success: true,
      message: `Migration terminée: ${migrated.length} fichiers migrés`,
      migrated: migrated.length,
      errors: errors.length,
      details: {
        migrated,
        errors
      }
    })

  } catch (error) {
    console.error('💥 Erreur migration générale:', error)
    return NextResponse.json(
      { 
        error: 'Erreur migration générale',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
