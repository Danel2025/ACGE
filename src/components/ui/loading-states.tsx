'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Database,
  Upload,
  Trash2,
  Save,
  LogIn
} from 'lucide-react'

interface LoadingStateProps {
  isLoading: boolean
  message?: string
  progress?: number
  variant?: 'skeleton' | 'spinner' | 'progress' | 'pulse' | 'dots' | 'refresh' | 'delete' | 'save' | 'login' | 'bars'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'destructive' | 'muted'
  showText?: boolean
  className?: string
}

export function LoadingState({
  isLoading,
  message = 'Chargement...',
  progress,
  variant = 'bars',
  size = 'md',
  color = 'primary',
  showText = true,
  className = ''
}: LoadingStateProps) {

  if (!isLoading) return null

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  const colorClasses = {
    primary: 'text-primary',
    white: 'text-white',
    destructive: 'text-destructive',
    muted: 'text-muted-foreground'
  }

  const renderLoadingContent = () => {
    const iconClass = `${sizeClasses[size]} animate-spin ${colorClasses[color]}`
    const textClass = `${textSizeClasses[size]} font-medium ${colorClasses[color]}`

    switch (variant) {
      case 'skeleton':
        return (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )

      case 'progress':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`relative flex items-center justify-center`} style={{
                width: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px',
                height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px'
              }}>
                {[...Array(size === 'sm' ? 6 : size === 'md' ? 8 : size === 'lg' ? 8 : 10)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute ${size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-0.5' : size === 'lg' ? 'w-0.5' : 'w-1'} ${size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2' : size === 'lg' ? 'h-2.5' : 'h-3'} bg-primary rounded-full animate-pulse`}
                    style={{
                      left: '50%',
                      top: '50%',
                      transformOrigin: `50% ${size === 'sm' ? '8px' : size === 'md' ? '12px' : size === 'lg' ? '16px' : '20px'}`,
                      transform: `translate(-50%, -50%) rotate(${i * (360 / (size === 'sm' ? 6 : size === 'md' ? 8 : size === 'lg' ? 8 : 10))}deg)`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
              {showText && <span className={textClass}>{message}</span>}
            </div>
            {progress !== undefined && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className={`${textSizeClasses[size]} text-muted-foreground text-center`}>
                  {Math.round(progress)}%
                </p>
              </div>
            )}
          </div>
        )

      case 'pulse':
        return (
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center`} style={{
              width: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px',
              height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px'
            }}>
              <div className="w-full h-full rounded-full bg-primary/20 animate-pulse"></div>
              <div className="w-full h-full rounded-full bg-primary/40 animate-pulse absolute inset-0"
                   style={{ animationDelay: '0.5s' }}></div>
            </div>
            {showText && <span className={textClass}>{message}</span>}
          </div>
        )


      case 'bars':
        return (
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center`} style={{
              width: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px',
              height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px'
            }}>
              {[...Array(size === 'sm' ? 6 : size === 'md' ? 8 : size === 'lg' ? 8 : 10)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute ${size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-0.5' : size === 'lg' ? 'w-0.5' : 'w-1'} ${size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2' : size === 'lg' ? 'h-2.5' : 'h-3'} bg-primary rounded-full animate-pulse`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: `50% ${size === 'sm' ? '8px' : size === 'md' ? '12px' : size === 'lg' ? '16px' : '20px'}`,
                    transform: `translate(-50%, -50%) rotate(${i * (360 / (size === 'sm' ? 6 : size === 'md' ? 8 : size === 'lg' ? 8 : 10))}deg)`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            {showText && <span className={textClass}>{message}</span>}
          </div>
        )

      case 'dots':
        return (
          <div className="flex items-center gap-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            {showText && <span className={textClass}>{message}</span>}
          </div>
        )

      case 'refresh':
        return (
          <div className="flex items-center gap-3">
            <RefreshCw className={iconClass} />
            {showText && <span className={textClass}>{message}</span>}
          </div>
        )

      case 'delete':
        return (
          <div className="flex items-center gap-3">
            <Trash2 className={iconClass} />
            {showText && <span className={textClass}>{message}</span>}
          </div>
        )

      case 'save':
        return (
          <div className="flex items-center gap-3">
            <Save className={iconClass} />
            {showText && <span className={textClass}>{message}</span>}
          </div>
        )

      case 'login':
        return (
          <div className="flex items-center gap-3">
            <LogIn className={iconClass} />
            {showText && <span className={textClass}>{message}</span>}
          </div>
        )

      case 'spinner':
        return (
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center`} style={{
              width: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px',
              height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px'
            }}>
              {[...Array(size === 'sm' ? 6 : size === 'md' ? 8 : size === 'lg' ? 8 : 10)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute ${size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-0.5' : size === 'lg' ? 'w-0.5' : 'w-1'} ${size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2' : size === 'lg' ? 'h-2.5' : 'h-3'} bg-primary rounded-full animate-pulse`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: `50% ${size === 'sm' ? '8px' : size === 'md' ? '12px' : size === 'lg' ? '16px' : '20px'}`,
                    transform: `translate(-50%, -50%) rotate(${i * (360 / (size === 'sm' ? 6 : size === 'md' ? 8 : size === 'lg' ? 8 : 10))}deg)`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            {showText && <span className={textClass}>{message}</span>}
          </div>
        )

      default:
        // Default case for 'bars' variant and any other cases - same as explicit 'bars' case
        return (
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center`} style={{
              width: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px',
              height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px'
            }}>
              {[...Array(size === 'sm' ? 6 : size === 'md' ? 8 : size === 'lg' ? 8 : 10)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute ${size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-0.5' : size === 'lg' ? 'w-0.5' : 'w-1'} ${size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2' : size === 'lg' ? 'h-2.5' : 'h-3'} bg-primary rounded-full animate-pulse`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: `50% ${size === 'sm' ? '8px' : size === 'md' ? '12px' : size === 'lg' ? '16px' : '20px'}`,
                    transform: `translate(-50%, -50%) rotate(${i * (360 / (size === 'sm' ? 6 : size === 'md' ? 8 : size === 'lg' ? 8 : 10))}deg)`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            {showText && <span className={textClass}>{message}</span>}
          </div>
        )
    }
  }

  return (
    <div className={`p-4 ${className}`}>
      {renderLoadingContent()}
    </div>
  )
}

interface TableLoadingSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableLoadingSkeleton({ 
  rows = 5, 
  columns = 6, 
  className = '' 
}: TableLoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface CardLoadingSkeletonProps {
  count?: number
  className?: string
}

export function CardLoadingSkeleton({ 
  count = 3, 
  className = '' 
}: CardLoadingSkeletonProps) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface ActionLoadingStateProps {
  isLoading: boolean
  loadingMessage?: string
  successMessage?: string
  errorMessage?: string
  onComplete?: () => void
  className?: string
}

export function ActionLoadingState({
  isLoading,
  loadingMessage = 'Traitement en cours...',
  successMessage = 'Action terminée avec succès',
  errorMessage,
  onComplete,
  className = ''
}: ActionLoadingStateProps) {
  const [state, setState] = React.useState<'loading' | 'success' | 'error' | 'idle'>('idle')

  React.useEffect(() => {
    if (isLoading) {
      setState('loading')
    } else if (errorMessage) {
      setState('error')
    } else if (successMessage && !isLoading) {
      setState('success')
      if (onComplete) {
        setTimeout(onComplete, 2000)
      }
    } else {
      setState('idle')
    }
  }, [isLoading, errorMessage, successMessage, onComplete])

  if (state === 'idle') return null

  const getIcon = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="relative w-4 h-4 flex items-center justify-center">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-1.5 bg-current rounded-full animate-pulse"
                style={{
                  left: '50%',
                  top: '50%',
                  transformOrigin: '50% 8px',
                  transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getMessage = () => {
    switch (state) {
      case 'loading':
        return loadingMessage
      case 'success':
        return successMessage
      case 'error':
        return errorMessage
      default:
        return ''
    }
  }

  const getClassName = () => {
    switch (state) {
      case 'loading':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return ''
    }
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${getClassName()} ${className}`}>
      {getIcon()}
      <span className="text-sm font-medium">{getMessage()}</span>
    </div>
  )
}

interface ContextualLoadingProps {
  context: 'dossiers' | 'notifications' | 'upload' | 'validation' | 'export'
  isLoading: boolean
  message?: string
  className?: string
}

export function ContextualLoading({
  context,
  isLoading,
  message,
  className = ''
}: ContextualLoadingProps) {
  if (!isLoading) return null

  const contextConfig = {
    dossiers: {
      icon: FileText,
      defaultMessage: 'Chargement des dossiers...',
      description: 'Récupération des dossiers validés par le CB'
    },
    notifications: {
      icon: Database,
      defaultMessage: 'Chargement des notifications...',
      description: 'Récupération des notifications récentes'
    },
    upload: {
      icon: Upload,
      defaultMessage: 'Upload en cours...',
      description: 'Téléchargement des fichiers'
    },
    validation: {
      icon: CheckCircle2,
      defaultMessage: 'Validation en cours...',
      description: 'Vérification des données'
    },
    export: {
      icon: Database,
      defaultMessage: 'Export en cours...',
      description: 'Génération du fichier d\'export'
    }
  }

  const config = contextConfig[context]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-3 p-4 ${className}`}>
      <Icon className="h-5 w-5 animate-pulse text-primary" />
      <div>
        <p className="text-sm font-medium">{message || config.defaultMessage}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>
    </div>
  )
}

/**
 * Composant de loader pour les boutons
 */
interface ButtonLoadingProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
  variant?: 'refresh' | 'delete' | 'save' | 'login' | 'spinner' | 'bars'
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'destructive' | 'muted'
  className?: string
}

export function ButtonLoading({
  isLoading,
  loadingText,
  children,
  variant = 'bars',
  size = 'sm',
  color = 'primary',
  className = ''
}: ButtonLoadingProps) {
  if (!isLoading) return <>{children}</>

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const colorClasses = {
    primary: 'text-primary',
    white: 'text-white',
    destructive: 'text-destructive',
    muted: 'text-muted-foreground'
  }

  const getIcon = () => {
    const iconClass = `${sizeClasses[size]} animate-spin ${colorClasses[color]}`
    const barsIconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
    const barIconCount = size === 'sm' ? 6 : size === 'md' ? 8 : 8
    const barIconWidth = size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-0.5' : 'w-0.5'
    const barIconHeight = size === 'sm' ? 'h-1' : size === 'md' ? 'h-1.5' : 'h-2'
    const iconRadius = size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px'

    switch (variant) {
      case 'bars':
        return (
          <div className={`relative ${barsIconSize}`}>
            {[...Array(barIconCount)].map((_, i) => (
              <div
                key={i}
                className={`absolute ${barIconWidth} ${barIconHeight} bg-current rounded-full animate-pulse`}
                style={{
                  left: '50%',
                  top: '50%',
                  transformOrigin: `50% ${iconRadius}`,
                  transform: `translate(-50%, -50%) rotate(${i * (360 / barIconCount)}deg)`,
                  animationDelay: `${i * 0.125}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )
      case 'spinner':
        return (
          <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
            {[...Array(size === 'sm' ? 6 : size === 'md' ? 8 : 8)].map((_, i) => (
              <div
                key={i}
                className={`absolute ${size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-0.5' : 'w-0.5'} ${size === 'sm' ? 'h-1' : size === 'md' ? 'h-1.5' : 'h-2'} bg-current rounded-full animate-pulse`}
                style={{
                  left: '50%',
                  top: '50%',
                  transformOrigin: `50% ${size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px'}`,
                  transform: `translate(-50%, -50%) rotate(${i * (360 / (size === 'sm' ? 6 : size === 'md' ? 8 : 8))}deg)`,
                  animationDelay: `${i * 0.125}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )
      case 'refresh':
        return <RefreshCw className={iconClass} />
      case 'delete':
        return <Trash2 className={iconClass} />
      case 'save':
        return <Save className={iconClass} />
      case 'login':
        return <LogIn className={iconClass} />
      default:
        // Default case for 'bars' variant and any other cases
        return (
          <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
            {[...Array(size === 'sm' ? 6 : size === 'md' ? 8 : 8)].map((_, i) => (
              <div
                key={i}
                className={`absolute ${size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-0.5' : 'w-0.5'} ${size === 'sm' ? 'h-1' : size === 'md' ? 'h-1.5' : 'h-2'} bg-current rounded-full animate-pulse`}
                style={{
                  left: '50%',
                  top: '50%',
                  transformOrigin: `50% ${size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px'}`,
                  transform: `translate(-50%, -50%) rotate(${i * (360 / (size === 'sm' ? 6 : size === 'md' ? 8 : 8))}deg)`,
                  animationDelay: `${i * 0.125}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )
    }
  }

  return (
    <div className={`flex items-center ${className}`}>
      {getIcon()}
      {loadingText && (
        <span className={`ml-2 text-sm ${colorClasses[color]}`}>
          {loadingText}
        </span>
      )}
    </div>
  )
}

/**
 * Composant de loader pour les pages complètes
 */
interface PageLoadingProps {
  isLoading: boolean
  message?: string
  size?: 'md' | 'lg' | 'xl'
  className?: string
}

export function PageLoading({
  isLoading,
  message = 'Chargement...',
  size = 'lg',
  className = ''
}: PageLoadingProps) {
  if (!isLoading) return null

  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center">
        <LoadingState
          isLoading={true}
          message={message}
          size={size}
          showText={true}
        />
      </div>
    </div>
  )
}

/**
 * Composant de loader pour les modales
 */
interface ModalLoadingProps {
  isLoading: boolean
  message?: string
  className?: string
}

export function ModalLoading({
  isLoading,
  message = 'Chargement...',
  className = ''
}: ModalLoadingProps) {
  if (!isLoading) return null

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <LoadingState
        isLoading={true}
        message={message}
        size="md"
        showText={true}
      />
    </div>
  )
}

/**
 * Hook pour gérer les états de chargement complexes
 */
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({})
  const [progressStates, setProgressStates] = React.useState<Record<string, number>>({})

  const setLoading = React.useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: isLoading }))
  }, [])

  const setProgress = React.useCallback((key: string, progress: number) => {
    setProgressStates(prev => ({ ...prev, [key]: progress }))
  }, [])

  const isLoading = React.useCallback((key: string) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const getProgress = React.useCallback((key: string) => {
    return progressStates[key] || 0
  }, [progressStates])

  const clearLoading = React.useCallback((key: string) => {
    setLoadingStates(prev => {
      const newState = { ...prev }
      delete newState[key]
      return newState
    })
    setProgressStates(prev => {
      const newState = { ...prev }
      delete newState[key]
      return newState
    })
  }, [])

  return {
    setLoading,
    setProgress,
    isLoading,
    getProgress,
    clearLoading,
    loadingStates,
    progressStates
  }
}
