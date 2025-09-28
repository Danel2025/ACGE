import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 💳 API PAIEMENT DOSSIER - ACGE
 * 
 * Enregistre un paiement pour un dossier
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    console.log('💳 Paiement du dossier:', dossierId)
    
    const body = await request.json()
    const { montant, reference, commentaire } = body
    
    if (!montant || montant <= 0) {
      return NextResponse.json(
        { error: 'Le montant est requis et doit être positif' },
        { status: 400 }
      )
    }
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Vérifier que le dossier existe et est ordonné
    const { data: existingDossier, error: checkError } = await admin
      .from('dossiers')
      .select('id, statut')
      .eq('id', dossierId)
      .single()

    if (checkError || !existingDossier) {
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    if (existingDossier.statut !== 'VALIDÉ_ORDONNATEUR') {
      return NextResponse.json(
        { error: 'Ce dossier doit être ordonné avant d\'être payé' },
        { status: 400 }
      )
    }
    
    // Mettre à jour le statut du dossier
    const { data: updatedDossier, error: updateError } = await admin
      .from('dossiers')
      .update({
        statut: 'PAYÉ',
        updatedAt: new Date().toISOString()
        // On pourrait ajouter des champs pour stocker les détails du paiement
        // montantPaiement: montant,
        // referencePaiement: reference,
        // commentairePaiement: commentaire
      })
      .eq('id', dossierId)
      .select(`
        *,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .single()

    if (updateError) {
      console.error('❌ Erreur paiement dossier:', updateError)
      throw updateError
    }

    console.log('💳 Dossier payé:', updatedDossier.numeroDossier, 'Montant:', montant)
    
    return NextResponse.json({ 
      success: true, 
      dossier: updatedDossier,
      message: 'Paiement enregistré avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur lors du paiement du dossier:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors du paiement du dossier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
