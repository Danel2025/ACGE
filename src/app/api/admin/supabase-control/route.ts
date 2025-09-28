import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔧 ADMIN SUPABASE CONTROL - ACGE
 * 
 * Endpoint de démonstration du contrôle total de Supabase
 * Affiche toutes les capacités d'administration disponibles
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Démonstration du contrôle total Supabase...')
    
    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Service Supabase Admin indisponible' },
        { status: 503 }
      )
    }

    // 1. Informations sur la base de données
    const { data: tables, error: tablesError } = await admin
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .limit(20)

    // 2. Statistiques des utilisateurs
    const { data: users, error: usersError } = await admin
      .from('users')
      .select('id, name, email, role, createdAt')
      .order('createdAt', { ascending: false })

    // 3. Statistiques des dossiers
    const { data: folders, error: foldersError } = await admin
      .from('folders')
      .select('id, name, statut, createdAt')
      .order('createdAt', { ascending: false })
      .limit(10)

    // 4. Statistiques des documents
    const { data: documents, error: documentsError } = await admin
      .from('documents')
      .select('id, name, type, createdAt')
      .order('createdAt', { ascending: false })
      .limit(10)

    // 5. Statistiques des notifications
    const { data: notifications, error: notificationsError } = await admin
      .from('notifications')
      .select('id, type, message, createdAt, read')
      .order('createdAt', { ascending: false })
      .limit(10)

    // 6. Test de permissions RLS
    const { data: rlsTest, error: rlsError } = await admin
      .from('users')
      .select('count')
      .limit(1)

    const capabilities = {
      // Capacités de base de données
      database: {
        canConnect: !tablesError,
        tablesCount: tables?.length || 0,
        tables: tables?.map(t => t.table_name) || [],
        error: tablesError?.message
      },
      
      // Capacités utilisateurs
      users: {
        canRead: !usersError,
        count: users?.length || 0,
        users: users?.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt
        })) || [],
        error: usersError?.message
      },
      
      // Capacités dossiers
      folders: {
        canRead: !foldersError,
        count: folders?.length || 0,
        recent: folders?.map(f => ({
          id: f.id,
          name: f.name,
          statut: f.statut,
          createdAt: f.createdAt
        })) || [],
        error: foldersError?.message
      },
      
      // Capacités documents
      documents: {
        canRead: !documentsError,
        count: documents?.length || 0,
        recent: documents?.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          createdAt: d.createdAt
        })) || [],
        error: documentsError?.message
      },
      
      // Capacités notifications
      notifications: {
        canRead: !notificationsError,
        count: notifications?.length || 0,
        recent: notifications?.map(n => ({
          id: n.id,
          type: n.type,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt
        })) || [],
        error: notificationsError?.message
      },
      
      // Capacités RLS
      rls: {
        canBypass: !rlsError,
        error: rlsError?.message
      }
    }

    // Actions administratives possibles
    const adminActions = [
      'Créer/modifier/supprimer des utilisateurs',
      'Gérer les rôles et permissions',
      'Accéder à toutes les données (bypass RLS)',
      'Gérer les dossiers et documents',
      'Contrôler les notifications',
      'Exécuter des requêtes SQL arbitraires',
      'Gérer les politiques de sécurité',
      'Accéder aux logs et métriques',
      'Gérer les extensions et fonctions',
      'Contrôler les triggers et procédures'
    ]

    console.log('✅ Contrôle total Supabase démontré avec succès')

    return NextResponse.json({
      success: true,
      message: 'Contrôle total de Supabase démontré',
      timestamp: new Date().toISOString(),
      capabilities,
      adminActions,
      summary: {
        totalTables: capabilities.database.tablesCount,
        totalUsers: capabilities.users.count,
        totalFolders: capabilities.folders.count,
        totalDocuments: capabilities.documents.count,
        totalNotifications: capabilities.notifications.count,
        rlsBypass: capabilities.rls.canBypass
      }
    })

  } catch (error) {
    console.error('❌ Erreur contrôle Supabase:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la démonstration du contrôle Supabase',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
