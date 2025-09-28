import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Début du diagnostic API...')
    
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configuré' : '❌ Non configuré',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configuré' : '❌ Non configuré',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configuré' : '❌ Non configuré'
      },
      database: {
        connection: 'En cours de test...',
        tables: 'En cours de test...',
        users: 'En cours de test...'
      }
    }

    // Test de connexion Supabase
    try {
      console.log('🔌 Test de connexion Supabase...')
      const supabase = getSupabaseAdmin()
      
      // Test simple de connexion
      const { data, error } = await supabase
        .from('documents')
        .select('count', { count: 'exact', head: true })
        .limit(1)

      if (error) {
        console.error('❌ Erreur connexion Supabase:', error)
        results.database.connection = `❌ Erreur: ${error.message}`
      } else {
        console.log('✅ Connexion Supabase réussie')
        results.database.connection = '✅ Connecté'
        
        // Test des tables
        try {
          const { data: tables, error: tablesError } = await supabase
            .from('documents')
            .select('id, title, author_id, folder_id, created_at')
            .limit(1)
          
          if (tablesError) {
            results.database.tables = `❌ Erreur table documents: ${tablesError.message}`
          } else {
            results.database.tables = '✅ Table documents accessible'
          }

          // Test de la structure de la table
          try {
            console.log('🔍 Test de la structure de la table documents...')
            const { data: structure, error: structureError } = await supabase
              .from('documents')
              .select('*')
              .limit(0) // Pas de données, juste la structure
            
            if (structureError) {
              console.log('❌ Erreur structure:', structureError.message)
            } else {
              console.log('✅ Structure accessible')
            }
          } catch (structureErr) {
            console.log('⚠️ Erreur test structure:', structureErr)
          }

          // Test des utilisateurs existants
          try {
            console.log('👥 Test des utilisateurs existants...')
            const { data: users, error: usersError } = await supabase
              .from('users')
              .select('id, email, name')
              .limit(5)
            
            if (usersError) {
              console.log('❌ Erreur table users:', usersError.message)
              results.database.users = `❌ Erreur: ${usersError.message}`
            } else {
              console.log('✅ Utilisateurs trouvés:', users?.length || 0)
              results.database.users = `✅ ${users?.length || 0} utilisateur(s) trouvé(s)`
              if (users && users.length > 0) {
                console.log('📋 Utilisateurs:', users.map(u => ({ id: u.id, email: u.email })))
              }
            }
          } catch (usersErr) {
            console.log('⚠️ Erreur test utilisateurs:', usersErr)
            results.database.users = `⚠️ Erreur: ${usersErr}`
          }
        } catch (tableError) {
          results.database.tables = `❌ Erreur accès table: ${tableError}`
        }
      }
    } catch (supabaseError) {
      console.error('❌ Erreur initialisation Supabase:', supabaseError)
      results.database.connection = `❌ Erreur initialisation: ${supabaseError}`
    }

    console.log('✅ Diagnostic terminé')
    return NextResponse.json({
      success: true,
      diagnostic: results
    })

  } catch (error) {
    console.error('💥 Erreur diagnostic générale:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur diagnostic',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
