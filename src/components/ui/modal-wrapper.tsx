'use client'

import { useEffect, useRef } from 'react'
import { useModal } from '@/contexts/modal-context'

interface ModalWrapperProps {
  children: React.ReactNode
  isOpen: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Wrapper pour les modals qui détecte automatiquement leur état
 * et masque le header en conséquence
 */
export function ModalWrapper({ children, isOpen, onOpenChange }: ModalWrapperProps) {
  const { setModalOpen } = useModal()
  const previousOpenState = useRef(isOpen)

  useEffect(() => {
    // Détecter les changements d'état du modal
    if (previousOpenState.current !== isOpen) {
      setModalOpen(isOpen)
      previousOpenState.current = isOpen
    }
  }, [isOpen, setModalOpen])

  // Nettoyer l'état quand le composant se démonte
  useEffect(() => {
    return () => {
      setModalOpen(false)
    }
  }, [setModalOpen])

  return <>{children}</>
}
