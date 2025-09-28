'use client'

import { useEffect } from 'react'
import { CookieConsent, useCookieConsent } from './cookie-consent'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const { showConsent, hasConsent, requestConsent, handleAccept, handleDecline } = useCookieConsent()
  const { user, logout } = useSupabaseAuth()

  useEffect(() => {
    // Si un utilisateur est connecté mais qu'il n'y a pas de consentement valide,
    // le déconnecter par sécurité
    if (user && hasConsent === false) {
      console.log('🛡️ Déconnexion de sécurité - consentement cookies manquant')
      logout()
    }
  }, [user, hasConsent, logout])

  return (
    <>
      {children}
      <CookieConsent
        isOpen={showConsent}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </>
  )
}