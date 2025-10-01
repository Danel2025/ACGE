import { useEffect, useRef, useState, useCallback } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { useRouter } from 'next/navigation'

interface UseSessionTimeoutProps {
  enabled?: boolean
}

export function useSessionTimeout({ enabled = true }: UseSessionTimeoutProps) {
  const { logout } = useSupabaseAuth()
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const [sessionTimeout, setSessionTimeout] = useState(15) // valeur par défaut
  const logoutRef = useRef(logout)
  const routerRef = useRef(router)

  // Mettre à jour les refs quand logout ou router changent
  useEffect(() => {
    logoutRef.current = logout
    routerRef.current = router
  }, [logout, router])

  // Charger les paramètres de session depuis l'API
  const loadSessionSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        
        // Vérifier que la structure des données est correcte
        if (data.settings && data.settings.security && typeof data.settings.security.sessionTimeout === 'number') {
          const newTimeout = data.settings.security.sessionTimeout
          console.log(`🔄 Session timeout mis à jour: ${sessionTimeout} → ${newTimeout} minutes`)
          setSessionTimeout(newTimeout)
        } else {
          console.warn('⚠️ Structure des paramètres de session invalide, utilisation de la valeur par défaut')
        }
      } else {
        console.warn('⚠️ Impossible de charger les paramètres de session, utilisation de la valeur par défaut')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de session:', error)
    }
  }, [sessionTimeout])

  // Fonction pour prolonger la session via l'API
  const extendSession = useCallback(async () => {
    try {
      const response = await fetch('/api/session/extend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        console.log('Session prolongée avec succès')
        return true
      } else {
        console.error('Erreur lors de la prolongation de session')
        return false
      }
    } catch (error) {
      console.error('Erreur lors de la prolongation de session:', error)
      return false
    }
  }, [])

  // Fonction pour réinitialiser le timer
  const resetTimer = useCallback(async () => {
    if (!enabled || sessionTimeout <= 0) return

    // Nettoyer le timer existant
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Calculer le délai en millisecondes
    const timeoutMs = sessionTimeout * 60 * 1000

    console.log(`⏰ Timer réinitialisé: ${sessionTimeout} minutes (${timeoutMs}ms)`)

    // Créer un nouveau timer
    timeoutRef.current = setTimeout(async () => {
      console.log(`Session expirée après ${sessionTimeout} minutes d'inactivité`)

      // Utiliser les refs pour éviter les dépendances
      logoutRef.current()
      routerRef.current.push('/login')
    }, timeoutMs)

    // Mettre à jour le timestamp de dernière activité
    lastActivityRef.current = Date.now()
  }, [enabled, sessionTimeout])

  // Fonction pour détecter l'activité utilisateur
  const handleUserActivity = useCallback(() => {
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityRef.current
    
    // Réinitialiser le timer seulement si l'utilisateur a été inactif pendant au moins 30 secondes
    // Cela évite de réinitialiser constamment le timer
    if (timeSinceLastActivity > 30000) {
      resetTimer()
    }
  }, [resetTimer])

  // Fonction pour prolonger la session manuellement
  const handleExtendSession = useCallback(async () => {
    const success = await extendSession()
    if (success) {
      resetTimer()
    }
  }, [extendSession, resetTimer])

  // Charger les paramètres au montage
  useEffect(() => {
    loadSessionSettings()
  }, [loadSessionSettings])

  // Écouter les changements de paramètres via un événement personnalisé
  useEffect(() => {
    const handleSettingsChange = () => {
      loadSessionSettings()
    }

    // Écouter l'événement de changement de paramètres
    window.addEventListener('settings-changed', handleSettingsChange)

    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange)
    }
  }, [loadSessionSettings])

  useEffect(() => {
    if (!enabled || sessionTimeout <= 0) return

    // Initialiser le timer
    resetTimer()

    // Événements pour détecter l'activité utilisateur
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ]

    // Ajouter les écouteurs d'événements
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    // Nettoyer les écouteurs d'événements et le timer au démontage
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [sessionTimeout, enabled, resetTimer, handleUserActivity])

  // Retourner des fonctions utiles
  return {
    resetTimer,
    extendSession: handleExtendSession,
    getTimeUntilExpiration: () => {
      if (!enabled || sessionTimeout <= 0) return 0
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current
      const timeoutMs = sessionTimeout * 60 * 1000
      return Math.max(0, timeoutMs - timeSinceLastActivity)
    },
    getLastActivityTime: () => lastActivityRef.current,
    sessionTimeout // Exposer la valeur actuelle
  }
}
