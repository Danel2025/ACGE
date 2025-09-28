'use client'

import React from 'react'
import { LoadingState } from '@/components/ui/loading-states'
import { LogOut, CheckCircle2 } from 'lucide-react'

interface LogoutTransitionProps {
  isLoggingOut: boolean
  onComplete?: () => void
  className?: string
}

export function LogoutTransition({ 
  isLoggingOut, 
  onComplete, 
  className = '' 
}: LogoutTransitionProps) {
  const [phase, setPhase] = React.useState<'idle' | 'logging-out' | 'success'>('idle')

  React.useEffect(() => {
    if (isLoggingOut) {
      setPhase('logging-out')
      
      // Simuler les phases de déconnexion
      const timer = setTimeout(() => {
        setPhase('success')
        
        // Appeler onComplete après un court délai
        if (onComplete) {
          setTimeout(onComplete, 500)
        }
      }, 800)

      return () => clearTimeout(timer)
    } else {
      setPhase('idle')
    }
  }, [isLoggingOut, onComplete])

  if (!isLoggingOut && phase === 'idle') {
    return null
  }

  const getMessage = () => {
    switch (phase) {
      case 'logging-out':
        return 'Déconnexion en cours...'
      case 'success':
        return 'Déconnexion réussie'
      default:
        return 'Chargement...'
    }
  }

  const getIcon = () => {
    switch (phase) {
      case 'logging-out':
        return <LogOut className="h-6 w-6 animate-pulse text-primary" />
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />
      default:
        return null
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm ${className}`}>
      <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-lg shadow-lg border">
        {getIcon()}
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            {getMessage()}
          </p>
          {phase === 'logging-out' && (
            <p className="text-sm text-muted-foreground mt-2">
              Nettoyage de la session...
            </p>
          )}
        </div>
        {phase === 'logging-out' && (
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Hook pour gérer l'état de déconnexion avec transition
 */
export function useLogoutTransition() {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const startLogout = React.useCallback(() => {
    setIsLoggingOut(true)
  }, [])

  const completeLogout = React.useCallback(() => {
    setIsLoggingOut(false)
  }, [])

  return {
    isLoggingOut,
    startLogout,
    completeLogout
  }
}
