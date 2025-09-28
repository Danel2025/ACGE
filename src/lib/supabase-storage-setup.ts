import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Utilitaire pour vérifier et configurer le storage Supabase
 */
export async function ensureDocumentsBucket() {
  try {
    const supabase = getSupabaseAdmin()

    console.log('🔍 Vérification du bucket "documents"...')

    // Lister tous les buckets pour voir s'il existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Erreur lors de la liste des buckets:', listError)
      throw new Error(`Impossible de lister les buckets: ${listError.message}`)
    }

    console.log('📁 Buckets existants:', buckets?.map(b => b.name) || [])

    // Vérifier si le bucket "documents" existe
    const documentsBucket = buckets?.find(b => b.name === 'documents')

    if (!documentsBucket) {
      console.log('🚀 Création du bucket "documents"...')

      // Créer le bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
        public: false, // Bucket privé par défaut
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'text/plain',
          'text/csv'
        ],
        fileSizeLimit: 52428800 // 50MB
      })

      if (createError) {
        console.error('❌ Erreur lors de la création du bucket:', createError)
        throw new Error(`Impossible de créer le bucket: ${createError.message}`)
      }

      console.log('✅ Bucket "documents" créé avec succès:', newBucket)
    } else {
      console.log('✅ Bucket "documents" existe déjà')
    }

    // Tester l'upload avec un fichier de test
    console.log('🧪 Test d\'upload...')

    const testContent = Buffer.from('Test file content', 'utf-8')
    const testFileName = `test-upload-${Date.now()}.txt`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`test/${testFileName}`, testContent, {
        contentType: 'text/plain'
      })

    if (uploadError) {
      console.error('❌ Erreur lors du test d\'upload:', uploadError)
      throw new Error(`Test d'upload échoué: ${uploadError.message}`)
    }

    console.log('✅ Test d\'upload réussi:', uploadData?.path)

    // Nettoyer le fichier de test
    const { error: deleteError } = await supabase.storage
      .from('documents')
      .remove([`test/${testFileName}`])

    if (deleteError) {
      console.warn('⚠️ Impossible de supprimer le fichier de test:', deleteError)
    } else {
      console.log('🗑️ Fichier de test supprimé')
    }

    console.log('🎉 Configuration du storage Supabase validée avec succès!')

    return {
      success: true,
      bucketExists: !!documentsBucket,
      bucketCreated: !documentsBucket
    }

  } catch (error) {
    console.error('💥 Erreur lors de la configuration du storage:', error)
    throw error
  }
}

/**
 * Diagnostique complet du storage
 */
export async function diagnoseStorageIssues() {
  try {
    const supabase = getSupabaseAdmin()

    console.log('🔍 === DIAGNOSTIC STORAGE SUPABASE ===')

    // 1. Vérifier la connexion
    console.log('1. Test de connexion...')
    const { data: buckets, error: connectionError } = await supabase.storage.listBuckets()

    if (connectionError) {
      return {
        success: false,
        issue: 'CONNECTION_ERROR',
        details: connectionError.message,
        recommendations: [
          'Vérifiez NEXT_PUBLIC_SUPABASE_URL dans .env',
          'Vérifiez SUPABASE_SERVICE_ROLE_KEY dans .env',
          'Vérifiez que le projet Supabase est actif'
        ]
      }
    }

    console.log('✅ Connexion OK')

    // 2. Lister les buckets
    console.log('2. Buckets disponibles:', buckets?.map(b => `${b.name} (${b.public ? 'public' : 'privé'})`))

    // 3. Vérifier le bucket documents
    const documentsBucket = buckets?.find(b => b.name === 'documents')

    if (!documentsBucket) {
      return {
        success: false,
        issue: 'MISSING_BUCKET',
        details: 'Le bucket "documents" n\'existe pas',
        recommendations: [
          'Créer le bucket "documents" dans Supabase Dashboard',
          'Ou utiliser ensureDocumentsBucket() pour le créer automatiquement'
        ]
      }
    }

    console.log('✅ Bucket "documents" trouvé')

    // 4. Test des permissions
    console.log('3. Test des permissions...')

    try {
      const testContent = Buffer.from('Permission test', 'utf-8')
      const testFileName = `permission-test-${Date.now()}.txt`

      // Test upload
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`test/${testFileName}`, testContent)

      if (uploadError) {
        return {
          success: false,
          issue: 'PERMISSION_ERROR',
          details: uploadError.message,
          recommendations: [
            'Vérifiez les policies RLS du bucket',
            'Vérifiez que SUPABASE_SERVICE_ROLE_KEY a les bonnes permissions'
          ]
        }
      }

      // Test suppression
      await supabase.storage.from('documents').remove([`test/${testFileName}`])

      console.log('✅ Permissions OK')

    } catch (error) {
      return {
        success: false,
        issue: 'PERMISSION_ERROR',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        recommendations: [
          'Vérifiez les policies RLS du bucket',
          'Vérifiez que SUPABASE_SERVICE_ROLE_KEY a les bonnes permissions'
        ]
      }
    }

    return {
      success: true,
      buckets: buckets?.length || 0,
      documentsBucketExists: true,
      message: 'Storage Supabase configuré correctement'
    }

  } catch (error) {
    return {
      success: false,
      issue: 'UNKNOWN_ERROR',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      recommendations: [
        'Vérifiez la configuration Supabase',
        'Consultez les logs du serveur'
      ]
    }
  }
}