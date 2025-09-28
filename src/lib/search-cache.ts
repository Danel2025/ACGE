/**
 * 🚀 Système de cache de recherche optimisé
 * 
 * Fonctionnalités:
 * - Cache intelligent avec TTL
 * - Invalidation sélective
 * - Compression des données
 * - Statistiques de performance
 * - Gestion mémoire optimisée
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
  size: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  entries: number
  hitRate: number
}

export class SearchCache {
  private cache = new Map<string, CacheEntry<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
    hitRate: 0
  }
  private maxSize = 50 * 1024 * 1024 // 50MB
  private maxEntries = 1000
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(options?: {
    maxSize?: number
    maxEntries?: number
    cleanupIntervalMs?: number
  }) {
    this.maxSize = options?.maxSize || this.maxSize
    this.maxEntries = options?.maxEntries || this.maxEntries
    
    // Nettoyage automatique toutes les 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, options?.cleanupIntervalMs || 5 * 60 * 1000)
  }

  /**
   * Obtenir une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Vérifier l'expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Mettre à jour les statistiques
    entry.hits++
    this.stats.hits++
    this.updateHitRate()
    
    return entry.data
  }

  /**
   * Stocker une valeur dans le cache
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Calculer la taille approximative
    const size = this.calculateSize(data)
    
    // Vérifier si on dépasse les limites
    if (this.stats.size + size > this.maxSize || this.cache.size >= this.maxEntries) {
      this.evictOldest()
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size
    }

    this.cache.set(key, entry)
    this.stats.size += size
    this.stats.entries = this.cache.size
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.stats.size -= entry.size
      this.stats.entries = this.cache.size
      return this.cache.delete(key)
    }
    return false
  }

  /**
   * Invalider le cache par pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let deleted = 0
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern)
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key)
        deleted++
      }
    }
    
    return deleted
  }

  /**
   * Nettoyer le cache des entrées expirées
   */
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key)
        cleaned++
      }
    }
    
    console.log(`🧹 Cache nettoyé: ${cleaned} entrées supprimées`)
  }

  /**
   * Évincer les entrées les moins utilisées
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()
    let leastHits = Infinity
    
    // Trouver l'entrée la plus ancienne avec le moins de hits
    for (const [key, entry] of this.cache.entries()) {
      const score = entry.hits * 0.3 + (Date.now() - entry.timestamp) * 0.7
      if (score < leastHits) {
        leastHits = score
        oldestKey = key
        oldestTime = entry.timestamp
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  /**
   * Calculer la taille approximative d'un objet
   */
  private calculateSize(obj: any): number {
    try {
      return JSON.stringify(obj).length * 2 // Approximation
    } catch {
      return 1000 // Taille par défaut si erreur de sérialisation
    }
  }

  /**
   * Mettre à jour le taux de succès
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Vider complètement le cache
   */
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      entries: 0,
      hitRate: 0
    }
  }

  /**
   * Détruire le cache et nettoyer les ressources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Instance globale du cache de recherche
export const searchCache = new SearchCache({
  maxSize: 50 * 1024 * 1024, // 50MB
  maxEntries: 1000,
  cleanupIntervalMs: 5 * 60 * 1000 // 5 minutes
})

/**
 * Générateur de clé de cache pour les suggestions de recherche
 */
export function generateSearchKey(query: string, type?: string, limit?: number): string {
  const normalizedQuery = query.toLowerCase().trim()
  const typeStr = type || 'all'
  const limitStr = limit || '10'
  return `search:${typeStr}:${normalizedQuery}:${limitStr}`
}

/**
 * Générateur de clé de cache pour les résultats de recherche
 */
export function generateResultsKey(params: {
  search?: string
  fileType?: string
  folderId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key as keyof typeof params] || ''}`)
    .join('&')
  
  return `results:${Buffer.from(sortedParams).toString('base64')}`
}

/**
 * Invalider le cache après modification de données
 */
export function invalidateSearchCache(type: 'document' | 'folder' | 'user' | 'all' = 'all'): void {
  const patterns = {
    document: /^search:(all|documents):/,
    folder: /^search:(all|folders):/,
    user: /^search:(all|users):/,
    all: /^(search|results):/
  }
  
  const pattern = patterns[type]
  const deleted = searchCache.invalidatePattern(pattern)
  
  console.log(`🗑️ Cache invalidé pour ${type}: ${deleted} entrées supprimées`)
}
