/**
 * 🚀 Système de cache ACGE
 * Cache en mémoire pour améliorer les performances
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()

  set<T>(key: string, data: T, ttlMs: number = 300000): void { // 5min par défaut
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  size(): number {
    return this.cache.size
  }
}

export const cache = new MemoryCache()

// Clés de cache standardisées
export const CacheKeys = {
  folders: 'folders:all',
  folderById: (id: string) => `folder:${id}`,
  documents: (filters: string) => `documents:${filters}`,
  documentById: (id: string) => `document:${id}`,
  users: 'users:all',
  sidebarFolders: 'sidebar:folders'
}

// Invalidation automatique
export const CacheInvalidation = {
  onDocumentChange: () => {
    cache.invalidatePattern('documents:*')
    cache.delete(CacheKeys.sidebarFolders)
  },
  
  onFolderChange: () => {
    console.log('🗑️ Invalidation sélective du cache dossiers')
    cache.invalidatePattern('folder*')
    cache.delete(CacheKeys.folders)
    cache.delete(CacheKeys.sidebarFolders)
    // Invalidation sélective au lieu de vider tout le cache
    // cache.clear() supprimé pour éviter l'invalidation agressive
  },
  
  onUserChange: () => {
    cache.delete(CacheKeys.users)
  },
}
