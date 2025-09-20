'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ResponsiveTableWrapperProps {
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper pour rendre les tableaux existants responsives
 * Ajoute le scroll horizontal et améliore l'accessibilité tactile
 */
export function ResponsiveTableWrapper({ children, className }: ResponsiveTableWrapperProps) {
  return (
    <div className={cn("rounded-md border overflow-hidden", className)}>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  )
}

/**
 * Composant pour améliorer les boutons d'actions dans les tableaux
 */
interface TableActionButtonProps {
  onClick?: () => void
  children: React.ReactNode
  variant?: 'ghost' | 'outline' | 'default'
  size?: 'sm' | 'icon' | 'default'
  className?: string
  disabled?: boolean
}

export function TableActionButton({ 
  onClick, 
  children, 
  variant = 'ghost', 
  size = 'sm', 
  className,
  disabled 
}: TableActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'touch-target', // Taille tactile appropriée
        size === 'icon' && 'h-9 w-9 sm:h-8 sm:w-8', // Responsive pour les boutons icônes
        className
      )}
    >
      {children}
    </Button>
  )
}

/**
 * Menu d'actions responsive pour les tableaux
 */
interface TableActionsMenuProps {
  actions: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive'
    disabled?: boolean
  }>
  className?: string
}

export function TableActionsMenu({ actions, className }: TableActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TableActionButton size="icon" className={className}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ouvrir le menu d'actions</span>
        </TableActionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              'cursor-pointer',
              action.variant === 'destructive' && 'text-destructive focus:text-destructive'
            )}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Cellule responsive pour les tableaux
 * Ajoute la troncature et les tooltips automatiquement
 */
interface ResponsiveTableCellProps extends React.ComponentProps<typeof TableCell> {
  truncate?: boolean
  maxWidth?: string
}

export function ResponsiveTableCell({ 
  children, 
  className, 
  truncate = true, 
  maxWidth = '200px',
  ...props 
}: ResponsiveTableCellProps) {
  return (
    <TableCell 
      className={cn(
        truncate && `max-w-[${maxWidth}]`,
        className
      )}
      {...props}
    >
      {truncate ? (
        <div className="truncate" title={typeof children === 'string' ? children : undefined}>
          {children}
        </div>
      ) : (
        children
      )}
    </TableCell>
  )
}

// Ré-export des composants de table pour faciliter l'utilisation
export { Table, TableBody, TableHead, TableHeader, TableRow }
