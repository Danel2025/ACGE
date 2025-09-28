#!/usr/bin/env node

/**
 * Script de migration pour générer des numéros de dossiers pour les dossiers existants
 * Date: 2025-09-23
 * Description: Ce script génère automatiquement des numéros de dossiers pour tous les dossiers existants qui n'en ont pas
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Génère un numéro de dossier unique
 */
function generateNumeroDossier() {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `DOSS-ACGE-${year}${randomNum}`
}

/**
 * Vérifie si un numéro de dossier existe déjà
 */
async function checkNumeroDossierExists(numeroDossier) {
  const { data, error } = await supabase
    .from('folders')
    .select('id')
    .eq('numeroDossier', numeroDossier)
    .maybeSingle()

  return !!data
}

/**
 * Génère un numéro de dossier unique
 */
async function generateUniqueNumeroDossier() {
  let numeroDossier
  let attempts = 0
  const maxAttempts = 100

  do {
    numeroDossier = generateNumeroDossier()
    attempts++
  } while (await checkNumeroDossierExists(numeroDossier) && attempts < maxAttempts)

  if (attempts >= maxAttempts) {
    throw new Error('Impossible de générer un numéro de dossier unique après 100 tentatives')
  }

  return numeroDossier
}

/**
 * Migre les dossiers existants
 */
async function migrateExistingFolders() {
  console.log('🚀 Début de la migration des numéros de dossiers...')

  try {
    // Récupérer tous les dossiers sans numéro
    const { data: folders, error: fetchError } = await supabase
      .from('folders')
      .select('id, name, numeroDossier')
      .is('numeroDossier', null)

    if (fetchError) {
      throw fetchError
    }

    console.log(`📁 ${folders.length} dossiers trouvés sans numéro de dossier`)

    if (folders.length === 0) {
      console.log('✅ Tous les dossiers ont déjà un numéro de dossier')
      return
    }

    // Traiter chaque dossier
    const results = {
      success: 0,
      errors: 0
    }

    for (const folder of folders) {
      try {
        console.log(`🔄 Traitement du dossier "${folder.name}" (ID: ${folder.id})`)

        // Générer un numéro unique
        const numeroDossier = await generateUniqueNumeroDossier()

        // Mettre à jour le dossier
        const { error: updateError } = await supabase
          .from('folders')
          .update({ numeroDossier })
          .eq('id', folder.id)

        if (updateError) {
          throw updateError
        }

        console.log(`✅ Dossier "${folder.name}" mis à jour avec le numéro: ${numeroDossier}`)
        results.success++

      } catch (error) {
        console.error(`❌ Erreur lors de la migration du dossier "${folder.name}":`, error.message)
        results.errors++
      }
    }

    console.log('\n📊 Résumé de la migration:')
    console.log(`✅ Dossiers mis à jour avec succès: ${results.success}`)
    console.log(`❌ Erreurs: ${results.errors}`)
    console.log(`📈 Taux de succès: ${((results.success / folders.length) * 100).toFixed(1)}%`)

  } catch (error) {
    console.error('❌ Erreur générale lors de la migration:', error)
    process.exit(1)
  }
}

/**
 * Vérifie la structure de la table folders
 */
async function checkTableStructure() {
  console.log('🔍 Vérification de la structure de la table folders...')

  try {
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'folders' AND column_name = 'numeroDossier'
        `
      })

    if (error) {
      console.error('❌ Erreur lors de la vérification de la structure:', error)
      return false
    }

    if (data && data.length > 0) {
      console.log('✅ Colonne numeroDossier trouvée dans la table folders')
      return true
    } else {
      console.error('❌ Colonne numeroDossier non trouvée dans la table folders')
      console.error('⚠️  Veuillez d\'abord exécuter la migration pour ajouter cette colonne')
      return false
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    return false
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔧 Script de migration des numéros de dossiers ACGE')
  console.log('=' .repeat(50))

  // Vérifier la structure de la table
  const hasColumn = await checkTableStructure()

  if (!hasColumn) {
    console.log('\n❌ Migration annulée - Colonne numeroDossier manquante')
    process.exit(1)
  }

  // Lancer la migration
  await migrateExistingFolders()

  console.log('\n🎉 Migration terminée!')
  console.log('💡 Les nouveaux dossiers créés auront automatiquement un numéro généré')
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non capturée:', error)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error)
  process.exit(1)
})

// Lancer le script
main()
