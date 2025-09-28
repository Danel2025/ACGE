'use client'

import { useEffect } from 'react'
import { useModal } from '@/contexts/modal-context'

/**
 * Hook pour détecter automatiquement l'ouverture/fermeture de modals
 * et masquer le header en conséquence
 */
export function useModalDetection() {
  const { setModalOpen } = useModal()

  useEffect(() => {
    // Fonction pour vérifier l'état des modals
    const checkModalState = () => {
      // Vérifier les modals Radix UI (Dialog, Sheet, etc.)
      const dialogElements = document.querySelectorAll('[role="dialog"]')
      const sheetElements = document.querySelectorAll('[data-sheet]')
      const modalElements = document.querySelectorAll('[data-modal]')
      
      const allModalElements = [
        ...dialogElements,
        ...sheetElements,
        ...modalElements
      ]

      // Vérifier si au moins un modal est ouvert
      const isAnyModalOpen = allModalElements.some(element => {
        const state = element.getAttribute('data-state')
        const ariaHidden = element.getAttribute('aria-hidden')
        const style = window.getComputedStyle(element)
        
        return (
          state === 'open' ||
          ariaHidden === 'false' ||
          style.display !== 'none' && style.visibility !== 'hidden'
        )
      })

      setModalOpen(isAnyModalOpen)
    }

    // Observer les changements dans le DOM
    const observer = new MutationObserver(checkModalState)

    // Observer les changements d'attributs sur les éléments de modal
    const modalSelectors = [
      '[role="dialog"]',
      '[data-sheet]',
      '[data-modal]',
      '[data-radix-dialog-content]',
      '[data-radix-sheet-content]'
    ]

    modalSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['data-state', 'aria-hidden', 'style', 'class']
        })
      })
    })

    // Vérification initiale
    checkModalState()

    // Vérifier périodiquement (fallback)
    const interval = setInterval(checkModalState, 1000)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [setModalOpen])
}
