import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔍 API STATUT VALIDATIONS DOSSIER - ACGE
 *
 * Vérifie le statut complet des validations CB pour un dossier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id

    console.log('🔍 Vérification du statut complet des validations pour dossier:', dossierId)

    const admin = getSupabaseAdmin()

    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Vérifier les validations du type d'opération
    const { data: validationsCB, error: cbError } = await admin
      .from('validations_cb')
      .select('id, type_operation_id, nature_operation_id, created_at')
      .eq('dossier_id', dossierId)
      .limit(1)

    console.log('🔍 Validations CB trouvées:', {
      validationsCB,
      count: validationsCB?.length || 0,
      cbError
    })

    // Vérifier les validations des contrôles de fond
    const { data: validationsControles, error: controlesError } = await admin
      .from('validations_controles_fond')
      .select('id, controle_fond_id, valide, created_at')
      .eq('dossier_id', dossierId)
      .limit(5)

    console.log('🔍 Validations contrôles de fond trouvées:', {
      validationsControles,
      count: validationsControles?.length || 0,
      controlesError
    })

    // Calculer le statut
    const hasOperationTypeValidation = !cbError && validationsCB && validationsCB.length > 0
    const hasControlesFondValidation = !controlesError && validationsControles && validationsControles.length > 0

    const missingValidations: string[] = []
    if (!hasOperationTypeValidation) {
      missingValidations.push('Validation du type d\'opération')
    }
    if (!hasControlesFondValidation) {
      missingValidations.push('Contrôles de fond')
    }

    const result = {
      hasOperationTypeValidation,
      hasControlesFondValidation,
      canValidate: hasOperationTypeValidation && hasControlesFondValidation,
      missingValidations,
      details: {
        operationTypeCount: validationsCB?.length || 0,
        controlesFondCount: validationsControles?.length || 0,
        lastOperationTypeValidation: validationsCB?.[0]?.created_at || null,
        lastControlesFondValidation: validationsControles?.[0]?.created_at || null
      }
    }

    console.log('✅ Statut final calculé:', result)

    return NextResponse.json({
      success: true,
      status: result
    })

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut des validations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la vérification du statut',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}