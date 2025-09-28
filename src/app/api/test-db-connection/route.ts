import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test connexion base de données - Début')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json({
        error: 'Client Supabase non initialisé',
        config: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 })
    }
    
    // Test de connexion et comptage
    const results = {
      connection: 'OK',
      timestamp: new Date().toISOString(),
      counts: {},
      details: {},
      errors: []
    }
    
    // Compter les documents
    try {
      const { count: docCount, error: docError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
      
      if (docError) {
        results.errors.push(`Documents: ${docError.message}`)
        results.counts.documents = 'ERROR'
      } else {
        results.counts.documents = docCount || 0
      }
    } catch (error) {
      results.errors.push(`Documents exception: ${error}`)
      results.counts.documents = 'EXCEPTION'
    }
    
    // Compter les dossiers
    try {
      const { count: folderCount, error: folderError } = await supabase
        .from('folders')
        .select('*', { count: 'exact', head: true })
      
      if (folderError) {
        results.errors.push(`Dossiers: ${folderError.message}`)
        results.counts.folders = 'ERROR'
      } else {
        results.counts.folders = folderCount || 0
      }
    } catch (error) {
      results.errors.push(`Dossiers exception: ${error}`)
      results.counts.folders = 'EXCEPTION'
    }
    
    // Compter les utilisateurs
    try {
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      if (userError) {
        results.errors.push(`Utilisateurs: ${userError.message}`)
        results.counts.users = 'ERROR'
      } else {
        results.counts.users = userCount || 0
      }
    } catch (error) {
      results.errors.push(`Utilisateurs exception: ${error}`)
      results.counts.users = 'EXCEPTION'
    }
    
    // Lister quelques documents pour vérifier
    try {
      const { data: documents, error: listError } = await supabase
        .from('documents')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (listError) {
        results.errors.push(`Liste documents: ${listError.message}`)
        results.details.recentDocuments = 'ERROR'
      } else {
        results.details.recentDocuments = documents || []
      }
    } catch (error) {
      results.errors.push(`Liste documents exception: ${error}`)
      results.details.recentDocuments = 'EXCEPTION'
    }
    
    // Vérifier la structure des tables
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'documents' })
        .single()
      
      if (tableError) {
        // Fallback: essayer une requête simple
        const { data: sampleDoc, error: sampleError } = await supabase
          .from('documents')
          .select('*')
          .limit(1)
        
        if (sampleError) {
          results.errors.push(`Structure table: ${sampleError.message}`)
        } else {
          results.details.tableStructure = 'OK (via sample)'
        }
      } else {
        results.details.tableStructure = tableInfo
      }
    } catch (error) {
      results.errors.push(`Structure table exception: ${error}`)
    }
    
    console.log('🔍 Test connexion base de données - Résultats:', results)
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('❌ Erreur test connexion:', error)
    
    return NextResponse.json({
      error: 'Erreur générale du test',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
