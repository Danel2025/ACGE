import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('📝 Mise à jour simple du dossier:', id)

    const body = await request.json()
    const {
      foldername,
      numeroNature,
      objetOperation,
      beneficiaire,
      posteComptableId,
      natureDocumentId
    } = body

    const admin = getSupabaseAdmin()

    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Vérifier que le dossier existe
    const { data: existingDossier, error: checkError } = await admin
      .from('dossiers')
      .select('id, statut')
      .eq('id', id)
      .single()

    if (checkError || !existingDossier) {
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le dossier peut être modifié
    if (!['EN_ATTENTE', 'REJETÉ_CB', 'BROUILLON'].includes(existingDossier.statut)) {
      return NextResponse.json(
        {
          error: 'Ce dossier ne peut pas être modifié',
          details: `Statut actuel: ${existingDossier.statut}`
        },
        { status: 400 }
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    if (foldername !== undefined) updateData.foldername = foldername
    if (numeroNature !== undefined) updateData.numeroNature = numeroNature
    if (objetOperation !== undefined) updateData.objetOperation = objetOperation
    if (beneficiaire !== undefined) updateData.beneficiaire = beneficiaire
    if (posteComptableId !== undefined) updateData.posteComptableId = posteComptableId
    if (natureDocumentId !== undefined) updateData.natureDocumentId = natureDocumentId

    console.log('📝 Données de mise à jour:', updateData)

    // Mettre à jour le dossier
    const { data: updatedDossier, error: updateError } = await admin
      .from('dossiers')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError)
      return NextResponse.json(
        {
          error: 'Erreur lors de la mise à jour',
          details: updateError.message
        },
        { status: 500 }
      )
    }

    console.log('✅ Dossier mis à jour avec succès')

    return NextResponse.json({
      success: true,
      dossier: updatedDossier,
      message: 'Dossier mis à jour avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du dossier:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour du dossier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}