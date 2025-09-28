'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, 
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
  variant?: 'skeleton' | 'spinner' | 'progress' | 'pulse' | 'dots' | 'refresh' | 'delete' | 'save' | 'login'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'destructive' | 'muted'
  showText?: boolean
  className?: string
}

export function LoadingState({
  isLoading,
  message = 'Chargement...',
  progress,
  variant = 'spinner',
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
            <div className="flex items-center gap-2">
              <Loader2 className={iconClass} />
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
            <div className="relative">
              <div className={`${sizeClasses[size]} rounded-full bg-primary/20 animate-pulse`}></div>
              <div className={`${sizeClasses[size]} rounded-full bg-primary/40 animate-pulse absolute inset-0`} 
                   style={{ animationDelay: '0.5s' }}></div>
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
      default:
        return (
          <div className="flex items-center gap-3">
            <Loader2 className={iconClass} />
            {showText && <span className={textClass}>{message}</span>}
          </div>
        )
    }
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
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
        return <Loader2 className="h-4 w-4 animate-spin" />
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
  variant?: 'refresh' | 'delete' | 'save' | 'login' | 'spinner'
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'destructive' | 'muted'
  className?: string
}

export function ButtonLoading({
  isLoading,
  loadingText,
  children,
  variant = 'spinner',
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
    
    switch (variant) {
      case 'refresh':
        return <RefreshCw className={iconClass} />
      case 'delete':
        return <Trash2 className={iconClass} />
      case 'save':
        return <Save className={iconClass} />
      case 'login':
        return <LogIn className={iconClass} />
      default:
        return <Loader2 className={iconClass} />
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
          variant="spinner"
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
        variant="spinner"
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
