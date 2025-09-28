'use client'

import { useEffect, useState } from 'react'
import { LoadingScreen } from '@/components/ui/loading-screen'

interface LoadingProviderProps {
  children: React.ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simuler un temps de chargement initial
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000) // 2 secondes de chargement

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <LoadingScreen 
        isLoading={isLoading} 
        onComplete={() => setIsLoading(false)}
      />
      {!isLoading && children}
    </>
  )
}
