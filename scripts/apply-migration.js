#!/usr/bin/env node

/**
 * Script pour appliquer la migration de la colonne numeroDossier
 * Ce script exécute directement les commandes SQL via l'API Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  console.error('\n📝 Veuillez configurer votre fichier .env avec les vraies valeurs')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Application de la migration numeroDossier...')

  try {
    // Étape 1: Ajouter la colonne numeroDossier
    console.log('📝 Étape 1: Ajout de la colonne numeroDossier...')

    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE folders ADD COLUMN IF NOT EXISTS numeroDossier TEXT UNIQUE;'
    })

    if (addColumnError) {
      console.error('❌ Erreur ajout colonne:', addColumnError)
      return
    }

    console.log('✅ Colonne numeroDossier ajoutée avec succès')

    // Étape 2: Créer l'index
    console.log('📝 Étape 2: Création de l\'index...')

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_folders_numero_dossier ON folders(numeroDossier);'
    })

    if (indexError) {
      console.warn('⚠️  Erreur index (peut-être déjà existant):', indexError.message)
    } else {
      console.log('✅ Index créé avec succès')
    }

    // Étape 3: Ajouter le commentaire
    console.log('📝 Étape 3: Ajout du commentaire...')

    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: `COMMENT ON COLUMN folders.numeroDossier IS 'Numéro de dossier comptable généré automatiquement avec format DOSS-ACGE-YYYYXXX';`
    })

    if (commentError) {
      console.warn('⚠️  Erreur commentaire:', commentError.message)
    } else {
      console.log('✅ Commentaire ajouté avec succès')
    }

    // Étape 4: Vérifier la structure
    console.log('📝 Étape 4: Vérification de la structure...')

    const { data: structure, error: structureError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'folders' AND column_name = 'numeroDossier'
        ORDER BY ordinal_position;
      `
    })

    if (structureError) {
      console.error('❌ Erreur vérification structure:', structureError)
      return
    }

    if (structure && structure.length > 0) {
      console.log('✅ Structure vérifiée:')
      console.log('   - Colonne:', structure[0].column_name)
      console.log('   - Type:', structure[0].data_type)
      console.log('   - Nullable:', structure[0].is_nullable)
      console.log('   - Défaut:', structure[0].column_default)
    } else {
      console.log('⚠️  Colonne non trouvée dans la structure')
    }

    console.log('\n🎉 Migration terminée avec succès!')
    console.log('💡 Vous pouvez maintenant utiliser la colonne numeroDossier dans la table folders')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

async function main() {
  console.log('🔧 Migration des numéros de dossiers ACGE')
  console.log('=' .repeat(50))

  await applyMigration()

  console.log('\n✅ Prochaine étape: Exécuter le script de migration des dossiers existants')
  console.log('💻 Commande: node scripts/migrate-folder-numbers.js')
}

// Lancer le script
main()
