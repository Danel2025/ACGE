import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Test de connexion via l'API d'authentification Supabase
    if (!supabaseAdmin) {
      throw new Error('Client admin Supabase non configuré')
    }

    // Test simple: lister les utilisateurs via l'API auth admin
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      throw error
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Serveur ACGE opérationnel',
      database: 'connected',
      supabase: {
        users: data?.users?.length || 0,
        status: 'healthy'
      }
    })
  } catch (error) {
    console.error('Erreur de connexion à Supabase:', error)
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Erreur de connexion à Supabase',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
