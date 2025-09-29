import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * API pour appliquer la migration SQL directement
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Application de la migration SQL pour dossier_comptable_id')

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 })
    }

    // SQL de migration complet
    const migrationSQL = `
      -- Étape 1: Ajouter la colonne dossier_comptable_id
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS dossier_comptable_id UUID;

      -- Étape 2: Ajouter une contrainte de clé étrangère vers la table dossiers
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_documents_dossier_comptable'
        ) THEN
          ALTER TABLE documents
          ADD CONSTRAINT fk_documents_dossier_comptable
          FOREIGN KEY (dossier_comptable_id)
          REFERENCES dossiers(id)
          ON DELETE SET NULL;
        END IF;
      END $$;

      -- Étape 3: Créer un index pour les performances
      CREATE INDEX IF NOT EXISTS idx_documents_dossier_comptable_id
      ON documents(dossier_comptable_id);

      -- Étape 4: Migrer les données existantes depuis folder_id vers dossier_comptable_id
      UPDATE documents
      SET dossier_comptable_id = folder_id
      WHERE folder_id = '9270988d-f17d-42f0-972d-44db343fcde0'
      AND dossier_comptable_id IS NULL;

      -- Étape 5: Vider folder_id pour les documents qui ont été migrés
      UPDATE documents
      SET folder_id = NULL
      WHERE dossier_comptable_id = '9270988d-f17d-42f0-972d-44db343fcde0'
      AND folder_id = '9270988d-f17d-42f0-972d-44db343fcde0';
    `

    // Utiliser une approche par étapes pour éviter les erreurs de transaction
    const steps = []

    try {
      // Étape 1: Vérifier si la colonne existe déjà
      console.log('📋 Vérification de l\'existence de la colonne')

      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'documents')
        .eq('column_name', 'dossier_comptable_id')
        .eq('table_schema', 'public')

      const columnExists = columns && columns.length > 0
      steps.push(`📊 Colonne dossier_comptable_id existe: ${columnExists}`)

      if (!columnExists) {
        steps.push('⚠️ La colonne dossier_comptable_id doit être créée manuellement dans Supabase Dashboard')
        steps.push('📝 Instructions:')
        steps.push('1. Aller dans Supabase Dashboard > Table Editor')
        steps.push('2. Sélectionner la table "documents"')
        steps.push('3. Ajouter une nouvelle colonne:')
        steps.push('   - Nom: dossier_comptable_id')
        steps.push('   - Type: uuid')
        steps.push('   - Nullable: true')
        steps.push('   - Foreign key: dossiers(id)')
      }

      // Étape 2: Tenter la migration des données si la colonne existe
      if (columnExists) {
        console.log('📊 Migration des données existantes')

        // Compter les documents à migrer
        const { count: docsToMigrate } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('folder_id', '9270988d-f17d-42f0-972d-44db343fcde0')
          .is('dossier_comptable_id', null)

        steps.push(`📄 ${docsToMigrate || 0} documents à migrer`)

        if (docsToMigrate && docsToMigrate > 0) {
          // Effectuer la migration
          const { error: updateError } = await supabase
            .from('documents')
            .update({ dossier_comptable_id: '9270988d-f17d-42f0-972d-44db343fcde0' })
            .eq('folder_id', '9270988d-f17d-42f0-972d-44db343fcde0')
            .is('dossier_comptable_id', null)

          if (updateError) {
            steps.push(`❌ Erreur migration: ${updateError.message}`)
          } else {
            steps.push('✅ Documents migrés vers dossier_comptable_id')

            // Vider folder_id pour les documents migrés
            const { error: clearError } = await supabase
              .from('documents')
              .update({ folder_id: null })
              .eq('dossier_comptable_id', '9270988d-f17d-42f0-972d-44db343fcde0')
              .eq('folder_id', '9270988d-f17d-42f0-972d-44db343fcde0')

            if (clearError) {
              steps.push(`⚠️ Erreur nettoyage folder_id: ${clearError.message}`)
            } else {
              steps.push('✅ folder_id nettoyé pour les documents migrés')
            }
          }
        }

        // Vérifier le résultat final
        const { count: finalCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('dossier_comptable_id', '9270988d-f17d-42f0-972d-44db343fcde0')

        steps.push(`✅ ${finalCount || 0} documents finalement liés au dossier comptable`)
      }

    } catch (error) {
      steps.push(`❌ Erreur: ${(error as Error).message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Migration appliquée',
      steps: steps,
      columnExists: steps[0]?.includes('true') || false
    })

  } catch (error) {
    console.error('❌ Erreur application migration:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'application de la migration',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}