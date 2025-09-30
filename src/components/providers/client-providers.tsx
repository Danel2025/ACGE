'use client'

import { SupabaseAuthProvider } from '@/contexts/supabase-auth-context'
import { ModalProvider } from '@/contexts/modal-context'
import { RealtimeProvider } from '@/contexts/realtime-context'
import { AuthTransitionManager } from '@/components/auth/auth-transition-manager'
import { CookieConsentProvider } from '@/components/auth/cookie-consent-provider'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <CookieConsentProvider>
        <RealtimeProvider>
          <ModalProvider>
            <AuthTransitionManager />
            {children}
          </ModalProvider>
        </RealtimeProvider>
      </CookieConsentProvider>
    </SupabaseAuthProvider>
  )
}
