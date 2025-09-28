import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔍 DEBUG: Analyser la structure de Supabase Storage
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Supabase Storage...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // Lister le contenu du bucket documents (dans le sous-dossier documents/)
    const { data: files, error: listError } = await supabase.storage
      .from('documents')
      .list('documents', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listError) {
      return NextResponse.json(
        { error: 'Erreur listage', details: listError.message },
        { status: 500 }
      )
    }

    // Analyser chaque élément
    const analysis = []
    
    for (const item of files || []) {
      const itemInfo = {
        name: item.name,
        id: item.id,
        updated_at: item.updated_at,
        created_at: item.created_at,
        last_accessed_at: item.last_accessed_at,
        metadata: item.metadata,
        isFolder: !item.metadata?.mimetype || item.metadata?.mimetype === 'folder'
      }
      
      // Si c'est un dossier, lister son contenu
      if (itemInfo.isFolder) {
        const { data: folderFiles, error: folderError } = await supabase.storage
          .from('documents')
          .list(item.name, { limit: 10 })
        
        itemInfo.contents = folderFiles || []
        itemInfo.folderError = folderError?.message
      }
      
      analysis.push(itemInfo)
    }

    return NextResponse.json({
      success: true,
      message: 'Analyse Storage terminée',
      totalItems: files?.length || 0,
      analysis
    })

  } catch (error) {
    console.error('💥 Erreur debug storage:', error)
    return NextResponse.json(
      { 
        error: 'Erreur debug storage',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
