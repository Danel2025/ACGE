'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  Pin, 
  MessageSquare, 
  Highlighter,
  Type,
  ArrowRight,
  Circle,
  Square,
  Save
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Annotation {
  id: string
  type: 'text' | 'highlight' | 'arrow' | 'circle' | 'square' | 'pin'
  x: number
  y: number
  width?: number
  height?: number
  content?: string
  color: string
  createdAt: Date
  updatedAt: Date
  author: string
}

interface DocumentAnnotationsProps {
  documentId: string
  isVisible: boolean
  onToggle: () => void
  onAnnotationAdd?: (annotation: Annotation) => void
  onAnnotationUpdate?: (annotation: Annotation) => void
  onAnnotationDelete?: (annotationId: string) => void
  className?: string
}

const ANNOTATION_TYPES = [
  { type: 'text', icon: Type, label: 'Texte', color: 'bg-blue-500' },
  { type: 'highlight', icon: Highlighter, label: 'Surlignage', color: 'bg-yellow-500' },
  { type: 'arrow', icon: ArrowRight, label: 'Flèche', color: 'bg-red-500' },
  { type: 'circle', icon: Circle, label: 'Cercle', color: 'bg-green-500' },
  { type: 'square', icon: Square, label: 'Rectangle', color: 'bg-purple-500' },
  { type: 'pin', icon: Pin, label: 'Épinglette', color: 'bg-orange-500' }
] as const

const COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16'  // lime
]

export function DocumentAnnotations({
  documentId,
  isVisible,
  onToggle,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  className
}: DocumentAnnotationsProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedType, setSelectedType] = useState<Annotation['type']>('text')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Chargement des annotations existantes
  useEffect(() => {
    // Ici on pourrait charger les annotations depuis l'API
    // Pour l'instant, on utilise des données de démonstration
    setAnnotations([])
  }, [documentId])

  // Gestion du dessin
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isVisible || isEditing) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setStartPos({ x, y })
    setCurrentPos({ x, y })
    setIsDrawing(true)

    if (selectedType === 'text' || selectedType === 'pin') {
      // Créer directement une annotation de type texte ou pin
      createAnnotation(x, y, 0, 0)
    }
  }, [isVisible, isEditing, selectedType])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !isVisible) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentPos({ x, y })
  }, [isDrawing, isVisible])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !isVisible) return

    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)

    if (width > 5 || height > 5 || selectedType === 'pin') {
      createAnnotation(
        Math.min(startPos.x, currentPos.x),
        Math.min(startPos.y, currentPos.y),
        width,
        height
      )
    }

    setIsDrawing(false)
  }, [isDrawing, isVisible, startPos, currentPos, selectedType])

  // Création d'une annotation
  const createAnnotation = useCallback((x: number, y: number, width: number, height: number) => {
    const annotation: Annotation = {
      id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: selectedType,
      x,
      y,
      width: width || 100,
      height: height || 30,
      content: selectedType === 'text' ? 'Nouveau texte' : '',
      color: selectedColor,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Utilisateur actuel' // Ici on récupérerait l'utilisateur connecté
    }

    setAnnotations(prev => [...prev, annotation])
    onAnnotationAdd?.(annotation)
  }, [selectedType, selectedColor, onAnnotationAdd])

  // Édition d'une annotation
  const startEditing = useCallback((annotation: Annotation) => {
    setIsEditing(annotation.id)
    setEditingContent(annotation.content || '')
  }, [])

  const saveEditing = useCallback(() => {
    if (!isEditing) return

    const updatedAnnotation = annotations.find(a => a.id === isEditing)
    if (updatedAnnotation) {
      const updated = {
        ...updatedAnnotation,
        content: editingContent,
        updatedAt: new Date()
      }
      
      setAnnotations(prev => prev.map(a => a.id === isEditing ? updated : a))
      onAnnotationUpdate?.(updated)
    }

    setIsEditing(null)
    setEditingContent('')
  }, [isEditing, editingContent, annotations, onAnnotationUpdate])

  const cancelEditing = useCallback(() => {
    setIsEditing(null)
    setEditingContent('')
  }, [])

  // Suppression d'une annotation
  const deleteAnnotation = useCallback((annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId))
    onAnnotationDelete?.(annotationId)
  }, [onAnnotationDelete])

  // Rendu d'une annotation
  const renderAnnotation = (annotation: Annotation) => {
    const isEditingThis = isEditing === annotation.id

    return (
      <div
        key={annotation.id}
        className="absolute group"
        style={{
          left: annotation.x,
          top: annotation.y,
          width: annotation.width,
          height: annotation.height,
          zIndex: 10
        }}
      >
        {annotation.type === 'text' && (
          <div
            className={cn(
              "bg-white border-2 rounded p-2 shadow-lg min-h-[30px] min-w-[100px]",
              `border-${selectedColor.replace('#', '')}`,
              isEditingThis && "ring-2 ring-primary"
            )}
          >
            {isEditingThis ? (
              <div className="space-y-2">
                <Textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="min-h-[60px] resize-none"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={saveEditing}>
                    <Save className="h-3 w-3 mr-1" />
                    Sauver
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    <X className="h-3 w-3 mr-1" />
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer"
                onClick={() => startEditing(annotation)}
              >
                {annotation.content || 'Cliquez pour éditer'}
              </div>
            )}
          </div>
        )}

        {annotation.type === 'pin' && (
          <div
            className="cursor-pointer"
            onClick={() => startEditing(annotation)}
          >
            <Pin className="h-6 w-6" style={{ color: annotation.color }} />
          </div>
        )}

        {['highlight', 'arrow', 'circle', 'square'].includes(annotation.type) && (
          <div
            className="absolute inset-0 cursor-pointer"
            style={{
              backgroundColor: annotation.type === 'highlight' ? `${annotation.color}40` : 'transparent',
              border: annotation.type !== 'highlight' ? `2px solid ${annotation.color}` : 'none',
              borderRadius: annotation.type === 'circle' ? '50%' : annotation.type === 'square' ? '0' : '4px'
            }}
            onClick={() => startEditing(annotation)}
          />
        )}

        {/* Actions sur l'annotation */}
        <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1 bg-background rounded shadow-lg border p-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEditing(annotation)}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteAnnotation(annotation.id)}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!isVisible) return null

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Zone de dessin */}
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDrawing(false)}
      >
        {/* Annotations existantes */}
        {annotations.map(renderAnnotation)}

        {/* Aperçu du dessin en cours */}
        {isDrawing && selectedType !== 'text' && selectedType !== 'pin' && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: Math.min(startPos.x, currentPos.x),
              top: Math.min(startPos.y, currentPos.y),
              width: Math.abs(currentPos.x - startPos.x),
              height: Math.abs(currentPos.y - startPos.y),
              backgroundColor: selectedType === 'highlight' ? `${selectedColor}40` : 'transparent',
              border: selectedType !== 'highlight' ? `2px dashed ${selectedColor}` : 'none',
              borderRadius: selectedType === 'circle' ? '50%' : selectedType === 'square' ? '0' : '4px'
            }}
          />
        )}
      </div>

      {/* Palette d'outils */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <Card className="w-64">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Annotations
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Types d'annotations */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Type d'annotation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ANNOTATION_TYPES.map(({ type, icon: Icon, label, color }) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type as Annotation['type'])}
                    className="h-8 text-xs"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Couleurs */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Couleur
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded border-2 transition-all",
                      selectedColor === color ? "border-foreground scale-110" : "border-border"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Liste des annotations */}
            {annotations.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Annotations ({annotations.length})
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: annotation.color }}
                        />
                        <span className="truncate">
                          {annotation.content || `${annotation.type} annotation`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAnnotation(annotation.id)}
                        className="h-4 w-4 p-0 text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
