'use client'

import { useState, useCallback } from 'react'
import { useModal } from '@/contexts/modal-context'

/**
 * Hook pour gérer facilement l'ouverture/fermeture de modals
 * avec masquage automatique du header
 */
export function useAutoModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const { setModalOpen } = useModal()

  const open = useCallback(() => {
    setIsOpen(true)
    setModalOpen(true)
  }, [setModalOpen])

  const close = useCallback(() => {
    setIsOpen(false)
    setModalOpen(false)
  }, [setModalOpen])

  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [isOpen, open, close])

  const setOpen = useCallback((shouldOpen: boolean) => {
    if (shouldOpen) {
      open()
    } else {
      close()
    }
  }, [open, close])

  return {
    isOpen,
    open,
    close,
    toggle,
    setOpen
  }
}
