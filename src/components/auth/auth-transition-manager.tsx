'use client'

import { useEffect, useRef } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'

/**
 * Composant pour gérer les transitions d'authentification et éviter les conflits
 * de redirection et les boucles de chargement
 */
export function AuthTransitionManager() {
  const { user, isLoading, resetAuthState } = useSupabaseAuth()
  const transitionRef = useRef<{
    isTransitioning: boolean
    lastUser: any
    transitionTimeout: NodeJS.Timeout | null
  }>({
    isTransitioning: false,
    lastUser: null,
    transitionTimeout: null
  })

  useEffect(() => {
    const current = transitionRef.current

    // Si on est en train de charger, ne rien faire
    if (isLoading) {
      return
    }

    // Si l'utilisateur a changé (connexion/déconnexion)
    if (current.lastUser !== user) {
      console.log('🔄 Transition d\'authentification détectée:', {
        from: current.lastUser ? `${current.lastUser.email} (${current.lastUser.role})` : 'null',
        to: user ? `${user.email} (${user.role})` : 'null'
      })

      // Marquer qu'on est en transition
      current.isTransitioning = true

      // Nettoyer le timeout précédent s'il existe
      if (current.transitionTimeout) {
        clearTimeout(current.transitionTimeout)
      }

      // Attendre un délai pour stabiliser la transition
      current.transitionTimeout = setTimeout(() => {
        current.isTransitioning = false
        current.lastUser = user
        console.log('✅ Transition d\'authentification terminée')
      }, 200)

      // Mettre à jour la référence de l'utilisateur
      current.lastUser = user
    }

    return () => {
      if (current.transitionTimeout) {
        clearTimeout(current.transitionTimeout)
      }
    }
  }, [user, isLoading, resetAuthState])

  // Nettoyer les timeouts au démontage
  useEffect(() => {
    return () => {
      const current = transitionRef.current
      if (current.transitionTimeout) {
        clearTimeout(current.transitionTimeout)
      }
    }
  }, [])

  // Ce composant ne rend rien, il gère juste les transitions
  return null
}
