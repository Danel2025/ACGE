import { getSupabaseAdmin } from './supabase-server'

/**
 * Service d'archivage sécurisé des quitus
 * Stocke les quitus dans Supabase Storage avec accès contrôlé
 */

export interface ArchiveResult {
  success: boolean
  archiveUrl?: string
  error?: string
}

/**
 * Archive un quitus dans Supabase Storage
 */
export async function archiveQuitus(
  numeroQuitus: string,
  quitusData: any,
  pdfBuffer?: Buffer
): Promise<ArchiveResult> {
  try {
    const admin = getSupabaseAdmin()

    if (!admin) {
      return {
        success: false,
        error: 'Service de stockage indisponible'
      }
    }

    // Créer le bucket pour les quitus s'il n'existe pas
    const { data: buckets } = await admin.storage.listBuckets()
    const quitsuBucketExists = buckets?.some(b => b.name === 'quitus-archives')

    if (!quitsuBucketExists) {
      const { error: createBucketError } = await admin.storage.createBucket('quitus-archives', {
        public: false, // Privé, nécessite authentification
        fileSizeLimit: 10485760, // 10MB max
        allowedMimeTypes: ['application/pdf', 'application/json']
      })

      if (createBucketError) {
        console.error('❌ Erreur création bucket:', createBucketError)
        return {
          success: false,
          error: `Erreur création bucket: ${createBucketError.message}`
        }
      }

      console.log('✅ Bucket quitus-archives créé')
    }

    // Générer le chemin de l'archive organisé par année/mois
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const archivePath = `${year}/${month}/${numeroQuitus}`

    // 1. Archiver les données JSON
    const jsonPath = `${archivePath}/data.json`
    const { error: jsonError } = await admin.storage
      .from('quitus-archives')
      .upload(jsonPath, JSON.stringify(quitusData, null, 2), {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: true
      })

    if (jsonError) {
      console.error('❌ Erreur archivage JSON:', jsonError)
      return {
        success: false,
        error: `Erreur archivage JSON: ${jsonError.message}`
      }
    }

    console.log('✅ Données JSON archivées:', jsonPath)

    // 2. Archiver le PDF si disponible
    if (pdfBuffer) {
      const pdfPath = `${archivePath}/document.pdf`
      const { error: pdfError } = await admin.storage
        .from('quitus-archives')
        .upload(pdfPath, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true
        })

      if (pdfError) {
        console.warn('⚠️ Erreur archivage PDF:', pdfError)
        // Ne pas faire échouer l'archivage complet si seul le PDF échoue
      } else {
        console.log('✅ PDF archivé:', pdfPath)
      }
    }

    // 3. Enregistrer les métadonnées de l'archive
    const { error: metadataError } = await admin
      .from('quitus_archives')
      .insert({
        quitus_id: numeroQuitus,
        archive_path: archivePath,
        archive_date: new Date().toISOString(),
        file_size_bytes: pdfBuffer?.length || 0,
        has_pdf: !!pdfBuffer,
        metadata: {
          year,
          month,
          archived_by: 'system'
        }
      })

    if (metadataError) {
      console.warn('⚠️ Erreur enregistrement métadonnées archive:', metadataError)
    }

    // Générer l'URL d'accès (signée pour 1 heure)
    const { data: signedUrl } = await admin.storage
      .from('quitus-archives')
      .createSignedUrl(jsonPath, 3600)

    return {
      success: true,
      archiveUrl: signedUrl?.signedUrl
    }
  } catch (error) {
    console.error('❌ Erreur archivage quitus:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Récupère un quitus archivé
 */
export async function retrieveArchivedQuitus(
  numeroQuitus: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const admin = getSupabaseAdmin()

    if (!admin) {
      return {
        success: false,
        error: 'Service de stockage indisponible'
      }
    }

    // Récupérer les métadonnées de l'archive
    const { data: archiveMetadata, error: metadataError } = await admin
      .from('quitus_archives')
      .select('*')
      .eq('quitus_id', numeroQuitus)
      .single()

    if (metadataError || !archiveMetadata) {
      return {
        success: false,
        error: 'Archive non trouvée'
      }
    }

    // Télécharger les données JSON
    const jsonPath = `${archiveMetadata.archive_path}/data.json`
    const { data: jsonData, error: downloadError } = await admin.storage
      .from('quitus-archives')
      .download(jsonPath)

    if (downloadError) {
      return {
        success: false,
        error: `Erreur téléchargement: ${downloadError.message}`
      }
    }

    // Convertir le Blob en JSON
    const jsonText = await jsonData.text()
    const quitusData = JSON.parse(jsonText)

    return {
      success: true,
      data: {
        quitus: quitusData,
        metadata: archiveMetadata
      }
    }
  } catch (error) {
    console.error('❌ Erreur récupération archive:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Liste tous les quitus archivés pour une période donnée
 */
export async function listArchivedQuitus(
  year?: number,
  month?: number
): Promise<{ success: boolean; archives?: any[]; error?: string }> {
  try {
    const admin = getSupabaseAdmin()

    if (!admin) {
      return {
        success: false,
        error: 'Service de base de données indisponible'
      }
    }

    let query = admin.from('quitus_archives').select('*')

    if (year && month) {
      query = query
        .eq('metadata->year', year)
        .eq('metadata->month', month)
    } else if (year) {
      query = query.eq('metadata->year', year)
    }

    const { data: archives, error } = await query.order('archive_date', { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      archives: archives || []
    }
  } catch (error) {
    console.error('❌ Erreur liste archives:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Supprime une archive (après la période de rétention)
 */
export async function deleteArchivedQuitus(
  numeroQuitus: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = getSupabaseAdmin()

    if (!admin) {
      return {
        success: false,
        error: 'Service de stockage indisponible'
      }
    }

    // Récupérer les métadonnées
    const { data: archiveMetadata, error: metadataError } = await admin
      .from('quitus_archives')
      .select('*')
      .eq('quitus_id', numeroQuitus)
      .single()

    if (metadataError || !archiveMetadata) {
      return {
        success: false,
        error: 'Archive non trouvée'
      }
    }

    // Supprimer les fichiers du storage
    const { error: deleteError } = await admin.storage
      .from('quitus-archives')
      .remove([
        `${archiveMetadata.archive_path}/data.json`,
        `${archiveMetadata.archive_path}/document.pdf`
      ])

    if (deleteError) {
      console.warn('⚠️ Erreur suppression fichiers:', deleteError)
    }

    // Supprimer les métadonnées
    const { error: deleteMetadataError } = await admin
      .from('quitus_archives')
      .delete()
      .eq('quitus_id', numeroQuitus)

    if (deleteMetadataError) {
      return {
        success: false,
        error: `Erreur suppression métadonnées: ${deleteMetadataError.message}`
      }
    }

    console.log('✅ Archive supprimée:', numeroQuitus)

    return {
      success: true
    }
  } catch (error) {
    console.error('❌ Erreur suppression archive:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}
