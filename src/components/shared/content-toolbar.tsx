'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SortAsc, SortDesc, Filter, Search } from 'lucide-react'
import { SearchSuggestions, type SearchSuggestion } from '@/components/ui/search-suggestions'
import { useSearchSuggestions } from '@/hooks/use-search-suggestions'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SortOrder = 'asc' | 'desc'

interface SortOption {
  value: string
  label: string
}

interface ContentToolbarProps<T = string> {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onSearchSelect?: (suggestion: SearchSuggestion) => void
  onSearchSubmit?: () => void
  searchPlaceholder?: string
  sortField: T
  sortOrder: SortOrder
  sortOptions: SortOption[]
  onSortFieldChange: (field: T) => void
  onSortOrderChange: (order: SortOrder) => void
  onOpenFilters?: () => void
  showFilters?: boolean
  className?: string
  enableSuggestions?: boolean
}

export function ContentToolbar<T = string>({
  searchQuery,
  onSearchQueryChange,
  onSearchSelect,
  onSearchSubmit,
  searchPlaceholder = "Rechercher...",
  sortField,
  sortOrder,
  sortOptions,
  onSortFieldChange,
  onSortOrderChange,
  onOpenFilters,
  showFilters = true,
  className,
  enableSuggestions = true,
}: ContentToolbarProps<T>) {
  // Hook pour les suggestions si activées
  const { suggestions, isLoading: suggestionsLoading } = enableSuggestions 
    ? useSearchSuggestions(searchQuery, { debounceMs: 300, minQueryLength: 2, maxSuggestions: 8 })
    : { suggestions: [], isLoading: false }

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-2 sm:flex-row sm:items-center',
        className,
      )}
    >
      {/* Recherche avec suggestions */}
      <div className="relative flex-1">
        {enableSuggestions ? (
          <SearchSuggestions
            value={searchQuery}
            onChange={onSearchQueryChange}
            onSelect={onSearchSelect}
            onSubmit={onSearchSubmit}
            placeholder={searchPlaceholder}
            suggestions={suggestions}
            isLoading={suggestionsLoading}
          />
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* Tri et Mode d'affichage - Responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
        {/* Tri - Responsive width */}
        <Select
          value={sortField}
          onValueChange={(v) => onSortFieldChange(v)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 justify-between sm:justify-start">
          {/* Ordre de tri */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={sortOrder === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="touch-target flex-shrink-0"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>

          {/* Filtres additionnels */}
          {showFilters && onOpenFilters && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onOpenFilters}
              className="flex-shrink-0"
            >
              <Filter className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Filtres</span>
              <span className="sm:hidden">Filtres</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
