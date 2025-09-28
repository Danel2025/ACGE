'use client'

import { useMounted } from '@/hooks/use-mounted'

interface NoSSRProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Composant qui empêche le rendu côté serveur
 * Utile pour éviter les problèmes d'hydratation avec des composants
 * qui dépendent de l'état côté client
 */
export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const isMounted = useMounted()

  if (!isMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
