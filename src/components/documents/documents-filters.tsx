'use client'

import { useState } from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { 
  Filter, 
  X, 
  Calendar,
  FileType,
  HardDrive,
  Tag,
  Folder,
  RotateCcw,
  Search,
  ChevronDown,
  Plus,
  Minus,
  Settings
} from 'lucide-react'

export interface DocumentFilters {
  search?: string
  fileType?: string
  minSize?: number
  maxSize?: number
  startDate?: string
  endDate?: string
  folderId?: string
  tags?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface DocumentsFiltersProps {
  isOpen: boolean
  onClose: () => void
  filters: DocumentFilters
  onApplyFilters: (filters: DocumentFilters) => void
  folders?: Array<{ id: string; name: string }>
  availableTags?: string[]
}

const FILE_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Vidéos' },
  { value: 'audio', label: 'Audio' },
  { value: 'text', label: 'Texte' },
  { value: 'sheet', label: 'Tableurs' },
  { value: 'doc', label: 'Documents' },
  { value: 'archive', label: 'Archives' }
]

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Date de modification' },
  { value: 'createdAt', label: 'Date de création' },
  { value: 'title', label: 'Nom' },
  { value: 'fileSize', label: 'Taille' },
  { value: 'fileName', label: 'Nom du fichier' }
]

export function DocumentsFilters({ 
  isOpen, 
  onClose, 
  filters, 
  onApplyFilters,
  folders = [],
  availableTags = []
}: DocumentsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<DocumentFilters>(filters)
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(
    filters.fileType ? [filters.fileType] : []
  )

  const handleReset = () => {
    const resetFilters: DocumentFilters = {
      sortBy: 'updatedAt',
      sortOrder: 'desc'
      // Pas de folderId - affiche TOUS les documents par défaut
    }
    setLocalFilters(resetFilters)
    setSelectedTags([])
    setTagInput('')
    setSelectedFileTypes([])
    setShowAdvanced(false)
    onApplyFilters(resetFilters)
  }

  const handleApply = () => {
    onApplyFilters({
      ...localFilters,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      fileType: selectedFileTypes.length === 1 ? selectedFileTypes[0] : undefined
    })
    onClose()
  }

  const addTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (localFilters.search) count++
    if (selectedFileTypes.length > 0) count++
    if (localFilters.minSize || localFilters.maxSize) count++
    if (localFilters.startDate || localFilters.endDate) count++
    if (localFilters.folderId) count++
    if (selectedTags.length > 0) count++
    return count
  }

  const toggleFileType = (fileType: string) => {
    setSelectedFileTypes(prev => 
      prev.includes(fileType) 
        ? prev.filter(t => t !== fileType)
        : [...prev, fileType]
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[420px] sm:w-[540px] overflow-y-auto bg-gradient-to-b from-background to-muted/20">
        {/* Header moderne avec gradient */}
        <SheetHeader className="pb-8 border-b bg-gradient-to-r from-primary/5 to-primary/10 -mx-6 px-8 -mt-6 pt-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-title-semibold">
                  Filtres avancés
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground mt-1">
                  Affinez votre recherche avec précision
                </SheetDescription>
              </div>
            </div>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium">
                {getActiveFiltersCount()} actif{getActiveFiltersCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-8 px-2">
          {/* Section Recherche - Priorité haute */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <Label className="text-base font-title-medium text-foreground">Recherche textuelle</Label>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans le titre, description, nom de fichier..."
                value={localFilters.search || ''}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  search: e.target.value || undefined
                })}
                className="pl-10 h-11 bg-background/50 border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Section Types de fichiers */}
          <div className="space-y-4 p-6 rounded-xl bg-muted/30 border border-muted">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950/50">
                <FileType className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <Label className="text-base font-title-medium text-foreground">Type de fichier</Label>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-11 bg-background/50 hover:bg-background/80 transition-all duration-200">
                  <span className="flex items-center gap-2">
                    {selectedFileTypes.length === 0 
                      ? "Tous les types" 
                      : selectedFileTypes.length === 1
                        ? FILE_TYPES.find(t => t.value === selectedFileTypes[0])?.label
                        : `${selectedFileTypes.length} types sélectionnés`
                    }
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2">
                <DropdownMenuLabel className="text-sm font-medium px-2 py-1.5">Types de fichiers</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-1">
                  {FILE_TYPES.filter(t => t.value !== 'all').map(type => (
                    <DropdownMenuCheckboxItem
                      key={type.value}
                      checked={selectedFileTypes.includes(type.value)}
                      onCheckedChange={() => toggleFileType(type.value)}
                      className="text-sm"
                    >
                      {type.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {selectedFileTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-muted">
                {selectedFileTypes.map(fileType => (
                  <Badge 
                    key={fileType} 
                    variant="secondary" 
                    className="gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-colors duration-200"
                  >
                    {FILE_TYPES.find(t => t.value === fileType)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors duration-200" 
                      onClick={() => toggleFileType(fileType)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Section Tags */}
          <div className="space-y-4 p-6 rounded-xl bg-muted/30 border border-muted">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <Label className="text-base font-title-medium text-foreground">Tags</Label>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ajouter un tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  className="pl-10 h-11 bg-background/50 border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <Button 
                onClick={addTag} 
                disabled={!tagInput.trim()}
                className="h-11 px-4 bg-primary hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-muted">
                {selectedTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors duration-200"
                  >
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4 hover:bg-destructive/20 rounded-full transition-colors duration-200"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Section Tri - Toujours visible */}
          <div className="space-y-4 p-6 rounded-xl bg-muted/30 border border-muted">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/50">
                <Settings className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <Label className="text-base font-title-medium text-foreground">Tri</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sort-field" className="text-sm text-muted-foreground font-title-medium">
                  Critère
                </Label>
                <Select 
                  value={localFilters.sortBy || 'updatedAt'} 
                  onValueChange={(value) => setLocalFilters({
                    ...localFilters,
                    sortBy: value
                  })}
                >
                  <SelectTrigger id="sort-field" className="h-11 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort-order" className="text-sm text-muted-foreground font-title-medium">
                  Ordre
                </Label>
                <Select 
                  value={localFilters.sortOrder || 'desc'} 
                  onValueChange={(value: 'asc' | 'desc') => setLocalFilters({
                    ...localFilters,
                    sortOrder: value
                  })}
                >
                  <SelectTrigger id="sort-order" className="h-11 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Décroissant</SelectItem>
                    <SelectItem value="asc">Croissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Filtres avancés - Section collapsible */}
          <div className="space-y-4">
            <div 
              className="flex items-center justify-between p-6 rounded-xl bg-muted/30 border border-muted cursor-pointer hover:bg-muted/50 transition-colors duration-200"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/50">
                  <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <Label className="text-base font-title-medium text-foreground cursor-pointer">
                  Filtres avancés
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  {showAdvanced ? 'Masquer' : 'Afficher'}
                </Badge>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            {showAdvanced && (
              <div className="space-y-6 p-6 rounded-xl bg-muted/20 border border-muted/50 animate-in slide-in-from-top-2 duration-300">
                {/* Taille du fichier */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50">
                      <HardDrive className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <Label className="text-sm font-title-medium">Taille du fichier (MB)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="min-size" className="text-xs text-muted-foreground font-title-medium">
                        Minimum
                      </Label>
                      <Input
                        id="min-size"
                        type="number"
                        placeholder="0"
                        min="0"
                        step="0.1"
                        value={localFilters.minSize ? (localFilters.minSize / (1024 * 1024)).toFixed(1) : ''}
                        onChange={(e) => setLocalFilters({
                          ...localFilters,
                          minSize: e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined
                        })}
                        className="h-10 bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-size" className="text-xs text-muted-foreground font-title-medium">
                        Maximum
                      </Label>
                      <Input
                        id="max-size"
                        type="number"
                        placeholder="100"
                        min="0"
                        step="0.1"
                        value={localFilters.maxSize ? (localFilters.maxSize / (1024 * 1024)).toFixed(1) : ''}
                        onChange={(e) => setLocalFilters({
                          ...localFilters,
                          maxSize: e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined
                        })}
                        className="h-10 bg-background/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Période */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Label className="text-sm font-title-medium">Période</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-xs text-muted-foreground font-title-medium">
                        Date de début
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={localFilters.startDate || ''}
                        onChange={(e) => setLocalFilters({
                          ...localFilters,
                          startDate: e.target.value || undefined
                        })}
                        className="h-10 bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-xs text-muted-foreground font-title-medium">
                        Date de fin
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={localFilters.endDate || ''}
                        onChange={(e) => setLocalFilters({
                          ...localFilters,
                          endDate: e.target.value || undefined
                        })}
                        className="h-10 bg-background/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Dossier */}
                {folders.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/50">
                        <Folder className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <Label className="text-sm font-title-medium">Dossier</Label>
                    </div>
                    <Select 
                      value={localFilters.folderId || 'all'} 
                      onValueChange={(value) => setLocalFilters({
                        ...localFilters,
                        folderId: value === 'all' ? undefined : value
                      })}
                    >
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue placeholder="Tous les dossiers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les dossiers</SelectItem>
                        <SelectItem value="root">Racine (sans dossier)</SelectItem>
                        {folders.map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer avec actions */}
        <SheetFooter className="flex gap-4 pt-10 border-t bg-gradient-to-r from-muted/20 to-muted/10 -mx-6 px-8 -mb-6 pb-8 mt-10">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            className="flex-1 h-12 bg-background/50 hover:bg-background/80 transition-all duration-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button 
            onClick={handleApply} 
            className="flex-1 h-12 bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Filter className="h-4 w-4 mr-2" />
            Appliquer les filtres
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
