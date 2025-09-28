import { useState, useEffect, useCallback, useRef } from 'react'
import { SearchSuggestion } from '@/components/ui/search-suggestions'

interface UseSearchSuggestionsOptions {
  debounceMs?: number
  minQueryLength?: number
  maxSuggestions?: number
  enableCache?: boolean
  searchTypes?: string[]
}

export function useSearchSuggestions(
  query: string,
  options: UseSearchSuggestionsOptions = {}
) {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxSuggestions = 10,
    enableCache = true,
    searchTypes = ['all']
  } = options

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 })

  // Cache local pour éviter les requêtes répétées
  const cache = useRef(new Map<string, { data: SearchSuggestion[], timestamp: number }>())
  const abortController = useRef<AbortController | null>(null)

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minQueryLength) {
      setSuggestions([])
      return
    }

    // Annuler la requête précédente si elle existe
    if (abortController.current) {
      abortController.current.abort()
    }

    // Vérifier le cache local
    if (enableCache && cache.current.has(searchQuery)) {
      const cached = cache.current.get(searchQuery)!
      const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000 // 5 minutes
      
      if (!isExpired) {
        setSuggestions(cached.data.slice(0, maxSuggestions))
        setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }))
        return
      } else {
        cache.current.delete(searchQuery)
      }
    }

    setIsLoading(true)
    setError(null)

    // Créer un nouveau contrôleur d'abandon
    abortController.current = new AbortController()

    try {
      // Construire les paramètres de recherche
      const params = new URLSearchParams({
        q: searchQuery,
        limit: maxSuggestions.toString()
      })
      
      if (searchTypes.length > 0 && !searchTypes.includes('all')) {
        params.append('type', searchTypes.join(','))
      }

      const response = await fetch(`/api/search/suggestions?${params.toString()}`, {
        signal: abortController.current.signal,
        headers: {
          'Cache-Control': 'max-age=300' // 5 minutes
        }
      })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const newSuggestions = data.suggestions || []

      // Mettre en cache local
      if (enableCache) {
        cache.current.set(searchQuery, {
          data: newSuggestions,
          timestamp: Date.now()
        })
      }
      
      setSuggestions(newSuggestions.slice(0, maxSuggestions))
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }))
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Requête annulée, ne pas afficher d'erreur
        return
      }
      
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [minQueryLength, maxSuggestions, enableCache, searchTypes])

  // Debouncing avec useEffect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(query)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [query, debounceMs, fetchSuggestions])

  // Nettoyer le cache périodiquement pour éviter la surcharge mémoire
  useEffect(() => {
    const cleanupCache = () => {
      if (cache.current.size > 100) {
        const entries = Array.from(cache.current.entries())
        const toDelete = entries
          .sort((a, b) => a[1].timestamp - b[1].timestamp) // Trier par timestamp
          .slice(0, 50) // Supprimer les 50 plus anciens
        toDelete.forEach(([key]) => cache.current.delete(key))
      }
    }

    const interval = setInterval(cleanupCache, 60000) // Nettoyer toutes les minutes
    return () => clearInterval(interval)
  }, [])

  // Nettoyer les ressources au démontage
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])

  return {
    suggestions,
    isLoading,
    error,
    cacheStats,
    refetch: () => fetchSuggestions(query),
    clearCache: () => {
      cache.current.clear()
      setCacheStats({ hits: 0, misses: 0 })
    }
  }
}
