import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📊 API DOSSIERS CB ALL - ACGE
 * 
 * Récupère tous les dossiers pour le Contrôleur Budgétaire (tous statuts)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Récupération de tous les dossiers CB')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer tous les dossiers (tous statuts)
    const { data: dossiers, error } = await admin
      .from('dossiers')
      .select(`
        id,
        numeroDossier,
        numeroNature,
        objetOperation,
        beneficiaire,
        statut,
        createdAt,
        updatedAt,
        posteComptableId,
        natureDocumentId,
        secretaireId,
        folderid,
        montant,
        montantordonnance,
        validatedat,
        commentaires,
        dateordonnancement,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .order('createdAt', { ascending: false })

    // Les dossiers contiennent maintenant directement toutes les informations nécessaires
    // Plus besoin de JOIN avec la table folders

    if (error) {
      console.error('❌ Erreur Supabase dossiers CB:', error)
      throw error
    }

    console.log(`📊 ${dossiers?.length || 0} dossiers CB trouvés`)

    // Enrichir les dossiers avec les champs attendus par le CB dashboard
    const enrichedDossiers = (dossiers || []).map((dossier: any) => ({
      ...dossier,
      dateDepot: dossier.createdAt, // Mapper createdAt vers dateDepot pour compatibilité CB
      folderId: dossier.folderid, // Mapper folderid vers folderId pour compatibilité
      foldername: dossier.numeroDossier // Utiliser numeroDossier comme nom du dossier
    }))

    // Log détaillé pour diagnostic
    if (enrichedDossiers && enrichedDossiers.length > 0) {
      console.log('📊 Détails des dossiers:')
      enrichedDossiers.forEach((dossier, index) => {
        console.log(`  ${index + 1}. ${dossier.numeroDossier} - Statut: ${dossier.statut} - Créé: ${dossier.createdAt}`)
      })
    } else {
      console.log('📊 Aucun dossier trouvé')
    }

    return NextResponse.json({
      success: true,
      dossiers: enrichedDossiers,
      count: enrichedDossiers?.length || 0
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des dossiers CB:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des dossiers',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
