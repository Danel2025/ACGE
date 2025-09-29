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
        foldername,
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

    if (error) {
      console.error('❌ Erreur Supabase dossiers CB:', error)
      throw error
    }

    console.log(`📊 ${dossiers?.length || 0} dossiers CB trouvés`)

    // Récupérer les noms des dossiers de fichiers
    const folderIds = dossiers?.map(d => d.folderid).filter(Boolean) || []
    let folders: any[] = []

    if (folderIds.length > 0) {
      const { data: foldersData, error: foldersError } = await admin
        .from('folders')
        .select('id, name')
        .in('id', folderIds)

      if (foldersError) {
        console.warn('⚠️ Erreur lors de la récupération des noms de dossiers:', foldersError)
      } else {
        folders = foldersData || []
      }
    }

    // Créer un map des noms de dossiers
    const folderNamesMap = folders.reduce((acc, folder) => {
      acc[folder.id] = folder.name
      return acc
    }, {} as Record<string, string>)

    // Enrichir les dossiers avec les champs attendus par le CB dashboard
    const enrichedDossiers = (dossiers || []).map((dossier: any) => ({
      ...dossier,
      dateDepot: dossier.createdAt, // Mapper createdAt vers dateDepot pour compatibilité CB
      folderId: dossier.folderid, // Mapper folderid vers folderId pour compatibilité
      // Utiliser le vrai nom du dossier (foldername) en priorité, puis fallback basé sur l'objet
      foldername: dossier.foldername || `Dossier ${dossier.objetOperation?.substring(0, 20)}...` || 'Sans nom',
      // Garder aussi le nom du dossier de fichiers si nécessaire
      folderFilesName: dossier.folderid ? (folderNamesMap[dossier.folderid] || null) : null
    }))

    // Log détaillé pour diagnostic
    if (enrichedDossiers && enrichedDossiers.length > 0) {
      console.log('📊 Détails des dossiers:')
      enrichedDossiers.forEach((dossier, index) => {
        console.log(`  ${index + 1}. ${dossier.numeroDossier} - Statut: ${dossier.statut} - Nom: "${dossier.foldername}" - FolderId: ${dossier.folderId}`)
      })
    } else {
      console.log('📊 Aucun dossier trouvé')
    }

    console.log('📁 Dossiers de fichiers trouvés:', folders.length)
    if (folders.length > 0) {
      folders.forEach(folder => {
        console.log(`  📁 ${folder.id}: "${folder.name}"`)
      })
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
