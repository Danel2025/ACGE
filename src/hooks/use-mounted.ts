import { useState, useEffect } from 'react'

/**
 * Hook pour s'assurer que le composant est monté côté client
 * Évite les problèmes d'hydratation en empêchant le rendu côté serveur
 * de différer du rendu côté client
 * 
 * Amélioré pour réduire les flashes lors des transitions
 */
export function useMounted() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Utiliser requestAnimationFrame pour une transition plus fluide
    const timer = requestAnimationFrame(() => {
      setIsMounted(true)
    })

    return () => cancelAnimationFrame(timer)
  }, [])

  return isMounted
}

/**
 * Hook pour gérer les transitions d'authentification
 * Évite les flashes lors des changements d'état d'auth
 */
export function useAuthTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionType, setTransitionType] = useState<'login' | 'logout' | null>(null)

  const startTransition = (type: 'login' | 'logout') => {
    setIsTransitioning(true)
    setTransitionType(type)
  }

  const endTransition = () => {
    setIsTransitioning(false)
    setTransitionType(null)
  }

  return {
    isTransitioning,
    transitionType,
    startTransition,
    endTransition
  }
}
