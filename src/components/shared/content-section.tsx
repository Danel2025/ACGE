'use client'

import { ReactNode } from 'react'

interface ContentSectionProps {
  title?: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export function ContentSection({ 
  title, 
  subtitle, 
  children, 
  actions,
  className = '' 
}: ContentSectionProps) {
  return (
    <div className={`space-y-0 p-4 bg-card rounded-lg border ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && (
              <h3 className="text-sm font-title-medium">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
