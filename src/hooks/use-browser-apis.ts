'use client'

import { useEffect, useCallback } from 'react'

/**
 * Hook pour gérer les APIs du navigateur de manière sécurisée
 * Évite les erreurs SSR en vérifiant que window est disponible
 */

export function useBrowserAPIs() {
  const isClient = typeof window !== 'undefined'

  // Gestion des événements clavier
  const useKeyboardEvents = useCallback((
    handler: (e: KeyboardEvent) => void,
    deps: any[] = []
  ) => {
    useEffect(() => {
      if (!isClient) return

      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }, deps)
  }, [isClient])

  // Gestion du plein écran
  const useFullscreen = useCallback((
    onFullscreenChange: (isFullscreen: boolean) => void,
    deps: any[] = []
  ) => {
    useEffect(() => {
      if (!isClient) return

      const handleFullscreenChange = () => {
        onFullscreenChange(!!document.fullscreenElement)
      }

      document.addEventListener('fullscreenchange', handleFullscreenChange)
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, deps)
  }, [isClient])

  // Fonction pour créer un élément de téléchargement
  const createDownloadLink = useCallback((url: string, filename: string) => {
    if (!isClient) return

    const a = document.createElement('a')
    a.href = url
    a.download = filename

    // Déclencher sans manipulation DOM
    a.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }))
  }, [isClient])

  // Fonction pour basculer le plein écran
  const toggleFullscreen = useCallback(async (element?: HTMLElement) => {
    if (!isClient) return

    try {
      if (!document.fullscreenElement) {
        if (element) {
          await element.requestFullscreen()
        } else {
          await document.documentElement.requestFullscreen()
        }
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Erreur plein écran:', error)
    }
  }, [isClient])

  // Fonction pour vérifier si le plein écran est supporté
  const isFullscreenSupported = useCallback(() => {
    if (!isClient) return false
    return !!(document.fullscreenEnabled || 
             (document as any).webkitFullscreenEnabled || 
             (document as any).mozFullScreenEnabled)
  }, [isClient])

  // Fonction pour vérifier si on est en plein écran
  const isFullscreen = useCallback(() => {
    if (!isClient) return false
    return !!document.fullscreenElement
  }, [isClient])

  return {
    isClient,
    useKeyboardEvents,
    useFullscreen,
    createDownloadLink,
    toggleFullscreen,
    isFullscreenSupported,
    isFullscreen
  }
}
