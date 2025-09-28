import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📊 API DOSSIERS SECRETAIRE REJECTED - ACGE
 *
 * Récupère les dossiers rejetés de la secrétaire connectée
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Récupération des dossiers rejetés de la secrétaire')

    const admin = getSupabaseAdmin()

    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Récupérer les dossiers rejetés par le CB (filtrés par secrétaire si nécessaire)
    const { data: dossiers, error } = await admin
      .from('dossiers')
      .select(`
        *,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .eq('statut', 'REJETÉ_CB')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('❌ Erreur Supabase dossiers rejetés secrétaire:', error)
      throw error
    }

    console.log(`📊 ${dossiers?.length || 0} dossiers rejetés trouvés`)

    // Enrichir les dossiers avec les noms de dossiers manquants
    if (dossiers && dossiers.length > 0) {
      for (const dossier of dossiers) {
        if (!dossier.foldername && dossier.folderid) {
          try {
            const { data: folder } = await admin
              .from('folders')
              .select('name, description')
              .eq('id', dossier.folderid)
              .single()

            if (folder) {
              dossier.foldername = folder.name
              dossier.folderDescription = folder.description
            }
          } catch (error) {
            console.warn(`⚠️ Impossible de récupérer le nom du dossier ${dossier.folderid}:`, error)
          }
        }
      }
    }

    // Mapper les données pour inclure les informations du dossier
    const dossiersWithFolderInfo = dossiers?.map(dossier => ({
      ...dossier,
      folderId: dossier.folderid, // Mapper folderid vers folderId pour compatibilité
      folderName: dossier.foldername || null,
      folderDescription: dossier.folderDescription || null
    })) || []

    // Log détaillé pour diagnostic
    if (dossiersWithFolderInfo && dossiersWithFolderInfo.length > 0) {
      console.log('📊 Détails des dossiers rejetés:')
      dossiersWithFolderInfo.forEach((dossier, index) => {
        console.log(`  ${index + 1}. ${dossier.numeroDossier}`)
        console.log(`     - Statut: ${dossier.statut}`)
        console.log(`     - Bénéficiaire: ${dossier.beneficiaire || 'Non défini'}`)
        console.log(`     - FolderId: ${dossier.folderId || 'Non défini'}`)
        console.log(`     - FolderName: ${dossier.folderName || 'Non défini'}`)
        console.log(`     - Créé: ${dossier.createdAt}`)
      })
    } else {
      console.log('📊 Aucun dossier rejeté trouvé')
    }
    
    return NextResponse.json({
      success: true,
      dossiers: dossiersWithFolderInfo,
      count: dossiersWithFolderInfo.length
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des dossiers rejetés de la secrétaire:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des dossiers rejetés',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
