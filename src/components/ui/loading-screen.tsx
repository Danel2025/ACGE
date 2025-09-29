'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  isLoading: boolean
  onComplete?: () => void
}

export function LoadingScreen({ isLoading, onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            onComplete?.()
          }, 500)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isLoading, onComplete])


  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {/* Logo */}
        <div className="relative">
          <Image
            src="/logo-tresor-public.svg"
            alt="Logo Trésor Public"
            width={100}
            height={100}
            className="animate-pulse drop-shadow-lg"
            priority
          />
        </div>

        {/* Loader avec barres animées - style inspiré des loaders modernes */}
        <div className="relative w-6 h-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-2 bg-primary rounded-full animate-pulse"
              style={{
                left: '50%',
                top: '50%',
                transformOrigin: '50% 12px',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                animationDelay: `${i * 0.125}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        {/* Texte avec animation de typewriter */}
        <div className="text-center">
          <h2 className="text-2xl font-title-bold text-primary mb-1 animate-fade-in">
            ACGE
          </h2>
          <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
            Agence Comptable des Grandes Écoles
          </p>
        </div>

        {/* Barre de progression minimaliste */}
        <div className="w-48 h-0.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
