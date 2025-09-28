'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, FileText, Folder, Tag, User } from './lucide-icons-stable'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/loading-states'

export interface SearchSuggestion {
  id: string
  text: string
  type: 'document' | 'folder' | 'tag' | 'user'
  metadata?: {
    title?: string
    description?: string
    fileType?: string
    fileSize?: number
    documentCount?: number
    tagCount?: number
  }
}

interface SearchSuggestionsProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: SearchSuggestion) => void
  onSubmit?: () => void
  placeholder?: string
  suggestions: SearchSuggestion[]
  isLoading?: boolean
  className?: string
  disabled?: boolean
}

export function SearchSuggestions({
  value,
  onChange,
  onSelect,
  onSubmit,
  placeholder = "Rechercher...",
  suggestions,
  isLoading = false,
  className,
  disabled = false
}: SearchSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Ouvrir/fermer les suggestions selon la valeur et les suggestions disponibles
  useEffect(() => {
    if (value.length >= 2 && suggestions.length > 0 && !isLoading) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }, [value, suggestions, isLoading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex])
        } else {
          // Si pas de suggestions ouvertes, soumettre la recherche
          onSubmit?.()
        }
        return
      case 'ArrowDown':
        if (!isOpen || suggestions.length === 0) return
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        if (!isOpen || suggestions.length === 0) return
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text)
    onSelect?.(suggestion)
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.blur()
  }

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />
      case 'folder':
        return <Folder className="h-4 w-4" />
      case 'tag':
        return <Tag className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getSuggestionBadge = (type: SearchSuggestion['type']) => {
    const badges = {
      document: { label: 'Document', variant: 'default' as const },
      folder: { label: 'Dossier', variant: 'secondary' as const },
      tag: { label: 'Tag', variant: 'outline' as const },
      user: { label: 'Utilisateur', variant: 'outline' as const }
    }
    return badges[type]
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= 2 && suggestions.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="pl-9 pr-4"
          disabled={disabled}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingState
              isLoading={true}
              variant="spinner"
              size="sm"
              color="primary"
              showText={false}
            />
          </div>
        )}
      </div>

      {/* Suggestions */}
      {isOpen && (
        <div
          ref={suggestionsRef}
          className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
        >
          <div className="max-h-60 overflow-y-auto p-1">
            {suggestions.map((suggestion, index) => (
              <Button
                key={suggestion.id}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 h-auto p-3',
                  highlightedIndex === index && 'bg-accent'
                )}
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-muted-foreground">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {suggestion.text}
                      </span>
                      <Badge variant={getSuggestionBadge(suggestion.type).variant} className="text-xs">
                        {getSuggestionBadge(suggestion.type).label}
                      </Badge>
                    </div>
                    {suggestion.metadata && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {suggestion.metadata.description && (
                          <div className="truncate">{suggestion.metadata.description}</div>
                        )}
                        {suggestion.metadata.fileType && (
                          <div className="flex items-center gap-2">
                            <span>{suggestion.metadata.fileType}</span>
                            {suggestion.metadata.fileSize && (
                              <span>• {formatFileSize(suggestion.metadata.fileSize)}</span>
                            )}
                          </div>
                        )}
                        {suggestion.metadata.documentCount && (
                          <span>{suggestion.metadata.documentCount} document(s)</span>
                        )}
                        {suggestion.metadata.tagCount && (
                          <span>{suggestion.metadata.tagCount} tag(s)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
