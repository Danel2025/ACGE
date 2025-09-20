'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { useCallback } from 'react'

interface WebVitalsMetric {
  id: string
  name: string
  value: number
  delta: number
  navigationType: string
}

export function WebVitals() {
  const handleWebVitals = useCallback((metric: WebVitalsMetric) => {
    // Log pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vitals:', {
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        navigationType: metric.navigationType,
      })
    }

    // Envoyer les métriques à Vercel Speed Insights
    // (automatiquement géré par @vercel/speed-insights)
    
    // Envoyer des métriques personnalisées si nécessaire
    if (metric.name === 'LCP' && metric.value > 4000) {
      console.warn('⚠️ LCP critique détecté:', metric.value)
      // Ici vous pourriez envoyer une alerte ou un événement personnalisé
    }

    if (metric.name === 'CLS' && metric.value > 0.25) {
      console.warn('⚠️ CLS critique détecté:', metric.value)
    }

    if (metric.name === 'FID' && metric.value > 300) {
      console.warn('⚠️ FID critique détecté:', metric.value)
    }
  }, [])

  useReportWebVitals(handleWebVitals)

  return null
}
