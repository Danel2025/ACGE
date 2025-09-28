// Utilitaires de recherche centralisés pour maintenir la cohérence

export interface SearchOptions {
  query: string
  fields?: string[]
  caseSensitive?: boolean
}

/**
 * Normalise une requête de recherche
 */
export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase()
}

/**
 * Construit les paramètres de recherche pour l'API
 */
export function buildSearchParams(options: {
  search?: string
  fileType?: string
  minSize?: number
  maxSize?: number
  startDate?: string
  endDate?: string
  folderId?: string
  tags?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}): URLSearchParams {
  const params = new URLSearchParams()
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.append(key, value.join(','))
        }
      } else {
        params.append(key, value.toString())
      }
    }
  })
  
  return params
}

/**
 * Extrait les paramètres de recherche depuis une URL
 */
export function extractSearchParamsFromUrl(searchParams: URLSearchParams) {
  return {
    search: searchParams.get('search') || undefined,
    fileType: searchParams.get('fileType') || undefined,
    minSize: searchParams.get('minSize') ? parseInt(searchParams.get('minSize')!) : undefined,
    maxSize: searchParams.get('maxSize') ? parseInt(searchParams.get('maxSize')!) : undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    folderId: searchParams.get('folderId') || undefined,
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
  }
}

/**
 * Vérifie si une chaîne correspond à la requête de recherche
 */
export function matchesSearchQuery(text: string, query: string, caseSensitive = false): boolean {
  if (!query) return true
  if (!text) return false
  
  const searchText = caseSensitive ? text : text.toLowerCase()
  const searchQuery = caseSensitive ? query : query.toLowerCase()
  
  return searchText.includes(searchQuery)
}

/**
 * Highlight les termes de recherche dans un texte
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query || !text) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
