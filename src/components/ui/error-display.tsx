'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertTriangle, 
  RefreshCw, 
  XCircle, 
  Wifi, 
  Server, 
  FileX
 } from 'lucide-react'

export interface ErrorDisplayProps {
  error: string
  title?: string
  description?: string
  type?: 'network' | 'server' | 'validation' | 'permission' | 'notFound' | 'generic'
  onRetry?: () => void
  onDismiss?: () => void
  retryLabel?: string
  dismissLabel?: string
  showRetry?: boolean
  showDismiss?: boolean
  className?: string
  variant?: 'alert' | 'card' | 'inline'
}

const errorConfigs = {
  network: {
    icon: Wifi,
    title: 'Erreur de connexion',
    description: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
    className: 'border-orange-200 bg-orange-50 text-orange-800'
  },
  server: {
    icon: Server,
    title: 'Erreur du serveur',
    description: 'Le serveur a rencontré une erreur. Veuillez réessayer dans quelques instants.',
    className: 'border-red-200 bg-red-50 text-red-800'
  },
  validation: {
    icon: AlertTriangle,
    title: 'Erreur de validation',
    description: 'Les données fournies ne sont pas valides. Vérifiez les informations saisies.',
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800'
  },
  permission: {
    icon: XCircle,
    title: 'Accès refusé',
    description: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
    className: 'border-red-200 bg-red-50 text-red-800'
  },
  notFound: {
    icon: FileX,
    title: 'Ressource introuvable',
    description: 'La ressource demandée n\'a pas été trouvée ou a été supprimée.',
    className: 'border-gray-200 bg-gray-50 text-gray-800'
  },
  generic: {
    icon: AlertTriangle,
    title: 'Une erreur est survenue',
    description: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    className: 'border-red-200 bg-red-50 text-red-800'
  }
}

export function ErrorDisplay({
  error,
  title,
  description,
  type = 'generic',
  onRetry,
  onDismiss,
  retryLabel = 'Réessayer',
  dismissLabel = 'Fermer',
  showRetry = true,
  showDismiss = false,
  className = '',
  variant = 'alert'
}: ErrorDisplayProps) {
  const config = errorConfigs[type]
  const Icon = config.icon

  const errorContent = (
    <div className={`flex items-start gap-3 ${className}`}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="font-title-medium text-sm mb-1">
          {title || config.title}
        </h4>
        <p className="text-sm text-muted-foreground mb-2">
          {description || config.description}
        </p>
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            Détails techniques
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
            {error}
          </pre>
        </details>
        {(showRetry || showDismiss) && (
          <div className="flex gap-2 mt-3">
            {showRetry && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                {retryLabel}
              </Button>
            )}
            {showDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8"
              >
                {dismissLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (variant === 'card') {
    return (
      <Card className={`${config.className} ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title || config.title}
          </CardTitle>
          <CardDescription className="text-xs">
            {description || config.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground mb-3">
              Détails techniques
            </summary>
            <pre className="p-2 bg-muted rounded text-xs overflow-auto">
              {error}
            </pre>
          </details>
          {(showRetry || showDismiss) && (
            <div className="flex gap-2">
              {showRetry && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  {retryLabel}
                </Button>
              )}
              {showDismiss && onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-8"
                >
                  {dismissLabel}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`p-3 rounded-lg border ${config.className} ${className}`}>
        {errorContent}
      </div>
    )
  }

  // Variant 'alert' par défaut
  return (
    <Alert className={`${config.className} ${className}`}>
      {errorContent}
    </Alert>
  )
}

/**
 * Hook pour gérer les erreurs avec retry automatique
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<string | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)
  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleError = React.useCallback((error: Error | string, maxRetries = 3) => {
    const errorMessage = error instanceof Error ? error.message : error
    setError(errorMessage)
    
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
    }
  }, [retryCount])

  const retry = React.useCallback(async (retryFn: () => Promise<void>) => {
    if (isRetrying) return
    
    setIsRetrying(true)
    try {
      await retryFn()
      setError(null)
      setRetryCount(0)
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'Erreur lors du retry')
    } finally {
      setIsRetrying(false)
    }
  }, [isRetrying, handleError])

  const clearError = React.useCallback(() => {
    setError(null)
    setRetryCount(0)
  }, [])

  return {
    error,
    retryCount,
    isRetrying,
    handleError,
    retry,
    clearError,
    hasError: !!error
  }
}
