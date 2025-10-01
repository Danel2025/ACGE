'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ModalContextType {
  isModalOpen: boolean
  setModalOpen: (open: boolean) => void
  hideHeader: boolean
  setHideHeader: (hide: boolean) => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hideHeader, setHideHeader] = useState(false)

  // Fonction pour ouvrir un modal
  const setModalOpen = (open: boolean) => {
    setIsModalOpen(open)
    setHideHeader(open)
  }

  // Fonction pour masquer/afficher le header
  const setHideHeaderValue = (hide: boolean) => {
    setHideHeader(hide)
  }

  // Détecter les modals via les attributs data
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
          const target = mutation.target as HTMLElement
          if (target.hasAttribute('data-state')) {
            const state = target.getAttribute('data-state')
            const isOpen = state === 'open'
            // Utiliser setIsModalOpen directement avec une fonction callback
            // pour éviter les re-renders inutiles et les boucles infinies
            setIsModalOpen(prev => prev !== isOpen ? isOpen : prev)
            setHideHeader(prev => prev !== isOpen ? isOpen : prev)
          }
        }
      })
    })

    // Observer tous les éléments avec data-state
    const elements = document.querySelectorAll('[data-state]')
    elements.forEach((element) => {
      observer.observe(element, { attributes: true, attributeFilter: ['data-state'] })
    })

    return () => observer.disconnect()
  }, [])

  return (
    <ModalContext.Provider
      value={{
        isModalOpen,
        setModalOpen,
        hideHeader,
        setHideHeader: setHideHeaderValue,
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
