'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingState } from '@/components/ui/loading-states'
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

// Types interfaces (groupés pour compacité)
interface OperationData {
  id: string
  nom: string
  description?: string
}

interface PieceJustificative {
  id: string
  nom: string
  obligatoire: boolean
  ordre: number
}

interface ValidationData {
  type_operation_id: string
  nature_operation_id: string
  pieces_justificatives: Record<string, { present: boolean; commentaire?: string }>
  commentaire?: string
}

interface OperationTypeValidationFormProps {
  dossierId: string
  dossierNumero: string
  onValidationComplete: (success: boolean) => void
  onCancel: () => void
  mode?: 'validation' | 'consultation'
}

// Hook utilitaire pour les données d'opération
const useOperationData = () => {
  const [types, setTypes] = useState<OperationData[]>([])
  const [natures, setNatures] = useState<OperationData[]>([])
  const [pieces, setPieces] = useState<PieceJustificative[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTypes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/types-operations')
      if (!response.ok) throw new Error('Erreur lors du chargement des types')
      const data = await response.json()
      setTypes(data.types || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(message.includes('fetch') ? 'Connexion impossible' : message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadNatures = useCallback(async (typeId: string) => {
    try {
      const response = await fetch(`/api/natures-operations?type_id=${typeId}`)
      if (!response.ok) throw new Error('Erreur natures')
      const data = await response.json()
      setNatures(data.natures || [])
    } catch (error) {
      toast.error('Erreur chargement natures')
    }
  }, [])

  const loadPieces = useCallback(async (natureId: string) => {
    try {
      const response = await fetch(`/api/pieces-justificatives?nature_id=${natureId}`)
      if (!response.ok) throw new Error('Erreur pièces')
      const data = await response.json()
      setPieces(data.pieces || [])
    } catch (error) {
      toast.error('Erreur chargement pièces')
    }
  }, [])

  return { types, natures, pieces, loading, error, setError, loadTypes, loadNatures, loadPieces }
}

// Composant pour les sélections de type et nature
const OperationTypeSelector = ({
  types,
  selectedTypeId,
  onTypeChange,
  disabled
}: {
  types: OperationData[]
  selectedTypeId: string
  onTypeChange: (id: string) => void
  disabled: boolean
}) => (
  <div className="space-y-1">
    <Label className="text-xs font-medium">
      Type d'Opération <span className="text-red-500">*</span>
    </Label>
    <Select value={selectedTypeId} onValueChange={onTypeChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={types.length === 0 ? "Aucun type disponible" : "Sélectionner un type"}
        />
      </SelectTrigger>
      <SelectContent className="z-[10100]">
        {types.map(type => (
          <SelectItem key={type.id} value={type.id}>
            {type.nom}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

// Composant pour les pièces justificatives
const PiecesJustificativesSection = ({
  pieces,
  validationData,
  onPieceToggle,
  onPieceComment,
  disabled
}: {
  pieces: PieceJustificative[]
  validationData: ValidationData
  onPieceToggle: (id: string, present: boolean) => void
  onPieceComment: (id: string, commentaire: string) => void
  disabled: boolean
}) => {
  const piecesPresentes = pieces.filter(p => validationData.pieces_justificatives[p.id]?.present)
  const piecesObligatoires = pieces.filter(p => p.obligatoire)

  if (pieces.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Pièces Justificatives</Label>
        <span className="text-xs text-gray-500">
          {piecesPresentes.length} / {pieces.length}
        </span>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {pieces.sort((a, b) => a.ordre - b.ordre).map(piece => (
          <div
            key={piece.id}
            className="flex items-start space-x-2 p-2 border rounded text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              id={`piece-${piece.id}`}
              checked={validationData.pieces_justificatives[piece.id]?.present || false}
              onCheckedChange={checked => onPieceToggle(piece.id, checked as boolean)}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Label htmlFor={`piece-${piece.id}`} className="text-xs font-medium cursor-pointer select-none">
                  {piece.nom}
                </Label>
                {piece.obligatoire && (
                  <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">
                    Obligatoire
                  </span>
                )}
              </div>
              {validationData.pieces_justificatives[piece.id]?.present && (
                <Textarea
                  placeholder="Commentaire..."
                  value={validationData.pieces_justificatives[piece.id]?.commentaire || ''}
                  onChange={e => onPieceComment(piece.id, e.target.value)}
                  className="mt-1 text-xs h-8"
                  rows={1}
                  disabled={disabled}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {piecesObligatoires.length > 0 && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              {piecesObligatoires.length} pièce(s) obligatoire(s)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export function OperationTypeValidationForm({
  dossierId,
  dossierNumero,
  onValidationComplete,
  onCancel,
  mode = 'validation'
}: OperationTypeValidationFormProps) {
  const { types, natures, pieces, loading, error, setError, loadTypes, loadNatures, loadPieces } = useOperationData()
  const [saving, setSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const [validationData, setValidationData] = useState<ValidationData>({
    type_operation_id: '',
    nature_operation_id: '',
    pieces_justificatives: {},
    commentaire: ''
  })

  // Effets simplifiés
  React.useEffect(() => { loadTypes() }, [loadTypes])

  React.useEffect(() => {
    if (validationData.type_operation_id) {
      loadNatures(validationData.type_operation_id)
      setValidationData(prev => ({ ...prev, nature_operation_id: '', pieces_justificatives: {} }))
    }
  }, [validationData.type_operation_id, loadNatures])

  React.useEffect(() => {
    if (validationData.nature_operation_id) {
      loadPieces(validationData.nature_operation_id)
      setValidationData(prev => ({ ...prev, pieces_justificatives: {} }))
    }
  }, [validationData.nature_operation_id, loadPieces])

  // Gestionnaires d'événements (fonctions compactes)
  const handleTypeChange = useCallback((typeId: string) => {
    setValidationData(prev => ({ ...prev, type_operation_id: typeId }))
  }, [])

  const handleNatureChange = useCallback((natureId: string) => {
    setValidationData(prev => ({ ...prev, nature_operation_id: natureId }))
  }, [])

  const handlePieceToggle = useCallback((pieceId: string, present: boolean) => {
      setValidationData(prev => ({
        ...prev,
      pieces_justificatives: { ...prev.pieces_justificatives, [pieceId]: { ...prev.pieces_justificatives[pieceId], present } }
    }))
  }, [])

  const handlePieceComment = useCallback((pieceId: string, commentaire: string) => {
      setValidationData(prev => ({
        ...prev,
      pieces_justificatives: { ...prev.pieces_justificatives, [pieceId]: { ...prev.pieces_justificatives[pieceId], commentaire } }
    }))
  }, [])

  const handleCommentChange = useCallback((commentaire: string) => {
    setValidationData(prev => ({ ...prev, commentaire }))
  }, [])

  // Validation et soumission
  const validateForm = useCallback((): string[] => {
    const errors: string[] = []
    if (!validationData.type_operation_id) errors.push('Type d\'opération requis')
    if (!validationData.nature_operation_id) errors.push('Nature d\'opération requise')

    const piecesObligatoires = pieces.filter(p => p.obligatoire)
    const piecesManquantes = piecesObligatoires.filter(p => !validationData.pieces_justificatives[p.id]?.present)
    
    if (piecesManquantes.length > 0) {
      errors.push(`${piecesManquantes.length} pièce(s) obligatoire(s) manquante(s)`)
    }
    
    return errors
  }, [validationData, pieces])

  const getUserData = useCallback((): { id: string; role: string } => {
    try {
      const storedData = JSON.parse(localStorage.getItem('user') || '{}')
      return storedData.id ? storedData : {
        id: 'e4a8c25e-5239-4134-8aa9-2d49d87a16d9',
        role: 'CONTROLEUR_BUDGETAIRE'
      }
    } catch {
      return { id: 'e4a8c25e-5239-4134-8aa9-2d49d87a16d9', role: 'CONTROLEUR_BUDGETAIRE' }
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    console.log('🔵 handleSubmit appelé')
    const errors = validateForm()
    console.log('🔵 Erreurs de validation:', errors)
    if (errors.length > 0) {
      toast.error(errors.join(', '))
      return
    }
    console.log('🔵 Ouverture de la dialog de confirmation')
    setShowConfirmDialog(true)
  }, [validateForm])

  const confirmValidation = useCallback(async () => {
    console.log('🟢 confirmValidation appelé')
    try {
      setSaving(true)
      const userData = getUserData()
      console.log('🟢 Données utilisateur:', userData)
      console.log('🟢 Données de validation:', validationData)

      const response = await fetch(`/api/dossiers/${dossierId}/validate-operation-type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userData.id,
          'x-user-role': userData.role
        },
        body: JSON.stringify(validationData)
      })

      console.log('🟢 Réponse API:', response.status, response.ok)

      if (!response.ok) {
        const error = await response.json()
        console.error('🔴 Erreur API:', error)
        throw new Error(error.error || error.message || 'Erreur validation')
      }

      console.log('✅ Validation réussie')
      toast.success('Type d\'opération validé')
      onValidationComplete(true)
    } catch (error) {
      console.error('🔴 Erreur dans confirmValidation:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur validation')
    } finally {
      setSaving(false)
      setShowConfirmDialog(false)
    }
  }, [dossierId, validationData, onValidationComplete, getUserData])

  // États dérivés
  const selectedType = types.find(t => t.id === validationData.type_operation_id)
  const selectedNature = natures.find(n => n.id === validationData.nature_operation_id)
  const piecesPresentes = pieces.filter(p => validationData.pieces_justificatives[p.id]?.present)
  const isFormValid = validationData.type_operation_id && validationData.nature_operation_id

  // Composants d'interface utilisateur
  const LoadingStateComponent = () => (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <LoadingState isLoading={true} message="Chargement..." />
          </div>
        </CardContent>
      </Card>
    )

  const ErrorState = () => (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erreur</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-700 bg-red-50 p-3 rounded border">{error}</p>
          <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>Fermer</Button>
          <Button onClick={() => { setError(null); loadTypes() }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )

  const ConfirmationDialog = () => (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
      onClick={() => setShowConfirmDialog(false)}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Confirmer la Validation</h3>
          </div>
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir valider ce type d'opération ?
          </p>
          <div className="space-y-2 p-3 bg-gray-50 rounded">
            <div className="text-sm"><span className="font-medium">Type:</span> {selectedType?.nom}</div>
            <div className="text-sm"><span className="font-medium">Nature:</span> {selectedNature?.nom}</div>
            <div className="text-sm"><span className="font-medium">Pièces:</span> {piecesPresentes.length} / {pieces.length}</div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirmDialog(false)
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                confirmValidation()
              }}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 mr-2">
                    <LoadingState isLoading={true} size="sm" showText={false} />
                  </div>
                  Validation...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // Rendu conditionnel
  if (loading) return <LoadingStateComponent />
  if (error) return <ErrorState />

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <FileText className="h-4 w-4" />
            <span>
              {mode === 'consultation' ? 'Consultation du Type d\'Opération' : 'Validation du Type d\'Opération'}
            </span>
          </CardTitle>
          <div className="text-xs text-gray-600">
            Dossier: <span className="font-medium">{dossierNumero}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sélection du type d'opération */}
          <OperationTypeSelector
            types={types}
            selectedTypeId={validationData.type_operation_id}
            onTypeChange={handleTypeChange}
            disabled={mode === 'consultation'}
          />

          {/* Sélection de la nature d'opération */}
          {validationData.type_operation_id && (
            <div className="space-y-1">
              <Label className="text-xs font-medium">
                Nature d'Opération <span className="text-red-500">*</span>
              </Label>
              <Select
                value={validationData.nature_operation_id}
                onValueChange={handleNatureChange}
                disabled={mode === 'consultation'}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une nature" />
                </SelectTrigger>
                <SelectContent className="z-[10100]">
                  {natures.map(nature => (
                    <SelectItem key={nature.id} value={nature.id}>
                      {nature.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pièces justificatives */}
          <PiecesJustificativesSection
            pieces={pieces}
            validationData={validationData}
            onPieceToggle={handlePieceToggle}
            onPieceComment={handlePieceComment}
                          disabled={mode === 'consultation'}
                        />

          {/* Commentaire général */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Commentaire (Optionnel)</Label>
            <Textarea
              placeholder="Ajouter un commentaire..."
              value={validationData.commentaire || ''}
              onChange={e => handleCommentChange(e.target.value)}
              rows={2}
              className="text-xs"
              disabled={mode === 'consultation'}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button variant="outline" onClick={onCancel}>
              {mode === 'consultation' ? 'Fermer' : 'Annuler'}
            </Button>
            {mode === 'validation' && (
              <Button
                onClick={(e) => {
                  console.log('🔵 Clic sur le bouton Valider')
                  e.stopPropagation()
                  handleSubmit()
                }}
                disabled={saving || !isFormValid}
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 mr-2">
                      <LoadingState isLoading={true} size="sm" showText={false} />
                    </div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      {showConfirmDialog && <ConfirmationDialog />}
    </>
  )
}
