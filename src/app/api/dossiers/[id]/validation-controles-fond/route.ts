import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📋 API CONSULTATION VALIDATION CONTRÔLES DE FOND - ACGE
 * 
 * Récupère les données de validation des contrôles de fond pour consultation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    console.log('📋 Consultation validation contrôles de fond pour dossier:', dossierId)
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer les validations des contrôles de fond avec les relations
    console.log('🔍 Recherche des validations pour dossier_id:', dossierId)

    const { data: validations, error: validationsError } = await admin
      .from('validations_controles_fond')
      .select(`
        *,
        controle:controles_fond!controle_fond_id(
          *,
          categorie:categories_controles_fond(*)
        )
      `)
      .eq('dossier_id', dossierId)

    console.log('🔍 Résultat requête validations:', {
      validations: validations,
      count: validations?.length || 0,
      error: validationsError
    })

    if (validationsError) {
      console.error('❌ Erreur récupération validations contrôles de fond:', validationsError)
      return NextResponse.json(
        {
          error: 'Erreur lors de la récupération des validations',
          details: validationsError.message
        },
        { status: 500 }
      )
    }

    if (!validations || validations.length === 0) {
      console.log('ℹ️ Aucune validation de contrôles de fond trouvée pour le dossier:', dossierId)

      // Debug: Vérifier s'il y a des validations dans la table
      const { data: allValidations, error: debugError } = await admin
        .from('validations_controles_fond')
        .select('dossier_id, created_at')
        .limit(10)

      console.log('🔍 Debug - Toutes les validations dans la table:', {
        allValidations,
        count: allValidations?.length || 0,
        debugError
      })

      return NextResponse.json(
        {
          error: 'Aucune validation de contrôles de fond trouvée pour ce dossier',
          details: 'Ce dossier n\'a pas encore été validé par le Contrôleur Budgétaire'
        },
        { status: 404 }
      )
    }

    console.log('✅ Validations trouvées:', {
      dossierId,
      count: validations?.length || 0
    })
    
    return NextResponse.json({ 
      success: true,
      validations: validations || [],
      commentaire_general: '' // Pas de commentaire général dans cette structure
    })

  } catch (error) {
    console.error('❌ Erreur consultation validation contrôles de fond:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la consultation des validations',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}