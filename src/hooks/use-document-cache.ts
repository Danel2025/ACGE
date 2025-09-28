'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DocumentItem } from '@/types/document'

interface CacheEntry {
  url: string
  blob: Blob
  timestamp: number
  size: number
  type: string
}

interface CacheStats {
  totalSize: number
  entryCount: number
  hitRate: number
  missCount: number
  hitCount: number
}

interface UseDocumentCacheOptions {
  maxSize?: number // Taille maximale du cache en bytes
  maxAge?: number // Âge maximal d'une entrée en millisecondes
  maxEntries?: number // Nombre maximum d'entrées
}

const DEFAULT_OPTIONS: Required<UseDocumentCacheOptions> = {
  maxSize: 100 * 1024 * 1024, // 100MB
  maxAge: 30 * 60 * 1000, // 30 minutes
  maxEntries: 50
}

export function useDocumentCache(options: UseDocumentCacheOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map())
  const [stats, setStats] = useState<CacheStats>({
    totalSize: 0,
    entryCount: 0,
    hitRate: 0,
    missCount: 0,
    hitCount: 0
  })

  const statsRef = useRef<Omit<CacheStats, 'hitRate'>>({
    totalSize: 0,
    entryCount: 0,
    missCount: 0,
    hitCount: 0
  })

  // Calcul du taux de succès
  const calculateHitRate = useCallback(() => {
    const total = statsRef.current.hitCount + statsRef.current.missCount
    return total > 0 ? statsRef.current.hitCount / total : 0
  }, [])

  // Mise à jour des statistiques
  const updateStats = useCallback(() => {
    setStats({
      ...statsRef.current,
      hitRate: calculateHitRate()
    })
  }, [calculateHitRate])

  // Nettoyage du cache
  const cleanupCache = useCallback(() => {
    const now = Date.now()
    const entries = Array.from(cache.entries())
    
    // Supprimer les entrées expirées
    const validEntries = entries.filter(([_, entry]) => {
      return now - entry.timestamp < config.maxAge
    })

    // Trier par timestamp (plus ancien en premier)
    validEntries.sort((a, b) => a[1].timestamp - b[1].timestamp)

    // Calculer la taille totale
    let totalSize = 0
    const keptEntries: [string, CacheEntry][] = []

    for (const [key, entry] of validEntries) {
      if (totalSize + entry.size <= config.maxSize && keptEntries.length < config.maxEntries) {
        keptEntries.push([key, entry])
        totalSize += entry.size
      } else {
        // Nettoyer l'URL
        URL.revokeObjectURL(entry.url)
      }
    }

    setCache(new Map(keptEntries))
    statsRef.current.totalSize = totalSize
    statsRef.current.entryCount = keptEntries.length
    updateStats()
  }, [cache, config.maxAge, config.maxSize, config.maxEntries, updateStats])

  // Nettoyage automatique
  useEffect(() => {
    const interval = setInterval(cleanupCache, 60000) // Nettoyage toutes les minutes
    return () => clearInterval(interval)
  }, [cleanupCache])

  // Récupération d'une entrée du cache
  const get = useCallback((key: string): CacheEntry | null => {
    const entry = cache.get(key)
    
    if (!entry) {
      statsRef.current.missCount++
      updateStats()
      return null
    }

    // Vérifier si l'entrée est expirée
    if (Date.now() - entry.timestamp > config.maxAge) {
      setCache(prev => {
        const newCache = new Map(prev)
        newCache.delete(key)
        URL.revokeObjectURL(entry.url)
        return newCache
      })
      statsRef.current.missCount++
      updateStats()
      return null
    }

    statsRef.current.hitCount++
    updateStats()
    return entry
  }, [cache, config.maxAge, updateStats])

  // Ajout d'une entrée au cache
  const set = useCallback((key: string, blob: Blob, type: string) => {
    const url = URL.createObjectURL(blob)
    const entry: CacheEntry = {
      url,
      blob,
      timestamp: Date.now(),
      size: blob.size,
      type
    }

    setCache(prev => {
      const newCache = new Map(prev)
      
      // Supprimer l'ancienne entrée si elle existe
      const oldEntry = newCache.get(key)
      if (oldEntry) {
        URL.revokeObjectURL(oldEntry.url)
        statsRef.current.totalSize -= oldEntry.size
        statsRef.current.entryCount--
      }

      newCache.set(key, entry)
      statsRef.current.totalSize += entry.size
      statsRef.current.entryCount++
      
      return newCache
    })

    updateStats()
  }, [updateStats])

  // Suppression d'une entrée du cache
  const remove = useCallback((key: string) => {
    setCache(prev => {
      const newCache = new Map(prev)
      const entry = newCache.get(key)
      
      if (entry) {
        URL.revokeObjectURL(entry.url)
        statsRef.current.totalSize -= entry.size
        statsRef.current.entryCount--
        newCache.delete(key)
      }
      
      return newCache
    })

    updateStats()
  }, [updateStats])

  // Vidage du cache
  const clear = useCallback(() => {
    setCache(prev => {
      // Nettoyer toutes les URLs
      prev.forEach(entry => {
        URL.revokeObjectURL(entry.url)
      })
      return new Map()
    })

    statsRef.current.totalSize = 0
    statsRef.current.entryCount = 0
    statsRef.current.hitCount = 0
    statsRef.current.missCount = 0
    updateStats()
  }, [updateStats])

  // Chargement d'un document avec cache
  const loadDocument = useCallback(async (document: DocumentItem): Promise<string | null> => {
    const cacheKey = document.originalId || document.id
    const cachedEntry = get(cacheKey)
    
    if (cachedEntry) {
      return cachedEntry.url
    }

    try {
      const documentId = document.originalId || document.id
      const apiUrl = `/api/files/${documentId}`
      
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const blob = await response.blob()
        set(cacheKey, blob, document.fileType || 'application/octet-stream')
        return get(cacheKey)?.url || null
      } else {
        // Fallback vers l'URL Supabase directe
        if (document.filePath && document.filePath.startsWith('http')) {
          const fallbackResponse = await fetch(document.filePath)
          if (fallbackResponse.ok) {
            const blob = await fallbackResponse.blob()
            set(cacheKey, blob, document.fileType || 'application/octet-stream')
            return get(cacheKey)?.url || null
          }
        }
        throw new Error('Impossible de charger le document')
      }
    } catch (error) {
      console.error('Erreur chargement document:', error)
      return null
    }
  }, [get, set])

  // Préchargement de documents
  const preloadDocuments = useCallback(async (documents: DocumentItem[]) => {
    const loadPromises = documents.map(doc => loadDocument(doc))
    await Promise.allSettled(loadPromises)
  }, [loadDocument])

  // Vérification de la présence d'un document dans le cache
  const has = useCallback((key: string): boolean => {
    return cache.has(key)
  }, [cache])

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      cache.forEach(entry => {
        URL.revokeObjectURL(entry.url)
      })
    }
  }, [cache])

  return {
    // Méthodes de cache
    get,
    set,
    remove,
    clear,
    has,
    
    // Méthodes spécialisées
    loadDocument,
    preloadDocuments,
    cleanupCache,
    
    // État
    stats,
    cacheSize: cache.size,
    isFull: statsRef.current.totalSize >= config.maxSize || cache.size >= config.maxEntries
  }
}
