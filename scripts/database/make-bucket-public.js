/**
 * Script pour rendre le bucket "documents" public
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

async function makeBucketPublic() {
  console.log('🔓 Rendre le bucket "documents" public...')
  
  try {
    // 1. Vérifier l'état actuel des buckets
    console.log('\n1. 📦 Vérification des buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError)
      return
    }
    
    const documentsBucket = buckets.find(bucket => bucket.id === 'documents')
    if (!documentsBucket) {
      console.error('❌ Bucket "documents" non trouvé')
      return
    }
    
    console.log(`📦 Bucket "documents" trouvé (public: ${documentsBucket.public})`)
    
    if (documentsBucket.public) {
      console.log('✅ Le bucket "documents" est déjà public !')
      return
    }
    
    // 2. Note: Supabase ne permet pas de modifier le statut public via l'API
    // Il faut le faire manuellement dans le dashboard
    console.log('\n⚠️  ATTENTION: Le statut public d\'un bucket ne peut pas être modifié via l\'API.')
    console.log('📝 Vous devez le faire manuellement dans Supabase Dashboard:')
    console.log('   1. Allez sur https://supabase.com/dashboard')
    console.log('   2. Sélectionnez votre projet')
    console.log('   3. Allez dans Storage > Buckets')
    console.log('   4. Cliquez sur le bucket "documents"')
    console.log('   5. Cochez "Public bucket" ✅')
    console.log('   6. Sauvegardez')
    
    // 3. Vérifier les politiques RLS
    console.log('\n3. 🔐 Vérification des politiques RLS...')
    console.log('Assurez-vous qu\'il y a une politique publique pour le bucket "documents":')
    console.log(`
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');
    `)
    
    // 4. Tester l'accès après modification
    console.log('\n4. 🧪 Après avoir rendu le bucket public, testez avec:')
    console.log('   node scripts/test-storage-access.js')
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Exécuter le script
makeBucketPublic()
  .then(() => {
    console.log('\n✅ Instructions affichées')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
