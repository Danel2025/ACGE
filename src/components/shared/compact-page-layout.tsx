'use client'

import { ReactNode } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from './page-header'
import CompactStats from './compact-stats'
import { ContentSection } from './content-section'
import { EmptyState } from './empty-state'

interface CompactPageLayoutProps {
  children: ReactNode
  className?: string
}

export function CompactPageLayout({ 
  children, 
  className = '' 
}: CompactPageLayoutProps) {
  return (
    <MainLayout>
      <div className={`space-y-4 ${className}`}>
        {children}
      </div>
    </MainLayout>
  )
}

// Export des composants pour faciliter l'import
export { PageHeader, ContentSection, EmptyState }
