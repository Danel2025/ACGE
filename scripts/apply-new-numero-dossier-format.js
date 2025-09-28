#!/usr/bin/env node

/**
 * Script pour appliquer la migration des numéros de dossier vers le nouveau format
 * Usage: node scripts/apply-new-numero-dossier-format.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Application de la migration des numéros de dossier...')
  console.log('📅 Date:', new Date().toISOString())
  console.log('🔗 Supabase URL:', supabaseUrl)
  console.log('')

  try {
    // Lire le fichier de migration SQL
    const migrationPath = path.join(__dirname, 'migrate-numeros-dossier-to-new-format.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Exécuter la migration
    console.log('📝 Exécution de la migration SQL...')
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    })

    if (error) {
      console.error('❌ Erreur lors de l\'exécution de la migration:', error)
      process.exit(1)
    }

    console.log('✅ Migration exécutée avec succès!')
    console.log('📊 Résultats:', data)

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    process.exit(1)
  }
}

// Fonction pour tester la connexion
async function testConnection() {
  console.log('🔍 Test de connexion à Supabase...')

  try {
    const { data, error } = await supabase
      .from('dossiers')
      .select('id, numeroDossier')
      .limit(1)

    if (error) {
      console.error('❌ Erreur de connexion:', error)
      return false
    }

    console.log('✅ Connexion réussie')
    return true
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
    return false
  }
}

// Exécution principale
async function main() {
  console.log('🎯 Migration des numéros de dossier vers le nouveau format')
  console.log('==================================================')
  console.log('')

  // Test de connexion
  const connected = await testConnection()
  if (!connected) {
    console.error('❌ Impossible de se connecter à Supabase')
    process.exit(1)
  }

  // Confirmation
  console.log('')
  console.log('⚠️  Cette migration va modifier tous les numéros de dossier existants.')
  console.log('   Le nouveau format sera: DOSS-ACGE-[N° nature]-[date]-[poste]-[document]-[id]')
  console.log('')

  // Demander confirmation (en mode interactif seulement)
  if (process.stdin.isTTY) {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    await new Promise((resolve) => {
      rl.question('Êtes-vous sûr de vouloir continuer? (oui/non): ', (answer) => {
        rl.close()
        if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'yes') {
          console.log('❌ Migration annulée par l\'utilisateur')
          process.exit(0)
        }
        resolve()
      })
    })
  }

  // Appliquer la migration
  await applyMigration()

  console.log('')
  console.log('🎉 Migration terminée avec succès!')
  console.log('📝 Vérifiez les logs ci-dessus pour voir les détails de la migration.')
  console.log('')
  console.log('💡 Prochaines étapes:')
  console.log('   1. Redémarrer l\'application pour utiliser les nouveaux numéros')
  console.log('   2. Vérifier que les dossiers existants ont bien été mis à jour')
  console.log('   3. Tester la création de nouveaux dossiers avec le nouveau format')
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
}

module.exports = { applyMigration, testConnection }
