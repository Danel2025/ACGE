require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupTestDossiers() {
  try {
    console.log('🧹 Nettoyage des dossiers de test AC...')
    
    // Supprimer les dossiers de test avec statuts PAYÉ et RECETTE_ENREGISTRÉE
    const { data: deletedDossiers, error: deleteError } = await admin
      .from('dossiers')
      .delete()
      .in('statut', ['PAYÉ', 'RECETTE_ENREGISTRÉE'])
      .like('numeroDossier', 'TEST-AC-%')
      .select('id, numeroDossier, statut')

    if (deleteError) {
      console.error('❌ Erreur suppression dossiers:', deleteError)
      return
    }

    console.log(`✅ ${deletedDossiers?.length || 0} dossiers de test supprimés`)
    
    if (deletedDossiers && deletedDossiers.length > 0) {
      console.log('📋 Dossiers supprimés:')
      deletedDossiers.forEach(d => {
        console.log(`  - ${d.numeroDossier} (${d.statut})`)
      })
    }

    // Vérifier les dossiers restants
    const { data: remainingDossiers, error: remainingError } = await admin
      .from('dossiers')
      .select('id, numeroDossier, statut')
      .in('statut', ['VALIDÉ_ORDONNATEUR', 'VALIDÉ_DÉFINITIVEMENT', 'TERMINÉ'])
      .order('createdAt', { ascending: false })

    if (remainingError) {
      console.error('❌ Erreur vérification dossiers restants:', remainingError)
      return
    }

    console.log(`\n📊 Dossiers restants pour l'AC: ${remainingDossiers?.length || 0}`)
    if (remainingDossiers && remainingDossiers.length > 0) {
      const stats = remainingDossiers.reduce((acc, d) => {
        acc[d.statut] = (acc[d.statut] || 0) + 1
        return acc
      }, {})
      
      Object.entries(stats).forEach(([statut, count]) => {
        console.log(`  - ${statut}: ${count} dossier(s)`)
      })
    }

    console.log('\n🎉 Nettoyage terminé !')

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  }
}

cleanupTestDossiers()
