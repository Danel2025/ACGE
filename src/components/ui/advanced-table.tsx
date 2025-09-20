'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Share2,
  Filter,
  X
} from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  className?: string
  width?: string
}

export interface Action<T> {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: (row: T) => void
  variant?: 'default' | 'destructive' | 'outline'
  disabled?: (row: T) => boolean
  hidden?: (row: T) => boolean
}

export interface AdvancedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: Action<T>[]
  selectable?: boolean
  selectedRows?: T[]
  onSelectionChange?: (selectedRows: T[]) => void
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (field: string, order: 'asc' | 'desc') => void
  loading?: boolean
  emptyMessage?: string
  className?: string
  rowKey?: keyof T | ((row: T) => string)
  onRowClick?: (row: T) => void
  bulkActions?: {
    label: string
    icon?: React.ReactNode
    onClick: (selectedRows: T[]) => void
    variant?: 'default' | 'destructive' | 'outline'
  }[]
}

export function AdvancedTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  sortField,
  sortOrder = 'asc',
  onSort,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  className = '',
  rowKey = 'id',
  onRowClick,
  bulkActions = []
}: AdvancedTableProps<T>) {
  const [internalSelectedRows, setInternalSelectedRows] = React.useState<T[]>(selectedRows)
  const [showBulkActions, setShowBulkActions] = React.useState(false)

  const currentSelectedRows = selectedRows.length > 0 ? selectedRows : internalSelectedRows

  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row)
    }
    return String(row[rowKey] || index)
  }

  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelection = checked
      ? [...currentSelectedRows, row]
      : currentSelectedRows.filter(r => getRowKey(r, 0) !== getRowKey(row, 0))
    
    if (onSelectionChange) {
      onSelectionChange(newSelection)
    } else {
      setInternalSelectedRows(newSelection)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? [...data] : []
    
    if (onSelectionChange) {
      onSelectionChange(newSelection)
    } else {
      setInternalSelectedRows(newSelection)
    }
  }

  const handleSort = (field: string) => {
    if (!onSort) return
    
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'
    onSort(field, newOrder)
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const isAllSelected = data.length > 0 && currentSelectedRows.length === data.length
  const isIndeterminate = currentSelectedRows.length > 0 && currentSelectedRows.length < data.length

  React.useEffect(() => {
    setShowBulkActions(currentSelectedRows.length > 0)
  }, [currentSelectedRows.length])

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            {columns.map((_, j) => (
              <div key={j} className="h-4 bg-muted rounded flex-1 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          <Filter className="mx-auto h-10 w-10 mb-2" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Actions en lot - Responsive */}
      {showBulkActions && bulkActions.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {currentSelectedRows.length} élément{currentSelectedRows.length > 1 ? 's' : ''} sélectionné{currentSelectedRows.length > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => action.onClick(currentSelectedRows)}
                className="h-8 flex-shrink-0"
              >
                {action.icon && <span className="mr-2 hidden sm:inline">{action.icon}</span>}
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onSelectionChange) {
                  onSelectionChange([])
                } else {
                  setInternalSelectedRows([])
                }
              }}
              className="h-8 flex-shrink-0"
              aria-label="Désélectionner tout"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tableau avec scroll horizontal sur mobile */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate
                    }}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead 
                  key={String(column.key)}
                  className={`${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''} whitespace-nowrap`}
                  style={{ width: column.width, minWidth: column.width || '120px' }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{column.label}</span>
                    {column.sortable && getSortIcon(String(column.key))}
                  </div>
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-16 min-w-[64px] text-center">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const rowId = getRowKey(row, index)
              const isSelected = currentSelectedRows.some(r => getRowKey(r, 0) === rowId)
              
              return (
                <TableRow 
                  key={rowId}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${isSelected ? 'bg-muted/50' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(row, checked as boolean)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell 
                      key={String(column.key)}
                      className={`${column.className || ''} max-w-[200px]`}
                    >
                      <div className="truncate" title={String(row[column.key] || '')}>
                        {column.render 
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || '')
                        }
                      </div>
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ouvrir le menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action) => {
                            if (action.hidden?.(row)) return null
                            
                            return (
                              <DropdownMenuItem
                                key={action.key}
                                onClick={() => action.onClick(row)}
                                disabled={action.disabled?.(row)}
                                className={action.variant === 'destructive' ? 'text-destructive' : ''}
                              >
                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                {action.label}
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook pour gérer la sélection de lignes
 */
export function useTableSelection<T>(initialData: T[] = []) {
  const [selectedRows, setSelectedRows] = React.useState<T[]>([])
  const [selectAll, setSelectAll] = React.useState(false)

  const handleSelectionChange = React.useCallback((rows: T[]) => {
    setSelectedRows(rows)
    setSelectAll(rows.length === initialData.length && initialData.length > 0)
  }, [initialData.length])

  const handleSelectAll = React.useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRows([...initialData])
      setSelectAll(true)
    } else {
      setSelectedRows([])
      setSelectAll(false)
    }
  }, [initialData])

  const clearSelection = React.useCallback(() => {
    setSelectedRows([])
    setSelectAll(false)
  }, [])

  return {
    selectedRows,
    selectAll,
    handleSelectionChange,
    handleSelectAll,
    clearSelection,
    hasSelection: selectedRows.length > 0
  }
}
