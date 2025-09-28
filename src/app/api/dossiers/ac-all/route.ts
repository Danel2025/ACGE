import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📊 API DOSSIERS AC ALL - ACGE
 * 
 * Récupère tous les dossiers pertinents pour l'Agent Comptable :
 * - VALIDÉ_ORDONNATEUR : En attente de validation définitive
 * - VALIDÉ_DÉFINITIVEMENT : Validés définitivement
 * - TERMINÉ : Terminés
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Récupération de tous les dossiers AC')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer les dossiers pertinents pour l'AC
    const { data: dossiers, error } = await admin
      .from('dossiers')
      .select(`
        *,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .in('statut', ['VALIDÉ_ORDONNATEUR', 'VALIDÉ_DÉFINITIVEMENT', 'TERMINÉ'])
      .order('createdAt', { ascending: false })

    // Enrichir les dossiers avec les noms de dossiers manquants
    if (dossiers && dossiers.length > 0) {
      for (const dossier of dossiers) {
        if (!dossier.foldername && dossier.folderId) {
          try {
            const { data: folder } = await admin
              .from('folders')
              .select('name')
              .eq('id', dossier.folderId)
              .single()
            
            if (folder) {
              dossier.foldername = folder.name
            }
          } catch (error) {
            console.warn(`⚠️ Impossible de récupérer le nom du dossier ${dossier.folderId}:`, error)
          }
        }
      }
    }

    if (error) {
      console.error('❌ Erreur Supabase dossiers AC:', error)
      throw error
    }

    console.log(`📊 ${dossiers?.length || 0} dossiers AC trouvés`)
    
    return NextResponse.json({ 
      success: true, 
      dossiers: dossiers || [],
      count: dossiers?.length || 0
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des dossiers AC:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des dossiers AC',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
