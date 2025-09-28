'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DocumentItem } from '@/types/document'

interface ViewerState {
  currentIndex: number
  isOpen: boolean
  isLoading: boolean
  error: string | null
  previewUrls: Map<string, string>
  settings: {
    showMetadata: boolean
    showThumbnails: boolean
    autoPlay: boolean
    theme: 'light' | 'dark' | 'auto'
  }
  controls: {
    zoom: number
    rotation: number
    isPlaying: boolean
    isMuted: boolean
    volume: number
  }
}

interface UseDocumentViewerOptions {
  documents: DocumentItem[]
  initialIndex?: number
  onDocumentChange?: (document: DocumentItem, index: number) => void
  onError?: (error: string) => void
}

export function useDocumentViewer({
  documents,
  initialIndex = 0,
  onDocumentChange,
  onError
}: UseDocumentViewerOptions) {
  // État principal
  const [state, setState] = useState<ViewerState>({
    currentIndex: initialIndex,
    isOpen: false,
    isLoading: false,
    error: null,
    previewUrls: new Map(),
    settings: {
      showMetadata: false,
      showThumbnails: true,
      autoPlay: false,
      theme: 'auto'
    },
    controls: {
      zoom: 100,
      rotation: 0,
      isPlaying: false,
      isMuted: false,
      volume: 1
    }
  })

  // Refs pour les éléments média
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Document actuel
  const currentDocument = documents[state.currentIndex]
  const hasNext = state.currentIndex < documents.length - 1
  const hasPrevious = state.currentIndex > 0

  // Chargement d'un fichier
  const loadFile = useCallback(async (document: DocumentItem) => {
    if (state.previewUrls.has(document.id)) return

    setIsLoading(true)
    setError(null)

    try {
      const documentId = document.originalId || document.id
      const apiUrl = `/api/files/${documentId}`
      
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        
        setState(prev => ({
          ...prev,
          previewUrls: new Map(prev.previewUrls).set(document.id, url)
        }))
      } else {
        // Fallback vers l'URL Supabase directe
        if (document.filePath && document.filePath.startsWith('http')) {
          const fallbackResponse = await fetch(document.filePath)
          if (fallbackResponse.ok) {
            const blob = await fallbackResponse.blob()
            const url = URL.createObjectURL(blob)
            
            setState(prev => ({
              ...prev,
              previewUrls: new Map(prev.previewUrls).set(document.id, url)
            }))
          } else {
            throw new Error('Impossible de charger le fichier')
          }
        } else {
          const errorData = await response.text()
          throw new Error(errorData || 'Erreur lors du chargement')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [state.previewUrls, onError])

  // Nettoyage des URLs
  const cleanupUrls = useCallback(() => {
    state.previewUrls.forEach(url => {
      URL.revokeObjectURL(url)
    })
    setState(prev => ({
      ...prev,
      previewUrls: new Map()
    }))
  }, [state.previewUrls])

  // Actions de navigation
  const goToNext = useCallback(() => {
    if (hasNext) {
      const newIndex = state.currentIndex + 1
      setState(prev => ({ ...prev, currentIndex: newIndex }))
      onDocumentChange?.(documents[newIndex], newIndex)
    }
  }, [hasNext, state.currentIndex, documents, onDocumentChange])

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      const newIndex = state.currentIndex - 1
      setState(prev => ({ ...prev, currentIndex: newIndex }))
      onDocumentChange?.(documents[newIndex], newIndex)
    }
  }, [hasPrevious, state.currentIndex, documents, onDocumentChange])

  const goToDocument = useCallback((index: number) => {
    if (index >= 0 && index < documents.length) {
      setState(prev => ({ ...prev, currentIndex: index }))
      onDocumentChange?.(documents[index], index)
    }
  }, [documents, onDocumentChange])

  // Actions de contrôle
  const openViewer = useCallback((index?: number) => {
    const targetIndex = index ?? state.currentIndex
    setState(prev => ({
      ...prev,
      isOpen: true,
      currentIndex: targetIndex
    }))
    onDocumentChange?.(documents[targetIndex], targetIndex)
  }, [state.currentIndex, documents, onDocumentChange])

  const closeViewer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      controls: {
        ...prev.controls,
        isPlaying: false
      }
    }))
  }, [])

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setState(prev => ({
          ...prev,
          controls: { ...prev.controls, isPlaying: true }
        }))
      } else {
        videoRef.current.pause()
        setState(prev => ({
          ...prev,
          controls: { ...prev.controls, isPlaying: false }
        }))
      }
    } else if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play()
        setState(prev => ({
          ...prev,
          controls: { ...prev.controls, isPlaying: true }
        }))
      } else {
        audioRef.current.pause()
        setState(prev => ({
          ...prev,
          controls: { ...prev.controls, isPlaying: false }
        }))
      }
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setState(prev => ({
        ...prev,
        controls: { ...prev.controls, isMuted: videoRef.current?.muted ?? false }
      }))
    } else if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
      setState(prev => ({
        ...prev,
        controls: { ...prev.controls, isMuted: audioRef.current?.muted ?? false }
      }))
    }
  }, [])

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      controls: { ...prev.controls, zoom: Math.max(25, Math.min(300, zoom)) }
    }))
  }, [])

  const setRotation = useCallback((rotation: number) => {
    setState(prev => ({
      ...prev,
      controls: { ...prev.controls, rotation: rotation % 360 }
    }))
  }, [])

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    setState(prev => ({
      ...prev,
      controls: { ...prev.controls, volume: clampedVolume }
    }))
    
    if (videoRef.current) {
      videoRef.current.volume = clampedVolume
    } else if (audioRef.current) {
      audioRef.current.volume = clampedVolume
    }
  }, [])

  const toggleSettings = useCallback((key: keyof ViewerState['settings']) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: !prev.settings[key]
      }
    }))
  }, [])

  const updateSettings = useCallback((settings: Partial<ViewerState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }))
  }, [])

  // Gestion du plein écran
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Erreur plein écran:', error)
    }
  }, [])

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isOpen) return

      switch (e.key) {
        case 'Escape':
          closeViewer()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'm':
        case 'M':
          toggleMute()
          break
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            toggleFullscreen()
          }
          break
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom(state.controls.zoom + 25)
          }
          break
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom(state.controls.zoom - 25)
          }
          break
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom(100)
          }
          break
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setRotation(state.controls.rotation + 90)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    state.isOpen,
    state.controls.zoom,
    state.controls.rotation,
    closeViewer,
    goToNext,
    goToPrevious,
    togglePlayPause,
    toggleMute,
    toggleFullscreen,
    setZoom,
    setRotation
  ])

  // Chargement automatique du document actuel
  useEffect(() => {
    if (state.isOpen && currentDocument) {
      loadFile(currentDocument)
    }
  }, [state.isOpen, currentDocument, loadFile])

  // Nettoyage à la fermeture
  useEffect(() => {
    if (!state.isOpen) {
      cleanupUrls()
    }
  }, [state.isOpen, cleanupUrls])

  // Fonctions utilitaires
  const getPreviewUrl = useCallback((documentId: string) => {
    return state.previewUrls.get(documentId) || null
  }, [state.previewUrls])

  const isDocumentLoaded = useCallback((documentId: string) => {
    return state.previewUrls.has(documentId)
  }, [state.previewUrls])

  const resetControls = useCallback(() => {
    setState(prev => ({
      ...prev,
      controls: {
        zoom: 100,
        rotation: 0,
        isPlaying: false,
        isMuted: false,
        volume: 1
      }
    }))
  }, [])

  return {
    // État
    state,
    currentDocument,
    hasNext,
    hasPrevious,
    
    // Actions de navigation
    goToNext,
    goToPrevious,
    goToDocument,
    openViewer,
    closeViewer,
    
    // Actions de contrôle
    togglePlayPause,
    toggleMute,
    setZoom,
    setRotation,
    setVolume,
    toggleSettings,
    updateSettings,
    toggleFullscreen,
    resetControls,
    
    // Utilitaires
    getPreviewUrl,
    isDocumentLoaded,
    loadFile,
    
    // Refs
    videoRef,
    audioRef,
    containerRef
  }
}
