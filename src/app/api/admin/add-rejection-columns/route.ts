import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔧 API ADMIN - Ajouter les colonnes de rejet
 * 
 * Route administrative pour ajouter les colonnes manquantes à la table dossiers
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [ADMIN] Ajout des colonnes de rejet...')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Essayer de vérifier les colonnes en testant une requête simple
    let existingColumns = []
    
    try {
      // Tenter de sélectionner les colonnes de rejet pour voir si elles existent
      const { data: testData, error: testError } = await admin
        .from('dossiers')
        .select('rejectedAt, rejectionReason, rejectionDetails')
        .limit(1)
      
      if (!testError) {
        // Les colonnes existent
        existingColumns = ['rejectedAt', 'rejectionReason', 'rejectionDetails']
        console.log('📋 Toutes les colonnes de rejet existent déjà')
        
        return NextResponse.json({
          success: true,
          message: 'Toutes les colonnes de rejet existent déjà',
          existingColumns: existingColumns
        })
      } else {
        console.log('📋 Colonnes de rejet manquantes, erreur attendue:', testError.message)
      }
    } catch (error) {
      console.log('📋 Erreur lors de la vérification (attendu):', error)
    }
    
    // Pour l'instant, on ne peut pas ajouter les colonnes via l'API Supabase standard
    // car elle ne supporte pas les requêtes DDL (ALTER TABLE)
    console.log('⚠️ Impossible d\'ajouter les colonnes via l\'API Supabase standard')
    console.log('💡 Solution: Utilisez l\'interface Supabase ou exécutez le SQL directement')
    
    return NextResponse.json({
      success: false,
      message: 'Impossible d\'ajouter les colonnes via l\'API. Utilisez l\'interface Supabase.',
      requiredColumns: ['rejectedAt', 'rejectionReason', 'rejectionDetails'],
      existingColumns: existingColumnNames,
      sqlToExecute: `
        ALTER TABLE dossiers 
        ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
        ADD COLUMN IF NOT EXISTS "rejectionDetails" TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_dossiers_rejected_at ON dossiers("rejectedAt");
        CREATE INDEX IF NOT EXISTS idx_dossiers_rejection_reason ON dossiers("rejectionReason");
      `
    })
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return NextResponse.json(
      { error: 'Erreur inattendue lors de l\'ajout des colonnes' },
      { status: 500 }
    )
  }
}
