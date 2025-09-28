import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('📤 Soumission du dossier:', id)

    const admin = getSupabaseAdmin()

    // Vérifier que le dossier existe et est en statut BROUILLON
    const { data: existingDossier, error: checkError } = await admin
      .from('dossiers')
      .select('id, numeroDossier, statut')
      .eq('id', id)
      .single()

    if (checkError || !existingDossier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dossier non trouvé'
        },
        { status: 404 }
      )
    }

    if (existingDossier.statut !== 'BROUILLON') {
      return NextResponse.json(
        {
          success: false,
          error: `Ce dossier ne peut pas être soumis (statut actuel: ${existingDossier.statut})`
        },
        { status: 400 }
      )
    }

    // Mettre à jour le statut vers EN_ATTENTE
    const { data: updatedDossier, error: updateError } = await admin
      .from('dossiers')
      .update({
        statut: 'EN_ATTENTE',
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    console.log(`✅ Dossier ${existingDossier.numeroDossier} soumis avec succès`)

    return NextResponse.json({
      success: true,
      dossier: updatedDossier,
      message: `Dossier ${existingDossier.numeroDossier} soumis avec succès`
    })

  } catch (error) {
    console.error('❌ Erreur lors de la soumission du dossier:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la soumission du dossier',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}