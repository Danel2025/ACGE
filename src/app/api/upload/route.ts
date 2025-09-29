import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Fonction pour récupérer l'ID de la nature du document à partir du nom
 */
async function getNatureDocumentId(supabase: any, categoryName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('natures_documents')
      .select('id')
      .eq('nom', categoryName)
      .single()
    
    if (error || !data) {
      console.warn(`⚠️ Nature de document "${categoryName}" non trouvée`)
      return null
    }
    
    return data.id
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la nature du document:', error)
    return null
  }
}

/**
 * 🚀 API UPLOAD 100% SUPABASE - ACGE
 * 
 * Cette API gère l'upload de fichiers avec:
 * - Stockage dans Supabase Storage
 * - Métadonnées dans la base de données Supabase
 * - Authentification JWT
 * - Gestion des métadonnées
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 === API UPLOAD SUPABASE - DÉBUT ===')

    // 1. AUTHENTIFICATION (alignée sur /api/auth/me)
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      console.log('❌ Pas de cookie auth-token')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    let userId: string
    try {
      // Utiliser la même clé JWT que /api/auth/me
      const decoded = verify(authToken, process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'unified-jwt-secret-for-development') as any
      userId = decoded.userId
      console.log('✅ Utilisateur authentifié:', userId)
    } catch (error) {
      console.log('❌ Token invalide:', error)
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    // 2. CONNEXION SUPABASE
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      console.error('❌ Supabase non configuré')
      return NextResponse.json(
        { error: 'Service de stockage non disponible' },
        { status: 500 }
      )
    }

    // Vérification rapide du bucket "documents"
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      if (bucketsError) {
        console.error('❌ Erreur lors de la vérification des buckets:', bucketsError)
        return NextResponse.json(
          {
            error: 'Erreur de connexion au storage',
            details: `Vérifiez la configuration Supabase: ${bucketsError.message}`
          },
          { status: 500 }
        )
      }

      const documentsBucket = buckets?.find(b => b.name === 'documents')
      if (!documentsBucket) {
        console.error('❌ Bucket "documents" manquant')
        return NextResponse.json(
          {
            error: 'Bucket de stockage manquant',
            details: 'Le bucket "documents" n\'existe pas dans Supabase Storage. Allez sur /storage-setup pour le créer.'
          },
          { status: 500 }
        )
      }

      console.log('✅ Bucket "documents" trouvé')
    } catch (storageCheckError) {
      console.error('❌ Erreur lors de la vérification du storage:', storageCheckError)
      return NextResponse.json(
        {
          error: 'Erreur de vérification du storage',
          details: 'Impossible de vérifier la configuration du storage Supabase'
        },
        { status: 500 }
      )
    }

    // 3. RÉCUPÉRATION DES DONNÉES
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const metadataStr = formData.get('metadata') as string
    const metadata = metadataStr ? JSON.parse(metadataStr) : {}
    const existingFileIdsStr = formData.get('existingFileIds') as string
    const existingFileIds = existingFileIdsStr ? JSON.parse(existingFileIdsStr) : []

    console.log(`📁 ${files.length} fichier(s) reçu(s)`)
    console.log(`📋 ${existingFileIds.length} document(s) existant(s) sélectionné(s)`)
    console.log('📋 Métadonnées:', metadata)

    // Vérifier qu'au moins des fichiers ou des documents existants sont fournis
    if (files.length === 0 && existingFileIds.length === 0) {
      console.log('❌ Aucun fichier ou document existant fourni')
      return NextResponse.json(
        {
          error: 'Aucun fichier ou document existant fourni',
          details: 'Vérifiez que les fichiers sont correctement sélectionnés ou qu\'au moins un document existant est sélectionné'
        },
        { status: 400 }
      )
    }

    // Vérifier que les nouveaux fichiers sont valides (si il y en a)
    const validFiles = files.filter(file => file && file.name && file.size > 0)
    if (files.length > 0 && validFiles.length === 0) {
      console.log('❌ Aucun fichier valide reçu (fichiers sans nom ou de taille nulle)')
      return NextResponse.json(
        {
          error: 'Aucun fichier valide fourni',
          details: 'Tous les fichiers semblent être corrompus ou sans nom'
        },
        { status: 400 }
      )
    }

    console.log(`✅ ${validFiles.length} nouveau(x) fichier(s) valide(s) sur ${files.length} reçu(s)`)
    console.log(`✅ ${existingFileIds.length} document(s) existant(s) à associer`)

    // 4. TRAITEMENT DES FICHIERS
    const processedFiles: Array<{
      id: string
      title: string
      name: string
      size: number
      type: string
      url: string
    }> = []

    const errors: Array<{ fileName: string; message: string }> = []

    // Traiter les documents existants d'abord
    for (const existingId of existingFileIds) {
      try {
        console.log(`🔗 Association document existant: ${existingId}`)

        // Vérifier que le document existe
        const { data: existingDoc, error: fetchError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', existingId)
          .single()

        if (fetchError || !existingDoc) {
          console.error(`❌ Document existant non trouvé: ${existingId}`)
          errors.push({ fileName: existingId, message: 'Document existant non trouvé' })
          continue
        }

        // Associer le document au dossier si un folderId est fourni
        if (metadata.folderId && existingDoc.folder_id !== metadata.folderId) {
          // Vérifier que le dossier existe
          const { data: dossierCheck } = await supabase
            .from('dossiers')
            .select('id, foldername, numeroDossier')
            .eq('id', metadata.folderId)
            .maybeSingle()

          if (dossierCheck) {
            const updateData = {
              folder_id: metadata.folderId,
              updated_at: new Date().toISOString()
            }

            const { error: updateError } = await supabase
              .from('documents')
              .update(updateData)
              .eq('id', existingId)

            if (updateError) {
              console.error(`❌ Erreur association document ${existingId}:`, updateError)
              errors.push({ fileName: existingDoc.file_name || existingId, message: `Erreur d'association: ${updateError.message}` })
              continue
            }

            console.log(`✅ Document ${existingDoc.file_name} associé au dossier ${dossierCheck.foldername}`)
          } else {
            console.warn('⚠️ Dossier spécifié non trouvé pour document existant:', metadata.folderId)
          }
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(existingDoc.file_path)

        processedFiles.push({
          id: existingDoc.id,
          title: existingDoc.title || 'Document existant',
          name: existingDoc.file_name || 'Document sans nom',
          size: existingDoc.file_size || 0,
          type: existingDoc.file_type || 'application/octet-stream',
          url: publicUrl
        })

        console.log(`✅ Document existant associé: ${existingDoc.file_name}`)

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        console.error(`❌ Erreur traitement document existant ${existingId}:`, message)
        errors.push({ fileName: existingId, message })
      }
    }

    // Traiter les nouveaux fichiers
    for (const file of validFiles) {
      try {
        // Vérifier que le fichier est valide
        if (!file || !file.name) {
          console.error('❌ Fichier invalide:', file)
          errors.push({ fileName: 'fichier invalide', message: 'Fichier sans nom ou corrompu' })
          continue
        }

        console.log(`📤 Traitement: ${file.name} (${file.size} bytes, ${file.type})`)

        // Nettoyer le nom de fichier
        const cleanFileName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/\s+/g, '_')
          .replace(/_{2,}/g, '_')
          .replace(/^_|_$/g, '')

        // Générer un nom unique
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileName = `${timestamp}-${randomSuffix}-${cleanFileName}`
        
        // Générer un UUID pour le document
        const documentId = crypto.randomUUID()

        // ===== UPLOAD VERS SUPABASE STORAGE =====
        console.log('☁️ Upload vers Supabase Storage...')
        
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Upload vers le bucket 'documents' dans le sous-dossier 'documents/'
        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents')
          .upload(`documents/${fileName}`, buffer, {
            contentType: file.type,
            upsert: false
          })

        if (storageError) {
          console.error('❌ Erreur Supabase Storage:', storageError)
          throw new Error(`Erreur stockage: ${storageError.message}`)
        }

        console.log('✅ Fichier uploadé dans Supabase Storage:', storageData.path)

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(`documents/${fileName}`)

        console.log('🔗 URL publique Supabase:', publicUrl)

        // ===== SAUVEGARDE EN BASE DE DONNÉES =====
        console.log('💾 Sauvegarde des métadonnées en base...')
        
        // Préparer les données du document
        let insertData: any = {
          id: documentId,
          title: metadata.title || file.name.split('.')[0],
          description: metadata.description || '',
          file_name: fileName,
          file_size: file.size,
          file_type: file.type,
          file_path: storageData.path,
          is_public: false,
          author_id: userId,
          folder_id: null,
          nature_document_id: metadata.category ? await getNatureDocumentId(supabase, metadata.category) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: metadata.tags || []
        }

        // Associer au dossier si spécifié
        if (metadata.folderId) {
          // Vérifier que le dossier existe
          const { data: dossierCheck } = await supabase
            .from('dossiers')
            .select('id, foldername, numeroDossier')
            .eq('id', metadata.folderId)
            .maybeSingle()

          if (dossierCheck) {
            insertData.folder_id = metadata.folderId
            console.log('🏢 Nouveau document associé au dossier:', dossierCheck.foldername || dossierCheck.numeroDossier)
          } else {
            console.warn('⚠️ Dossier spécifié non trouvé:', metadata.folderId)
            // Continuer sans association au dossier
          }
        }

        const { data: document, error: dbError } = await supabase
          .from('documents')
          .insert(insertData)
          .select()
          .single()

        if (dbError) {
          console.error('❌ Erreur base de données:', dbError)
          // Essayer de supprimer le fichier du storage si la DB échoue
          await supabase.storage.from('documents').remove([`documents/${fileName}`])
          throw new Error(`Erreur base de données: ${dbError.message}`)
        }

        console.log('✅ Document sauvegardé en base:', documentId)
        
        // Document créé avec succès

        processedFiles.push({
          id: documentId,
          title: metadata.title || file.name.split('.')[0],
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl
        })

        console.log(`✅ Fichier ${file.name} traité avec succès`)

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        console.error(`❌ Erreur lors du traitement de ${file?.name}:`, message)
        errors.push({ fileName: file?.name || 'inconnu', message })
      }
    }

    // 5. RÉPONSE FINALE
    console.log(`📊 Résumé: ${processedFiles.length} succès, ${errors.length} erreurs`)

    if (processedFiles.length === 0 && errors.length > 0) {
      return NextResponse.json(
        {
          error: `Aucun fichier n'a pu être traité`,
          errors,
          details: 'Vérifiez que les fichiers sont valides et que Supabase Storage est configuré correctement'
        },
        { status: 500 }
      )
    }

    if (processedFiles.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier n\'a pu être traité' },
        { status: 500 }
      )
    }

    console.log('✅ Traitement terminé avec succès:', processedFiles.length, 'fichiers')

    const totalInput = validFiles.length + existingFileIds.length
    return NextResponse.json({
      message: `${processedFiles.length} fichier(s) traité(s) avec succès` +
               (errors.length ? `, ${errors.length} échec(s)` : '') +
               ` (${validFiles.length} nouveau(x), ${existingFileIds.length} existant(s))`,
      files: processedFiles,
      ...(errors.length ? { errors } : {}),
      summary: {
        total: totalInput,
        success: processedFiles.length,
        failed: errors.length,
        newFiles: validFiles.length,
        existingFiles: existingFileIds.length
      }
    })

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', {
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}