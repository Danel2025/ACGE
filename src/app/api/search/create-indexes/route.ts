import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔍 Création d'index de recherche optimisés pour Supabase
 * 
 * Fonctionnalités:
 * - Index full-text search pour PostgreSQL
 * - Index GIN pour recherche rapide
 * - Index composites pour requêtes complexes
 * - Index de tri pour performance
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Création des index de recherche optimisés...')
    
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    const indexes = [
      // Index full-text search pour documents
      {
        name: 'idx_documents_search_fts',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_documents_search_fts 
          ON documents USING gin(to_tsvector('french', title || ' ' || COALESCE(description, '')))
        `
      },
      // Index pour recherche par titre (début de chaîne)
      {
        name: 'idx_documents_title_prefix',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_documents_title_prefix 
          ON documents (title text_pattern_ops)
        `
      },
      // Index composite pour recherche + tri
      {
        name: 'idx_documents_search_sort',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_documents_search_sort 
          ON documents (updated_at DESC, title) 
          WHERE title IS NOT NULL
        `
      },
      // Index pour recherche par auteur
      {
        name: 'idx_documents_author_search',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_documents_author_search 
          ON documents (author_id, updated_at DESC)
        `
      },
      // Index pour recherche par dossier
      {
        name: 'idx_documents_folder_search',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_documents_folder_search 
          ON documents (folder_id, updated_at DESC)
        `
      },
      // Index full-text pour dossiers
      {
        name: 'idx_folders_search_fts',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_folders_search_fts 
          ON folders USING gin(to_tsvector('french', name || ' ' || COALESCE(description, '')))
        `
      },
      // Index pour recherche de dossiers par nom
      {
        name: 'idx_folders_name_prefix',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_folders_name_prefix 
          ON folders (name text_pattern_ops)
        `
      },
      // Index pour versions de documents
      {
        name: 'idx_document_versions_search',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_document_versions_search 
          ON document_versions (document_id, created_at DESC)
        `
      },
      // Index pour recherche par type de fichier
      {
        name: 'idx_document_versions_file_type',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_document_versions_file_type 
          ON document_versions (file_type, created_at DESC)
        `
      },
      // Index pour recherche par taille de fichier
      {
        name: 'idx_document_versions_file_size',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_document_versions_file_size 
          ON document_versions (file_size, created_at DESC)
        `
      }
    ]

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const index of indexes) {
      try {
        console.log(`Création de l'index: ${index.name}`)
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: index.sql
        })

        if (error) {
          console.error(`❌ Erreur création index ${index.name}:`, error.message)
          results.push({
            name: index.name,
            status: 'error',
            error: error.message
          })
          errorCount++
        } else {
          console.log(`✅ Index ${index.name} créé avec succès`)
          results.push({
            name: index.name,
            status: 'success'
          })
          successCount++
        }
      } catch (err) {
        console.error(`❌ Erreur inattendue pour ${index.name}:`, err)
        results.push({
          name: index.name,
          status: 'error',
          error: err instanceof Error ? err.message : 'Erreur inconnue'
        })
        errorCount++
      }
    }

    // Créer une fonction de recherche full-text optimisée
    const createSearchFunction = `
      CREATE OR REPLACE FUNCTION search_documents_optimized(
        search_query TEXT,
        limit_count INTEGER DEFAULT 20,
        offset_count INTEGER DEFAULT 0
      )
      RETURNS TABLE (
        id UUID,
        title TEXT,
        description TEXT,
        author_id TEXT,
        folder_id UUID,
        created_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE,
        current_version_id UUID,
        rank REAL
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          d.id,
          d.title,
          d.description,
          d.author_id,
          d.folder_id,
          d.created_at,
          d.updated_at,
          d.current_version_id,
          ts_rank(to_tsvector('french', d.title || ' ' || COALESCE(d.description, '')), plainto_tsquery('french', search_query)) as rank
        FROM documents d
        WHERE to_tsvector('french', d.title || ' ' || COALESCE(d.description, '')) @@ plainto_tsquery('french', search_query)
        ORDER BY rank DESC, d.updated_at DESC
        LIMIT limit_count
        OFFSET offset_count;
      END;
      $$ LANGUAGE plpgsql;
    `

    try {
      const { error: functionError } = await supabase.rpc('exec_sql', {
        sql: createSearchFunction
      })

      if (functionError) {
        console.error('❌ Erreur création fonction de recherche:', functionError.message)
        results.push({
          name: 'search_documents_optimized',
          status: 'error',
          error: functionError.message
        })
        errorCount++
      } else {
        console.log('✅ Fonction de recherche optimisée créée')
        results.push({
          name: 'search_documents_optimized',
          status: 'success'
        })
        successCount++
      }
    } catch (err) {
      console.error('❌ Erreur création fonction de recherche:', err)
      results.push({
        name: 'search_documents_optimized',
        status: 'error',
        error: err instanceof Error ? err.message : 'Erreur inconnue'
      })
      errorCount++
    }

    console.log(`✅ Création des index terminée: ${successCount} succès, ${errorCount} erreurs`)

    return NextResponse.json({
      success: true,
      message: `Index de recherche créés: ${successCount} succès, ${errorCount} erreurs`,
      results,
      summary: {
        total: indexes.length + 1,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('❌ Erreur création index de recherche:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création des index de recherche',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

/**
 * Vérifier l'état des index de recherche
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Client Supabase non disponible' },
        { status: 500 }
      )
    }

    // Vérifier les index existants
    const checkIndexesSQL = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%search%'
      ORDER BY tablename, indexname;
    `

    const { data: indexes, error } = await supabase.rpc('exec_sql', {
      sql: checkIndexesSQL
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la vérification des index',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      indexes: indexes || [],
      count: indexes?.length || 0
    })

  } catch (error) {
    console.error('❌ Erreur vérification index:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la vérification des index',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
