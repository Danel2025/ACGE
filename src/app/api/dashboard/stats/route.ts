import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Dashboard stats - Début')
    
    const admin = getSupabaseAdmin()
    
    // Récupérer les statistiques depuis Supabase
    let totalDocuments = 0
    let totalFolders = 0
    let totalUsers = 0

    try {
      const { count: documentsCount } = await admin
        .from('documents')
        .select('*', { count: 'exact', head: true })
      totalDocuments = documentsCount || 0
    } catch (error) {
      console.error('Erreur comptage documents:', error)
    }

    try {
      const { count: foldersCount } = await admin
        .from('folders')
        .select('*', { count: 'exact', head: true })
      totalFolders = foldersCount || 0
    } catch (error) {
      console.error('Erreur comptage dossiers:', error)
    }

    try {
      const { count: usersCount } = await admin
        .from('users')
        .select('*', { count: 'exact', head: true })
      totalUsers = usersCount || 0
    } catch (error) {
      console.error('Erreur comptage utilisateurs:', error)
    }

    const stats = {
      totalDocuments,
      totalFolders,
      totalUsers,
      activeUsers: totalUsers,
      monthlyGrowthPercentage: 0,
      spaceUsed: {
        bytes: 0,
        gb: 0,
        percentage: 0,
        quota: 10 * 1024 * 1024 * 1024
      },
      recentDocuments: [],
      documentsThisMonth: 0,
      documentsLastMonth: 0
    }

    console.log('✅ Statistiques récupérées depuis Supabase:', stats)
    
    return NextResponse.json(stats)

  } catch (error) {
    console.error('Erreur API stats:', error)

    // Toujours retourner du JSON valide
    return NextResponse.json({
      totalDocuments: 0,
      totalFolders: 0,
      totalUsers: 0,
      activeUsers: 0,
      monthlyGrowthPercentage: 0,
      spaceUsed: {
        bytes: 0,
        gb: 0,
        percentage: 0,
        quota: 10 * 1024 * 1024 * 1024
      },
      recentDocuments: [],
      documentsThisMonth: 0,
      documentsLastMonth: 0,
      error: 'Erreur temporaire de la base de données'
    })
  }
}
