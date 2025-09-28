'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions, 
  className = '' 
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4 border-b ${className}`}>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-title-bold text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
