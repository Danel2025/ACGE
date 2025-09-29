'use client'

import React, { ReactNode, forwardRef } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Types pour la configuration
export type CompactStatsSize = 'xs' | 'sm' | 'md' | 'lg'
export type CompactStatsVariant = 'default' | 'compact' | 'detailed' | 'minimal'
export type CompactStatsColumns = 1 | 2 | 3 | 4 | 5 | 6
export type CompactStatsColorScheme = 'default' | 'colorful' | 'monochrome' | 'pastel'

export interface StatItem {
  /** Libellé principal de la statistique */
  label: string
  /** Valeur à afficher (peut être un nombre, string, ou composant React) */
  value: string | number | ReactNode
  /** Icône à afficher */
  icon: ReactNode
  /** Classes CSS personnalisées pour l'icône */
  className?: string
  /** Sous-titre optionnel */
  subtitle?: string
  /** Action au clic sur la carte */
  onClick?: () => void
  /** Si cet élément spécifique est en cours de chargement */
  loading?: boolean
  /** Tooltip personnalisé */
  tooltip?: string
  /** Couleur personnalisée pour l'icône */
  color?: string
  /** Si cet élément est désactivé */
  disabled?: boolean
  /** Badge à afficher (ex: "Nouveau", "Bêta") */
  badge?: string
}

export interface CompactStatsProps {
  /** Tableau des statistiques à afficher */
  stats: StatItem[]
  /** Nombre de colonnes (1 à 6) */
  columns?: CompactStatsColumns
  /** Taille des cartes */
  size?: CompactStatsSize
  /** Variante d'affichage */
  variant?: CompactStatsVariant
  /** Schéma de couleurs */
  colorScheme?: CompactStatsColorScheme
  /** Classes CSS personnalisées */
  className?: string
  /** Si toutes les cartes sont en chargement */
  loading?: boolean
  /** Si le composant est désactivé */
  disabled?: boolean
  /** Afficher les animations */
  animated?: boolean
  /** Afficher les tooltips */
  showTooltips?: boolean
  /** Fonction callback quand une stat est cliquée */
  onStatClick?: (stat: StatItem, index: number) => void
  /** Configuration personnalisée des couleurs */
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
  }
}

/**
 * Composant réutilisable pour afficher des statistiques dans des cartes compactes et ergonomiques
 *
 * @example
 * ```tsx
 * <CompactStats
 *   stats={[
 *     {
 *       label: "Total Users",
 *       value: 1234,
 *       icon: <Users className="h-5 w-5 text-blue-600" />,
 *       className: "bg-blue-100",
 *       subtitle: "Active users",
 *       tooltip: "Nombre total d'utilisateurs actifs"
 *     },
 *     {
 *       label: "Revenue",
 *       value: "$45,231",
 *       icon: <DollarSign className="h-5 w-5 text-green-600" />,
 *       className: "bg-green-100",
 *       subtitle: "This month",
 *       onClick: () => console.log('Revenue clicked')
 *     }
 *   ]}
 *   columns={4}
 *   size="md"
 *   variant="default"
 *   animated={true}
 *   showTooltips={true}
 * />
 * ```
 */
const CompactStats = forwardRef<HTMLDivElement, CompactStatsProps>(({
  stats,
  columns = 3,
  size = 'md',
  variant = 'default',
  colorScheme = 'default',
  className = '',
  loading = false,
  disabled = false,
  animated = true,
  showTooltips = false,
  onStatClick,
  customColors
}, ref) => {
  // Configuration des colonnes - Affichage horizontal sur une seule ligne
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  // Configuration des tailles
  const sizeConfig = {
    xs: {
      card: 'p-2',
      icon: 'p-1',
      iconSize: 'h-3 w-3',
      text: 'text-xs',
      value: 'text-sm',
      gap: 'gap-2',
      spacing: 'gap-1.5',
      badge: 'text-xs px-1 py-0.5'
    },
    sm: {
      card: 'p-2.5',
      icon: 'p-1.5',
      iconSize: 'h-4 w-4',
      text: 'text-xs',
      value: 'text-base',
      gap: 'gap-2.5',
      spacing: 'gap-2',
      badge: 'text-xs px-1.5 py-0.5'
    },
    md: {
      card: 'p-3',
      icon: 'p-2',
      iconSize: 'h-5 w-5',
      text: 'text-sm',
      value: 'text-lg',
      gap: 'gap-3',
      spacing: 'gap-2.5',
      badge: 'text-xs px-2 py-1'
    },
    lg: {
      card: 'p-4',
      icon: 'p-2.5',
      iconSize: 'h-6 w-6',
      text: 'text-base',
      value: 'text-xl',
      gap: 'gap-3.5',
      spacing: 'gap-3',
      badge: 'text-sm px-2.5 py-1.5'
    }
  }

  // Configuration des variantes
  const variantConfig = {
    default: '',
    compact: 'hover:shadow-none',
    detailed: 'border-2',
    minimal: 'border-none shadow-none p-2'
  }

  // Configuration des schémas de couleurs - Version épurée sans couleurs ni ombres
  const colorSchemes = {
    default: {
      background: 'bg-transparent border border-gray-200',
      hover: ''
    },
    colorful: {
      background: 'bg-transparent border border-gray-200',
      hover: ''
    },
    monochrome: {
      background: 'bg-transparent border border-gray-200',
      hover: ''
    },
    pastel: {
      background: 'bg-transparent border border-gray-200',
      hover: ''
    }
  }

  const currentConfig = sizeConfig[size]
  const currentVariant = variantConfig[variant]
  const currentColors = colorSchemes[colorScheme]

  // État de chargement global
  if (loading) {
    return (
      <div ref={ref} className={cn(`grid ${gridCols[columns]} ${className}`)}>
        {Array.from({ length: columns * 2 }).map((_, index) => (
          <Card key={index} className={cn(currentConfig.card, 'animate-pulse')}>
            <div className={cn('flex items-center', currentConfig.gap)}>
              <Skeleton className={cn('rounded-md', currentConfig.iconSize)} />
              <div className="flex-1 space-y-1">
                <Skeleton className={cn('h-3 w-20', currentConfig.text)} />
                <Skeleton className={cn('h-2 w-16', 'text-xs')} />
              </div>
              <Skeleton className={cn('h-5 w-12', currentConfig.value)} />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const StatCard = ({ stat, index }: { stat: StatItem; index: number }) => {
    const isClickable = !disabled && !stat.disabled && (stat.onClick || onStatClick)
    const cardClasses = cn(
      currentConfig.card,
      currentVariant,
      currentColors.background,
      animated && currentColors.hover,
      animated && 'transition-all duration-200',
      isClickable && 'cursor-pointer',
      disabled || stat.disabled ? 'opacity-60 cursor-not-allowed' : '',
      stat.className,
      customColors?.background
    )

    const handleClick = () => {
      if (disabled || stat.disabled) return
      stat.onClick?.()
      onStatClick?.(stat, index)
    }

    const cardContent = (
      <Card className={cardClasses} onClick={handleClick}>
        <div className={cn('flex items-center', currentConfig.gap)}>
          {/* Icône */}
          <div className="flex-shrink-0">
            <div className={cn(
              currentConfig.icon,
              'rounded-md flex items-center justify-center',
              'bg-gray-50'
            )}>
              {stat.color ? (
                React.cloneElement(stat.icon as React.ReactElement, {
                  className: cn(
                    (stat.icon as React.ReactElement).props.className,
                    `text-${stat.color}-600`
                  )
                })
              ) : (
                stat.icon
              )}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              {/* Label et sous-titre */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={cn(
                    currentConfig.text,
                    'font-medium text-gray-900 truncate leading-tight'
                  )}>
                    {stat.label}
                  </p>
                  {stat.badge && (
                    <span className={cn(
                      'inline-flex items-center rounded-full bg-blue-100 text-blue-800 font-medium',
                      currentConfig.badge
                    )}>
                      {stat.badge}
                    </span>
                  )}
                </div>
                {stat.subtitle && (
                  <p className={cn(
                    'text-xs text-muted-foreground truncate leading-tight',
                    variant === 'compact' ? 'mt-0' : 'mt-0'
                  )}>
                    {stat.subtitle}
                  </p>
                )}
              </div>

              {/* Compteur */}
              <div className="flex-shrink-0 ml-3">
                {stat.loading ? (
                  <Skeleton className={cn('h-5 w-12', currentConfig.value)} />
                ) : (
                  <div className={cn(
                    currentConfig.value,
                    'font-bold text-gray-900 truncate'
                  )}>
                    {stat.value}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    )

    // Wrapper avec tooltip si nécessaire
    if (showTooltips && stat.tooltip) {
      return (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              {cardContent}
            </TooltipTrigger>
            <TooltipContent>
              <p>{stat.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return <div key={index}>{cardContent}</div>
  }

  return (
    <div ref={ref} className={cn(`grid gap-3 ${gridCols[columns]} ${className}`)}>
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} index={index} />
      ))}
    </div>
  )
})

CompactStats.displayName = 'CompactStats'

// Export par défaut
export default CompactStats

