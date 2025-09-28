'use client'

import { SupabaseAuthProvider } from '@/contexts/supabase-auth-context'
import { ModalProvider } from '@/contexts/modal-context'
import { AuthTransitionManager } from '@/components/auth/auth-transition-manager'
import { CookieConsentProvider } from '@/components/auth/cookie-consent-provider'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <CookieConsentProvider>
        <ModalProvider>
          <AuthTransitionManager />
          {children}
        </ModalProvider>
      </CookieConsentProvider>
    </SupabaseAuthProvider>
  )
}
