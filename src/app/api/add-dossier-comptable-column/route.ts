import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * API temporaire pour ajouter la colonne dossier_comptable_id à la table documents
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Ajout de la colonne dossier_comptable_id à la table documents')

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 })
    }

    // Vérifier si la colonne existe déjà
    const { data: columns } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'documents'
        AND column_name = 'dossier_comptable_id'
        AND table_schema = 'public';
      `
    })

    if (columns && columns.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'La colonne dossier_comptable_id existe déjà'
      })
    }

    // Ajouter la colonne
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Ajouter la colonne dossier_comptable_id
        ALTER TABLE documents
        ADD COLUMN IF NOT EXISTS dossier_comptable_id UUID;

        -- Ajouter une contrainte de clé étrangère vers la table dossiers
        ALTER TABLE documents
        ADD CONSTRAINT fk_documents_dossier_comptable
        FOREIGN KEY (dossier_comptable_id)
        REFERENCES dossiers(id)
        ON DELETE SET NULL;

        -- Créer un index pour les performances
        CREATE INDEX IF NOT EXISTS idx_documents_dossier_comptable_id
        ON documents(dossier_comptable_id);
      `
    })

    if (addColumnError) {
      console.error('❌ Erreur lors de l\'ajout de la colonne:', addColumnError)
      return NextResponse.json({
        error: 'Erreur lors de l\'ajout de la colonne',
        details: addColumnError.message
      }, { status: 500 })
    }

    console.log('✅ Colonne dossier_comptable_id ajoutée avec succès')
    return NextResponse.json({
      success: true,
      message: 'Colonne dossier_comptable_id ajoutée avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'exécution',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}