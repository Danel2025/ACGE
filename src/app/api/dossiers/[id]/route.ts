import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📄 API DOSSIER SINGLE - ACGE
 * 
 * Récupère un dossier spécifique par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id

    console.log('📄 Récupération du dossier:', dossierId)

    const admin = getSupabaseAdmin()

    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Récupérer le dossier avec toutes les informations
    const { data: dossier, error } = await admin
      .from('dossiers')
      .select(`
        *,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .eq('id', dossierId)
      .single()

    if (error) {
      console.error('❌ Erreur récupération dossier:', error)
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    console.log('✅ Dossier trouvé:', {
      id: dossier.id,
      numero: dossier.numeroDossier,
      statut: dossier.statut,
      createdAt: dossier.createdAt
    })

    return NextResponse.json({
      success: true,
      dossier
    })

  } catch (error) {
    console.error('❌ Erreur API dossier single:', error)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id

    console.log('📝 Mise à jour du dossier:', dossierId)

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
      .eq('id', dossierId)
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
      .eq('id', dossierId)
      .select(`
        *,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id

    console.log('🗑️ Suppression du dossier:', dossierId)

    const admin = getSupabaseAdmin()

    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Vérifier que le dossier existe et récupérer ses informations
    const { data: dossier, error: checkError } = await admin
      .from('dossiers')
      .select('id, numeroDossier, statut')
      .eq('id', dossierId)
      .single()

    if (checkError || !dossier) {
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le dossier est en statut BROUILLON (seulement les brouillons peuvent être supprimés)
    if (dossier.statut !== 'BROUILLON') {
      return NextResponse.json(
        { error: 'Seuls les dossiers en brouillon peuvent être supprimés' },
        { status: 403 }
      )
    }

    // Supprimer d'abord les documents associés (désassocier seulement, ne pas supprimer les fichiers)
    const { error: documentsError } = await admin
      .from('documents')
      .update({ folder_id: null })
      .eq('folder_id', dossierId)

    if (documentsError) {
      console.warn('⚠️ Erreur lors de la désassociation des documents:', documentsError)
      // Continuer malgré l'erreur car les documents peuvent ne pas exister
    }

    // Supprimer le dossier
    const { error: deleteError } = await admin
      .from('dossiers')
      .delete()
      .eq('id', dossierId)

    if (deleteError) {
      console.error('❌ Erreur suppression dossier:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du dossier' },
        { status: 500 }
      )
    }

    console.log('✅ Dossier supprimé:', dossier.numeroDossier)

    return NextResponse.json({
      success: true,
      message: `Dossier ${dossier.numeroDossier} supprimé avec succès`
    })

  } catch (error) {
    console.error('❌ Erreur API suppression dossier:', error)
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