'use client'

import React from 'react'
import { ErrorDisplay } from './error-display'
import { createNotification } from '@/lib/notifications'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'

interface GlobalErrorHandlerProps {
  children: React.ReactNode
}

interface ErrorState {
  error: string | null
  type: 'network' | 'server' | 'validation' | 'permission' | 'notFound' | 'generic'
  timestamp: number
  context?: string
}

export function GlobalErrorHandler({ children }: GlobalErrorHandlerProps) {
  const { user } = useSupabaseAuth()
  const [errorState, setErrorState] = React.useState<ErrorState | null>(null)
  const [isRetrying, setIsRetrying] = React.useState(false)

  // Fonction pour gérer les erreurs globales
  const handleGlobalError = React.useCallback(async (
    error: Error | string,
    type: ErrorState['type'] = 'generic',
    context?: string
  ) => {
    const errorMessage = error instanceof Error ? error.message : error
    const timestamp = Date.now()

    console.error('🚨 Erreur globale:', {
      message: errorMessage,
      type,
      context,
      timestamp: new Date(timestamp).toISOString()
    })

    setErrorState({
      error: errorMessage,
      type,
      timestamp,
      context
    })

    // Créer une notification d'erreur pour l'utilisateur
    if (user?.id) {
      await createNotification({
        userId: user.id,
        title: 'Erreur système',
        message: `Une erreur s'est produite${context ? ` dans ${context}` : ''}.\n\n${errorMessage}`,
        type: 'ERROR',
        priority: 'HIGH',
        actionUrl: window.location.pathname,
        actionLabel: 'Actualiser la page',
        metadata: {
          errorType: type,
          context,
          timestamp: new Date(timestamp).toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      })
    }
  }, [user?.id])

  // Fonction de retry
  const handleRetry = React.useCallback(async () => {
    if (isRetrying) return

    setIsRetrying(true)
    try {
      // Attendre un peu avant de retry
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Recharger la page
      window.location.reload()
    } catch (err) {
      console.error('Erreur lors du retry:', err)
    } finally {
      setIsRetrying(false)
    }
  }, [isRetrying])

  // Fonction pour fermer l'erreur
  const handleDismiss = React.useCallback(() => {
    setErrorState(null)
  }, [])

  // Gestionnaire d'erreurs global
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      handleGlobalError(event.error || event.message, 'generic', 'JavaScript')
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleGlobalError(
        event.reason instanceof Error ? event.reason.message : String(event.reason),
        'generic',
        'Promise Rejection'
      )
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [handleGlobalError])

  // Exposer la fonction de gestion d'erreurs globalement
  React.useEffect(() => {
    (window as any).handleGlobalError = handleGlobalError
    return () => {
      delete (window as any).handleGlobalError
    }
  }, [handleGlobalError])

  return (
    <>
      {children}
      
      {/* Overlay d'erreur global */}
      {errorState && (
        <div className="fixed inset-0 z-[9999] bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4 h-screen">
          <div className="w-full max-w-md">
            <ErrorDisplay
              error={errorState.error}
              type={errorState.type}
              title={`Erreur ${errorState.context ? `dans ${errorState.context}` : 'système'}`}
              description="Une erreur inattendue s'est produite. Vous pouvez réessayer ou actualiser la page."
              onRetry={handleRetry}
              onDismiss={handleDismiss}
              showRetry={true}
              showDismiss={true}
              retryLabel={isRetrying ? 'Réessai...' : 'Actualiser'}
              variant="card"
              className="animate-in slide-in-from-bottom-4 duration-300"
            />
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Hook pour utiliser le gestionnaire d'erreurs global
 */
export function useGlobalErrorHandler() {
  const handleError = React.useCallback((
    error: Error | string,
    type: ErrorState['type'] = 'generic',
    context?: string
  ) => {
    if (typeof window !== 'undefined' && (window as any).handleGlobalError) {
      (window as any).handleGlobalError(error, type, context)
    } else {
      console.error('Gestionnaire d\'erreurs global non disponible:', error)
    }
  }, [])

  return { handleError }
}
