/**
 * Script pour déplacer les fichiers du bucket racine vers le sous-dossier "documents"
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function moveFilesToDocumentsFolder() {
  console.log('📁 Déplacement des fichiers vers le sous-dossier "documents"...')
  
  try {
    // 1. Lister les fichiers dans le bucket racine
    console.log('\n1. 📋 Liste des fichiers dans le bucket racine...')
    const { data: files, error: filesError } = await supabase.storage
      .from('documents')
      .list('', { limit: 100 })
    
    if (filesError) {
      console.error('❌ Erreur lors de la récupération des fichiers:', filesError)
      return
    }
    
    // Filtrer seulement les fichiers (pas les dossiers)
    const fileList = files.filter(file => !file.name.endsWith('/'))
    console.log(`📄 ${fileList.length} fichiers trouvés dans le bucket racine`)
    
    if (fileList.length === 0) {
      console.log('✅ Aucun fichier à déplacer')
      return
    }
    
    // 2. Créer le sous-dossier "documents" s'il n'existe pas
    console.log('\n2. 📁 Vérification du sous-dossier "documents"...')
    const { data: folders } = await supabase.storage
      .from('documents')
      .list('', { limit: 100 })
    
    const documentsFolder = folders?.find(folder => folder.name === 'documents')
    if (!documentsFolder) {
      console.log('📁 Création du sous-dossier "documents"...')
      // Note: Supabase Storage crée automatiquement les dossiers lors de l'upload
    } else {
      console.log('✅ Sous-dossier "documents" existe déjà')
    }
    
    // 3. Déplacer chaque fichier
    console.log('\n3. 🔄 Déplacement des fichiers...')
    let successCount = 0
    let errorCount = 0
    
    for (const file of fileList) {
      try {
        console.log(`\n📄 Traitement de: ${file.name}`)
        
        // Télécharger le fichier depuis l'emplacement actuel
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(file.name)
        
        if (downloadError) {
          console.error(`❌ Erreur téléchargement ${file.name}:`, downloadError.message)
          errorCount++
          continue
        }
        
        // Uploader le fichier dans le sous-dossier "documents"
        const newPath = `documents/${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(newPath, fileData, {
            contentType: file.metadata?.mimetype || 'application/octet-stream',
            upsert: true // Remplacer si le fichier existe déjà
          })
        
        if (uploadError) {
          console.error(`❌ Erreur upload ${file.name}:`, uploadError.message)
          errorCount++
          continue
        }
        
        // Supprimer l'ancien fichier
        const { error: deleteError } = await supabase.storage
          .from('documents')
          .remove([file.name])
        
        if (deleteError) {
          console.error(`⚠️ Erreur suppression ${file.name}:`, deleteError.message)
          // On continue même si la suppression échoue
        }
        
        console.log(`✅ ${file.name} déplacé vers documents/${file.name}`)
        successCount++
        
      } catch (error) {
        console.error(`❌ Erreur générale pour ${file.name}:`, error.message)
        errorCount++
      }
    }
    
    // 4. Résumé
    console.log('\n📊 Résumé du déplacement:')
    console.log(`✅ Fichiers déplacés avec succès: ${successCount}`)
    console.log(`❌ Erreurs: ${errorCount}`)
    
    if (successCount > 0) {
      console.log('\n🎉 Déplacement terminé !')
      console.log('Les fichiers sont maintenant dans le sous-dossier "documents/"')
      console.log('Les URLs de prévisualisation devraient maintenant fonctionner.')
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Exécuter le script
moveFilesToDocumentsFolder()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
