'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { DocumentFilters } from './documents-filters'

interface ActiveFiltersDisplayProps {
  filters: DocumentFilters
  onRemoveFilter: (filterKey: keyof DocumentFilters) => void
  onClearAll: () => void
}

export function ActiveFiltersDisplay({ 
  filters, 
  onRemoveFilter, 
  onClearAll 
}: ActiveFiltersDisplayProps) {
  const activeFilters = []

  if (filters.search) {
    activeFilters.push({
      key: 'search' as keyof DocumentFilters,
      label: `Recherche: "${filters.search}"`,
      value: filters.search
    })
  }

  if (filters.fileType) {
    const fileTypeLabels: Record<string, string> = {
      'pdf': 'PDF',
      'image': 'Images',
      'video': 'Vidéos',
      'audio': 'Audio',
      'text': 'Texte',
      'sheet': 'Tableurs',
      'doc': 'Documents',
      'archive': 'Archives'
    }
    activeFilters.push({
      key: 'fileType' as keyof DocumentFilters,
      label: `Type: ${fileTypeLabels[filters.fileType] || filters.fileType}`,
      value: filters.fileType
    })
  }

  if (filters.minSize || filters.maxSize) {
    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    let sizeLabel = 'Taille: '
    if (filters.minSize && filters.maxSize) {
      sizeLabel += `${formatSize(filters.minSize)} - ${formatSize(filters.maxSize)}`
    } else if (filters.minSize) {
      sizeLabel += `≥ ${formatSize(filters.minSize)}`
    } else if (filters.maxSize) {
      sizeLabel += `≤ ${formatSize(filters.maxSize)}`
    }
    
    activeFilters.push({
      key: 'minSize' as keyof DocumentFilters,
      label: sizeLabel,
      value: filters.minSize || filters.maxSize
    })
  }

  if (filters.startDate || filters.endDate) {
    const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR')
    let dateLabel = 'Période: '
    if (filters.startDate && filters.endDate) {
      dateLabel += `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
    } else if (filters.startDate) {
      dateLabel += `≥ ${formatDate(filters.startDate)}`
    } else if (filters.endDate) {
      dateLabel += `≤ ${formatDate(filters.endDate)}`
    }
    
    activeFilters.push({
      key: 'startDate' as keyof DocumentFilters,
      label: dateLabel,
      value: filters.startDate || filters.endDate
    })
  }

  if (filters.folderId) {
    activeFilters.push({
      key: 'folderId' as keyof DocumentFilters,
      label: `Dossier: ${filters.folderId === 'root' ? 'Racine' : filters.folderId}`,
      value: filters.folderId
    })
  }

  if (filters.tags && filters.tags.length > 0) {
    activeFilters.push({
      key: 'tags' as keyof DocumentFilters,
      label: `Tags: ${filters.tags.join(', ')}`,
      value: filters.tags.join(',')
    })
  }

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-md">
      <span className="text-sm font-medium text-muted-foreground">
        Filtres actifs:
      </span>
      {activeFilters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="gap-1">
          {filter.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 ml-1 hover:bg-transparent"
            onClick={() => onRemoveFilter(filter.key)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Tout effacer
      </Button>
    </div>
  )
}
