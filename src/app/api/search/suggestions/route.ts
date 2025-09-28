import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SearchSuggestion } from '@/components/ui/search-suggestions'
import { searchCache, generateSearchKey, invalidateSearchCache } from '@/lib/search-cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') // 'all', 'documents', 'folders', 'tags', 'users'

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Vérifier le cache d'abord
    const cacheKey = generateSearchKey(query || '', type, limit)
    const cachedSuggestions = searchCache.get<SearchSuggestion[]>(cacheKey)
    
    if (cachedSuggestions) {
      console.log(`🎯 Suggestions servies depuis le cache: ${query}`)
      return NextResponse.json({ suggestions: cachedSuggestions })
    }

    const suggestions: SearchSuggestion[] = []
    const startTime = Date.now()

    // Rechercher en parallèle pour de meilleures performances
    const searchPromises: Promise<void>[] = []

    // Rechercher dans les documents avec recherche full-text optimisée
    if (!type || type === 'all' || type === 'documents') {
      searchPromises.push(
        searchDocuments(query, Math.ceil(limit / 2)).then(docs => {
          docs.forEach(doc => suggestions.push(doc))
        })
      )
    }

    // Rechercher dans les dossiers
    if (!type || type === 'all' || type === 'folders') {
      searchPromises.push(
        searchFolders(query, Math.ceil(limit / 3)).then(folders => {
          folders.forEach(folder => suggestions.push(folder))
        })
      )
    }

    // Rechercher dans les tags (si la table existe)
    if (!type || type === 'all' || type === 'tags') {
      searchPromises.push(
        searchTags(query, Math.ceil(limit / 4)).then(tags => {
          tags.forEach(tag => suggestions.push(tag))
        }).catch(error => {
          console.log('Recherche tags ignorée:', error.message)
          // Continuer sans erreur si la table n'existe pas
        })
      )
    }

    // Rechercher dans les utilisateurs
    if (!type || type === 'all' || type === 'users') {
      searchPromises.push(
        searchUsers(query, Math.ceil(limit / 4)).then(users => {
          users.forEach(user => suggestions.push(user))
        })
      )
    }

    // Exécuter toutes les recherches en parallèle
    await Promise.all(searchPromises)

    // Trier et limiter les résultats
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        // Priorité : exact match au début
        const aExact = a.text.toLowerCase().startsWith(query.toLowerCase())
        const bExact = b.text.toLowerCase().startsWith(query.toLowerCase())
        
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        
        // Puis par type (documents en premier)
        const typeOrder = { document: 0, folder: 1, tag: 2, user: 3 }
        const aOrder = typeOrder[a.type]
        const bOrder = typeOrder[b.type]
        
        if (aOrder !== bOrder) return aOrder - bOrder
        
        // Puis par ordre alphabétique
        return a.text.localeCompare(b.text)
      })
      .slice(0, limit)

    // Mettre en cache les résultats
    searchCache.set(cacheKey, sortedSuggestions, 5 * 60 * 1000) // 5 minutes

    const duration = Date.now() - startTime
    console.log(`🔍 Recherche terminée en ${duration}ms: ${sortedSuggestions.length} suggestions pour "${query}"`)

    return NextResponse.json({ suggestions: sortedSuggestions })

  } catch (error) {
    console.error('Erreur lors de la recherche de suggestions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des suggestions' },
      { status: 500 }
    )
  }
}

/**
 * Recherche optimisée dans les documents
 */
async function searchDocuments(query: string, limit: number): Promise<SearchSuggestion[]> {
  try {
    const admin = getSupabaseAdmin()
    
    // Utiliser une requête standard au lieu de la fonction RPC inexistante
    const { data: documents } = await admin
      .from('documents')
      .select(`
        id,
        title,
        description,
        updated_at
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit)
      .order('updated_at', { ascending: false })

    return documents?.map(doc => ({
      id: `doc-${doc.id}`,
      text: doc.title,
      type: 'document' as const,
      metadata: {
        title: doc.title,
        description: doc.description || undefined,
        fileType: undefined, // À récupérer séparément si nécessaire
        fileSize: undefined
      }
    })) || []
  } catch (error) {
    console.error('Erreur recherche documents:', error)
    return []
  }
}

/**
 * Recherche optimisée dans les dossiers
 */
async function searchFolders(query: string, limit: number): Promise<SearchSuggestion[]> {
  try {
    const admin = getSupabaseAdmin()
    
    const { data: folders } = await admin
      .from('folders')
      .select(`
        id,
        name,
        description,
        updated_at
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit)
      .order('updated_at', { ascending: false })

    return folders?.map(folder => ({
      id: `folder-${folder.id}`,
      text: folder.name,
      type: 'folder' as const,
      metadata: {
        title: folder.name,
        description: folder.description || undefined,
        documentCount: 0 // TODO: Ajouter le comptage des documents
      }
    })) || []
  } catch (error) {
    console.error('Erreur recherche dossiers:', error)
    return []
  }
}

/**
 * Recherche optimisée dans les tags
 */
async function searchTags(query: string, limit: number): Promise<SearchSuggestion[]> {
  try {
    const admin = getSupabaseAdmin()
    
    const { data: tags } = await admin
      .from('tags')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .limit(limit)

    return tags?.map(tag => ({
      id: `tag-${tag.id}`,
      text: tag.name,
      type: 'tag' as const,
      metadata: {
        title: tag.name,
        tagCount: 0 // TODO: Ajouter le comptage des documents
      }
    })) || []
  } catch (error) {
    console.log('Table tags non disponible')
    return []
  }
}

/**
 * Recherche optimisée dans les utilisateurs
 */
async function searchUsers(query: string, limit: number): Promise<SearchSuggestion[]> {
  try {
    const admin = getSupabaseAdmin()
    
    const { data: users } = await admin
      .from('users')
      .select('id, name, email')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit)
      .order('name', { ascending: true })

    return users?.map(user => ({
      id: `user-${user.id}`,
      text: user.name || user.email,
      type: 'user' as const,
      metadata: {
        title: user.name || user.email,
        description: user.email
      }
    })) || []
  } catch (error) {
    console.error('Erreur recherche utilisateurs:', error)
    return []
  }
}
