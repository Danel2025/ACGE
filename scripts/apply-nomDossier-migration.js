#!/usr/bin/env node

/**
 * Script pour appliquer la migration ajout de la colonne nomDossier
 * Usage: node scripts/apply-nomDossier-migration.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Variables d\'environnement manquantes - mode test activé')
  console.log('ℹ️ Le script ne peut pas se connecter à Supabase')
  console.log('ℹ️ La colonne nomDossier doit être ajoutée manuellement via Supabase Dashboard')
  process.exit(0)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🔄 Application de la migration nomDossier...')

  try {
    // Vérifier si la colonne existe déjà
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'dossiers')
      .eq('column_name', 'nomDossier')

    if (columnsError) {
      console.error('❌ Erreur lors de la vérification de la colonne:', columnsError)
      return false
    }

    if (columns && columns.length > 0) {
      console.log('✅ Colonne nomDossier existe déjà')
      return true
    }

    // Ajouter la colonne nomDossier
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE dossiers ADD COLUMN nomDossier TEXT;'
    })

    if (error) {
      console.error('❌ Erreur lors de l\'ajout de la colonne:', error)
      return false
    }

    console.log('✅ Colonne nomDossier ajoutée avec succès')
    return true

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Démarrage de la migration nomDossier...')

  const success = await applyMigration()

  if (success) {
    console.log('✅ Migration terminée avec succès')
    process.exit(0)
  } else {
    console.log('❌ Échec de la migration')
    process.exit(1)
  }
}

main()
