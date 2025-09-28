import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * ✅ API VALIDATION TYPE D'OPÉRATION - ACGE
 * 
 * Valide un dossier avec le type d'opération et les pièces justificatives
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    console.log('✅ Validation type d\'opération pour dossier:', dossierId)
    
    // Récupérer l'utilisateur depuis les headers (passé par le client)
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Informations utilisateur manquantes' },
        { status: 401 }
      )
    }
    
    // Vérifier que l'utilisateur est un CB
    if (userRole !== 'CONTROLEUR_BUDGETAIRE') {
      return NextResponse.json(
        { error: 'Accès non autorisé - Rôle CB requis' },
        { status: 403 }
      )
    }
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Vérifier que l'utilisateur existe dans la base de données
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      console.error('❌ Utilisateur non trouvé:', userId, userError)
      return NextResponse.json(
        { error: 'Utilisateur non trouvé dans la base de données' },
        { status: 404 }
      )
    }
    
    // Vérifier que l'utilisateur est bien un CB
    if (user.role !== 'CONTROLEUR_BUDGETAIRE') {
      return NextResponse.json(
        { error: 'Accès non autorisé - Rôle CB requis' },
        { status: 403 }
      )
    }
    
    // Récupérer les données de validation
    const body = await request.json()
    const {
      type_operation_id,
      nature_operation_id,
      pieces_justificatives,
      commentaire
    } = body
    
    // Validation des données requises
    if (!type_operation_id || !nature_operation_id) {
      return NextResponse.json(
        { error: 'Type d\'opération et nature d\'opération requis' },
        { status: 400 }
      )
    }
    
    // Vérifier que le dossier existe et est en attente
    const { data: dossier, error: dossierError } = await admin
      .from('dossiers')
      .select('*')
      .eq('id', dossierId)
      .single()
    
    if (dossierError || !dossier) {
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }
    
    if (dossier.statut !== 'EN_ATTENTE') {
      return NextResponse.json(
        { error: 'Seuls les dossiers en attente peuvent être validés' },
        { status: 400 }
      )
    }
    
    // Vérifier que le type et la nature existent
    const { data: typeOperation, error: typeError } = await admin
      .from('types_operations')
      .select('*')
      .eq('id', type_operation_id)
      .eq('actif', true)
      .single()
    
    if (typeError || !typeOperation) {
      return NextResponse.json(
        { error: 'Type d\'opération non trouvé' },
        { status: 400 }
      )
    }
    
    const { data: natureOperation, error: natureError } = await admin
      .from('natures_operations')
      .select('*')
      .eq('id', nature_operation_id)
      .eq('type_operation_id', type_operation_id)
      .eq('actif', true)
      .single()
    
    if (natureError || !natureOperation) {
      return NextResponse.json(
        { error: 'Nature d\'opération non trouvée' },
        { status: 400 }
      )
    }
    
    // Récupérer les pièces justificatives obligatoires
    const { data: piecesObligatoires, error: piecesError } = await admin
      .from('pieces_justificatives')
      .select('*')
      .eq('nature_operation_id', nature_operation_id)
      .eq('obligatoire', true)
      .eq('actif', true)
    
    if (piecesError) {
      console.error('❌ Erreur lors de la récupération des pièces obligatoires:', piecesError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des pièces justificatives' },
        { status: 500 }
      )
    }
    
    // Vérifier que toutes les pièces obligatoires sont présentes
    const piecesManquantes = piecesObligatoires.filter(piece => 
      !pieces_justificatives[piece.id]?.present
    )
    
    if (piecesManquantes.length > 0) {
      return NextResponse.json(
        { 
          error: 'Pièces justificatives obligatoires manquantes',
          details: piecesManquantes.map(p => p.nom)
        },
        { status: 400 }
      )
    }
    
    // Créer la validation CB
    const { data: validationCb, error: validationError } = await admin
      .from('validations_cb')
      .insert({
        dossier_id: dossierId,
        type_operation_id,
        nature_operation_id,
        commentaire,
        statut: 'VALIDÉ',
        valide_par: userId,
        valide_le: new Date().toISOString()
      })
      .select()
      .single()
    
    if (validationError) {
      console.error('❌ Erreur lors de la création de la validation CB:', validationError)
      return NextResponse.json(
        { error: 'Erreur lors de la validation' },
        { status: 500 }
      )
    }
    
    // Créer les validations des pièces justificatives
    const validationsPieces = Object.entries(pieces_justificatives).map(([pieceId, data]) => ({
      validation_cb_id: validationCb.id,
      piece_justificative_id: pieceId,
      present: data.present,
      commentaire: data.commentaire || null
    }))
    
    if (validationsPieces.length > 0) {
      const { error: piecesValidationError } = await admin
        .from('validations_pieces_justificatives')
        .insert(validationsPieces)
      
      if (piecesValidationError) {
        console.error('❌ Erreur lors de la création des validations de pièces:', piecesValidationError)
        // Ne pas faire échouer la validation pour cette erreur
      }
    }
    
    // Ne pas mettre à jour le statut du dossier ici
    // Le dossier ne sera validé qu'après les deux validations (type d'opération + contrôles de fond)
    // Le statut reste 'EN_ATTENTE' jusqu'à ce que les contrôles de fond soient également validés
    
    console.log('✅ Validation type d\'opération terminée avec succès')
    
    return NextResponse.json({
      success: true,
      message: 'Validation enregistrée avec succès',
      validation: validationCb
    })
    
  } catch (error) {
    console.error('❌ Erreur API validation type d\'opération:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * ✅ API CONSULTATION VALIDATION TYPE D'OPÉRATION - ACGE
 * 
 * Récupère la validation d'un dossier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer la validation CB
    const { data: validation, error: validationError } = await admin
      .from('validations_cb')
      .select(`
        *,
        type_operation:types_operations(*),
        nature_operation:natures_operations(*),
        validations_pieces:validations_pieces_justificatives(
          *,
          piece_justificative:pieces_justificatives(*)
        )
      `)
      .eq('dossier_id', dossierId)
      .single()
    
    if (validationError || !validation) {
      return NextResponse.json(
        { error: 'Validation non trouvée' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      validation
    })
    
  } catch (error) {
    console.error('❌ Erreur API consultation validation:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
