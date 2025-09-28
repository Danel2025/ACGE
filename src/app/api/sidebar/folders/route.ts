import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { cache, CacheKeys } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    console.log('📁 Sidebar folders - Début')
    
    // Vérifier le cache d'abord
    const cached = cache.get<any[]>(CacheKeys.sidebarFolders)
    if (cached) {
      console.log('🎯 Sidebar folders depuis le cache')
      return NextResponse.json({ folders: cached })
    }
    
    // Récupérer les dossiers depuis la table dossiers
    let dossiers: any[] = []
    try {
      const admin = getSupabaseAdmin()
      const { data: dossierRows, error } = await admin
        .from('dossiers')
        .select('id, numeroDossier, objetOperation, statut, createdAt, updatedAt')
        .order('updatedAt', { ascending: false })
        .limit(10)

      if (error) throw error
      dossiers = dossierRows || []

      console.log('📁 Dossiers trouvés:', dossiers.length)

      // Transformer les données pour correspondre à l'interface
      // Récupérer 3 docs récents par dossier
      const admin2 = getSupabaseAdmin()
      const transformedFolders = await Promise.all(
        dossiers.map(async (dossier) => {
          // Récupérer les documents liés à ce dossier
          const { data: docs } = await admin2
            .from('documents')
            .select('id, title, updated_at')
            .eq('dossierId', dossier.id)
            .order('updated_at', { ascending: false })
            .limit(3)

          return {
            id: dossier.id,
            name: `${dossier.numeroDossier} - ${dossier.objetOperation}`,
            documentCount: docs?.length || 0,
            recentDocuments: (docs || []).map(doc => ({
              id: doc.id,
              title: doc.title,
              fileName: doc.title,
              fileType: 'application/octet-stream'
            }))
          }
        })
      )

      console.log('📁 Dossiers transformés:', transformedFolders.length)
      
      // Mettre en cache pour 2 minutes
      cache.set(CacheKeys.sidebarFolders, transformedFolders, 120000)
      
      return NextResponse.json({ folders: transformedFolders })

    } catch (dbError) {
      console.error('Erreur base de données sidebar dossiers:', dbError)
      return NextResponse.json({ folders: [] }, { status: 200 })
    }

  } catch (error) {
    console.error('Erreur API sidebar dossiers:', error)
    return NextResponse.json({ folders: [] }, { status: 200 })
  }
}
