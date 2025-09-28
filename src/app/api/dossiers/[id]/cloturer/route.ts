import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * ✅ API CLÔTURE DOSSIER - ACGE
 * 
 * Clôture un dossier
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    console.log('✅ Clôture du dossier:', dossierId)
    
    const body = await request.json()
    const { commentaire } = body
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Vérifier que le dossier existe et peut être clôturé
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

    if (!['PAYÉ', 'RECETTE_ENREGISTRÉE'].includes(existingDossier.statut)) {
      return NextResponse.json(
        { error: 'Ce dossier doit être payé ou avoir une recette enregistrée avant d\'être clôturé' },
        { status: 400 }
      )
    }
    
    // Mettre à jour le statut du dossier
    const { data: updatedDossier, error: updateError } = await admin
      .from('dossiers')
      .update({
        statut: 'TERMINÉ',
        updatedAt: new Date().toISOString()
        // On pourrait ajouter un champ pour stocker le commentaire de clôture
        // commentaireCloture: commentaire
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
      console.error('❌ Erreur clôture dossier:', updateError)
      throw updateError
    }

    console.log('✅ Dossier clôturé:', updatedDossier.numeroDossier)
    
    return NextResponse.json({ 
      success: true, 
      dossier: updatedDossier,
      message: 'Dossier clôturé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur lors de la clôture du dossier:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la clôture du dossier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
