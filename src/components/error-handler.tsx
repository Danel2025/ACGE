'use client'

import { useEffect } from 'react'

/**
 * Composant pour gérer les erreurs d'extensions Chrome et autres erreurs runtime
 * qui ne sont pas liées à l'application
 */
export function ErrorHandler() {
  useEffect(() => {
    // Intercepter les erreurs runtime.lastError des extensions Chrome
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn

    console.error = (...args) => {
      const message = args[0]?.toString() || ''
      
      // Filtrer les erreurs d'extensions Chrome
      if (
        message.includes('runtime.lastError') ||
        message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('The message port closed') ||
        message.includes('Attempting to use a disconnected port')
      ) {
        // Ne pas afficher ces erreurs dans la console
        return
      }
      
      // Afficher les autres erreurs normalement
      originalConsoleError.apply(console, args)
    }

    console.warn = (...args) => {
      const message = args[0]?.toString() || ''
      
      // Filtrer les avertissements de preload non utilisés
      if (message.includes('was preloaded using link preload but not used')) {
        // Ne pas afficher ces avertissements
        return
      }
      
      // Afficher les autres avertissements normalement
      originalConsoleWarn.apply(console, args)
    }

    // Nettoyer les listeners d'erreurs globaux
    const handleError = (event: ErrorEvent) => {
      const message = event.message || ''
      
      // Filtrer les erreurs d'extensions
      if (
        message.includes('runtime.lastError') ||
        message.includes('Could not establish connection') ||
        message.includes('chrome-extension://')
      ) {
        event.preventDefault()
        return false
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.toString() || ''
      
      // Filtrer les erreurs d'extensions
      if (
        message.includes('runtime.lastError') ||
        message.includes('Could not establish connection') ||
        message.includes('chrome-extension://')
      ) {
        event.preventDefault()
        return false
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
