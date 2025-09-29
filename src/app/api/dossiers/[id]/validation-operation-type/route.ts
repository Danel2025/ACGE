import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📋 API CONSULTATION VALIDATION TYPE D'OPÉRATION - ACGE
 * 
 * Récupère les données de validation du type d'opération pour consultation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    console.log('📋 Consultation validation type d\'opération pour dossier:', dossierId)
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer la validation du type d'opération avec toutes les relations
    // Prendre la plus récente validation en cas de multiples validations
    const { data: validation, error: validationError } = await admin
      .from('validations_cb')
      .select(`
        *,
        type_operation:type_operation_id(*),
        nature_operation:nature_operation_id(*),
        user:valide_par(id, name, email)
      `)
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (validationError) {
      console.error('❌ Erreur récupération validation:', validationError)
      return NextResponse.json(
        { 
          error: 'Erreur lors de la récupération de la validation',
          details: validationError.message
        },
        { status: 500 }
      )
    }

    if (!validation) {
      console.log('ℹ️ Aucune validation trouvée pour le dossier:', dossierId)
      return NextResponse.json(
        { 
          error: 'Aucune validation de type d\'opération trouvée pour ce dossier',
          details: 'Ce dossier n\'a pas encore été validé par le Contrôleur Budgétaire'
        },
        { status: 404 }
      )
    }

    // Récupérer les pièces justificatives validées
    const { data: piecesJustificatives, error: piecesError } = await admin
      .from('validations_pieces_justificatives')
      .select(`
        *,
        piece_justificative:piece_justificative_id(*)
      `)
      .eq('validation_cb_id', validation.id)

    if (piecesError) {
      console.error('❌ Erreur récupération pièces justificatives:', piecesError)
      // Ne pas faire échouer la requête pour les pièces justificatives
    }

    // Construire l'objet pieces_justificatives
    const piecesJustificativesObj = {}
    if (piecesJustificatives) {
      piecesJustificatives.forEach(piece => {
        if (piece.piece_justificative) {
          piecesJustificativesObj[piece.piece_justificative.nom] = piece.present
        }
      })
    }

    console.log('✅ Validation trouvée:', {
      id: validation.id,
      dossierId: validation.dossier_id,
      typeOperation: validation.type_operation?.nom,
      natureOperation: validation.nature_operation?.nom
    })
    
    return NextResponse.json({ 
      success: true,
      validation: {
        id: validation.id,
        dossier_id: validation.dossier_id,
        type_operation_id: validation.type_operation_id,
        nature_operation_id: validation.nature_operation_id,
        pieces_justificatives: piecesJustificativesObj,
        commentaire: validation.commentaire,
        created_at: validation.created_at,
        user_id: validation.valide_par,
        type_operation: validation.type_operation,
        nature_operation: validation.nature_operation,
        user: validation.user
      }
    })

  } catch (error) {
    console.error('❌ Erreur consultation validation type d\'opération:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la consultation de la validation',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}