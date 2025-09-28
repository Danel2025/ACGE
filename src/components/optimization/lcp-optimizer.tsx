'use client'

import { useEffect } from 'react'
import Image from 'next/image'

/**
 * Composant d'optimisation LCP basé sur les recommandations Vercel
 * https://vercel.com/docs/speed-insights/metrics#largest-contentful-paint-lcp
 */

interface LCPOptimizerProps {
  children: React.ReactNode
}

export function LCPOptimizer({ children }: LCPOptimizerProps) {
  useEffect(() => {
    // Optimisations LCP spécifiques
    const optimizeLCP = () => {
      // 1. Preload des ressources critiques
      const criticalResources = [
        '/logo-tresor-public.svg',
        '/fonts/outfit/OutfitVariableFont_wght1.ttf'
      ]

      criticalResources.forEach(resource => {
        if (!document.querySelector(`link[href="${resource}"]`)) {
          const link = document.createElement('link')
          link.rel = 'preload'
          link.href = resource
          if (resource.endsWith('.svg')) {
            link.as = 'image'
            link.type = 'image/svg+xml'
          } else if (resource.endsWith('.ttf')) {
            link.as = 'font'
            link.type = 'font/ttf'
            link.crossOrigin = 'anonymous'
          }
          link.fetchPriority = 'high'
          document.head.appendChild(link)
        }
      })

      // 2. Optimisation des images LCP
      const lcpImages = document.querySelectorAll('img[data-lcp]')
      lcpImages.forEach(img => {
        img.setAttribute('fetchpriority', 'high')
        img.setAttribute('loading', 'eager')
      })

      // 3. Suppression des ressources non critiques
      const nonCriticalResources = document.querySelectorAll(
        'link[rel="stylesheet"]:not([data-critical]), script:not([data-critical])'
      )
      
      // Délai pour permettre le chargement des ressources critiques
      setTimeout(() => {
        nonCriticalResources.forEach(resource => {
          if (resource instanceof HTMLLinkElement) {
            resource.media = 'print'
            resource.onload = () => {
              resource.media = 'all'
            }
          }
        })
      }, 100)
    }

    // Exécuter immédiatement
    optimizeLCP()

    // Réexécuter après le chargement du DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', optimizeLCP)
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', optimizeLCP)
    }
  }, [])

  return <>{children}</>
}

/**
 * Image optimisée pour LCP
 */
interface LCPImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
}

export function LCPImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = true, 
  className 
}: LCPImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading="eager"
      fetchPriority="high"
      data-lcp="true"
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}
