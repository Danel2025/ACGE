'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from '@/components/ui/loading-states'
import { CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Gavel,
  Calculator,
  ClipboardCheck,
  Loader2,
  Save,
  Eye,
  ChevronDown,
  ChevronUp
 } from 'lucide-react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'

// Types
interface VerificationOrdonnateur {
  id: string
  nom: string
  description: string
  question: string
  aide?: string
  obligatoire: boolean
  ordre: number
}

interface CategorieVerification {
  id: string
  nom: string
  description: string
  icone: string
  couleur: string
  ordre: number
  verifications: VerificationOrdonnateur[]
}

interface ValidationVerification {
  verification_id: string
  valide: boolean
  commentaire?: string
  piece_justificative_reference?: string
}

interface VerificationsOrdonnateurFormProps {
  dossierId: string
  dossierNumero: string
  onValidationComplete: (success: boolean) => void
  onCancel: () => void
  mode?: 'validation' | 'consultation'
}

// Configuration des icônes par nom
const iconMap: Record<string, React.ComponentType<any>> = {
  'gavel': Gavel,
  'check-circle': CheckCircle2,
  'calculator': Calculator,
  'clipboard-check': ClipboardCheck,
  'file-text': FileText
}

// Configuration des couleurs pour la bordure gauche
const colorMap: Record<string, string> = {
  'blue': 'border-l-blue-500',
  'green': 'border-l-green-500',
  'orange': 'border-l-orange-500',
  'purple': 'border-l-purple-500',
  'red': 'border-l-red-500'
}

export function VerificationsOrdonnateurForm({
  dossierId,
  dossierNumero,
  onValidationComplete,
  onCancel,
  mode = 'validation'
}: VerificationsOrdonnateurFormProps) {
  const { user } = useSupabaseAuth()
  const [categories, setCategories] = useState<CategorieVerification[]>([])
  const [validations, setValidations] = useState<Record<string, ValidationVerification>>({})
  const [commentaireGeneral, setCommentaireGeneral] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [validationsExistantes, setValidationsExistantes] = useState<any[]>([])

  // Charger les vérifications ordonnateur
  useEffect(() => {
    loadVerifications()
    if (mode === 'consultation') {
      loadValidationsExistantes()
    }
  }, [dossierId, mode])

  const loadVerifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/verifications-ordonnateur', {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du chargement des vérifications')
      }

      const data = await response.json()
      
      if (data.success && data.categories) {
        setCategories(data.categories)
        
        // Initialiser les validations avec des valeurs par défaut
        const initialValidations: Record<string, ValidationVerification> = {}
        data.categories.forEach((categorie: CategorieVerification) => {
          categorie.verifications.forEach((verification: VerificationOrdonnateur) => {
            initialValidations[verification.id] = {
              verification_id: verification.id,
              valide: false,
              commentaire: '',
              piece_justificative_reference: ''
            }
          })
        })
        setValidations(initialValidations)

        // Ouvrir toutes les catégories par défaut
        const expanded: Record<string, boolean> = {}
        data.categories.forEach((cat: CategorieVerification) => {
          expanded[cat.id] = true
        })
        setExpandedCategories(expanded)
      } else {
        throw new Error('Format de réponse invalide')
      }
    } catch (err) {
      console.error('Erreur chargement vérifications:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const loadValidationsExistantes = async () => {
    try {
      const response = await fetch(`/api/dossiers/${dossierId}/verifications-ordonnateur`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.validations) {
          setValidationsExistantes(data.validations)
          
          // Pré-remplir les validations existantes
          const validationsExistantesMap: Record<string, ValidationVerification> = {}
          data.validations.forEach((validation: any) => {
            validationsExistantesMap[validation.verification_id] = {
              verification_id: validation.verification_id,
              valide: validation.valide,
              commentaire: validation.commentaire || '',
              piece_justificative_reference: validation.piece_justificative_reference || ''
            }
          })
          setValidations(validationsExistantesMap)
          
          if (data.synthese?.commentaire_general) {
            setCommentaireGeneral(data.synthese.commentaire_general)
          }
        }
      }
    } catch (err) {
      console.warn('Erreur chargement validations existantes:', err)
    }
  }

  const handleValidationChange = (verificationId: string, field: keyof ValidationVerification, value: any) => {
    setValidations(prev => ({
      ...prev,
      [verificationId]: {
        ...prev[verificationId],
        [field]: value
      }
    }))
  }

  const toggleCategorie = (categorieId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categorieId]: !prev[categorieId]
    }))
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('Utilisateur non identifié')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Préparer les données de validation
      const validationsArray = Object.values(validations)
      
      // Vérifier que toutes les vérifications obligatoires ont été traitées
      const verificationsObligatoires = categories.flatMap(cat => 
        cat.verifications.filter(v => v.obligatoire)
      )
      
      const verificationsManquantes = verificationsObligatoires.filter(verif => 
        !validations[verif.id] || validations[verif.id].valide === undefined
      )
      
      if (verificationsManquantes.length > 0) {
        setError(`Vérifications obligatoires manquantes : ${verificationsManquantes.map(v => v.nom).join(', ')}`)
        return
      }

      const response = await fetch(`/api/dossiers/${dossierId}/verifications-ordonnateur`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          validations: validationsArray,
          commentaire_general: commentaireGeneral.trim() || null,
          userId: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'enregistrement')
      }

      const data = await response.json()
      
      if (data.success) {
        onValidationComplete(true)
      } else {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }

    } catch (err) {
      console.error('Erreur soumission vérifications:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName] || FileText
    return IconComponent
  }

  const getColorClass = (colorName: string) => {
    return colorMap[colorName] || colorMap['blue']
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingState isLoading={true} message="Chargement des vérifications..." />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      {/* Catégories de vérifications */}
      <div className="space-y-2">
        {categories.map((categorie) => {
          const IconComponent = getIconComponent(categorie.icone)
          const isExpanded = expandedCategories[categorie.id]
          
          return (
            <Card key={categorie.id} className="border-2">
              <CardHeader
                className={`cursor-pointer ${getColorClass(categorie.couleur)}`}
                onClick={() => toggleCategorie(categorie.id)}
              >
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <div>
                    <CardTitle className="text-base">{categorie.nom}</CardTitle>
                    <CardDescription className="text-xs opacity-80">
                      {categorie.description}
                    </CardDescription>
                  </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {categorie.verifications.length} vérifications
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {categorie.verifications.map((verification, index) => {
                      const validation = validations[verification.id]
                      const isValid = validation?.valide === true
                      const isRejected = validation?.valide === false
                      
                      return (
                        <div key={verification.id} className="space-y-3">
                          {index > 0 && <Separator />}

                          <div className="space-y-2">
                            {/* Question */}
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5">
                                {verification.obligatoire && (
                                  <span className="text-red-500 text-xs">*</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-title-medium text-gray-900 text-sm">
                                  {verification.question}
                                </h4>
                                {verification.aide && (
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    💡 {verification.aide}
                                  </p>
                                )}
                              </div>
                            </div>

                            {mode === 'validation' ? (
                              <>
                                {/* Boutons de validation */}
                                <div className="flex gap-1">
                                  <Button
                                    variant={isValid ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleValidationChange(verification.id, 'valide', true)}
                                    className={isValid ? "bg-green-600 hover:bg-green-700" : ""}
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Validé
                                  </Button>
                                  <Button
                                    variant={isRejected ? "destructive" : "outline"}
                                    size="sm"
                                    onClick={() => handleValidationChange(verification.id, 'valide', false)}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Rejeté
                                  </Button>
                                </div>

                                {/* Commentaire */}
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-gray-700">
                                    Commentaire {!isValid && <span className="text-red-500">*</span>}
                                  </label>
                                  <Textarea
                                    placeholder={isValid ? "Commentaire optionnel..." : "Motif du rejet (obligatoire)"}
                                    value={validation?.commentaire || ''}
                                    onChange={(e) => handleValidationChange(verification.id, 'commentaire', e.target.value)}
                                    className="min-h-[60px]"
                                    required={!isValid}
                                  />
                                </div>

                                {/* Référence pièce justificative */}
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-gray-700">
                                    Référence pièce justificative
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ex: Facture n°123, Contrat n°456..."
                                    value={validation?.piece_justificative_reference || ''}
                                    onChange={(e) => handleValidationChange(verification.id, 'piece_justificative_reference', e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              </>
                            ) : (
                              /* Mode consultation */
                              <div className="space-y-3 bg-gray-50 p-4 rounded-md">
                                <div className="flex items-center gap-2">
                                  {isValid ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  )}
                                  <span className={`font-medium ${isValid ? 'text-green-700' : 'text-red-700'}`}>
                                    {isValid ? 'Validé' : 'Rejeté'}
                                  </span>
                                </div>
                                
                                {validation?.commentaire && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Commentaire:</span>
                                    <p className="text-sm text-gray-600 mt-1">{validation.commentaire}</p>
                                  </div>
                                )}
                                
                                {validation?.piece_justificative_reference && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Pièce justificative:</span>
                                    <p className="text-sm text-gray-600 mt-1">{validation.piece_justificative_reference}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Commentaire général */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Commentaire général
          </CardTitle>
          <CardDescription>
            Observations générales sur l'ensemble des vérifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'validation' ? (
            <Textarea
              placeholder="Commentaire général sur les vérifications effectuées..."
              value={commentaireGeneral}
              onChange={(e) => setCommentaireGeneral(e.target.value)}
              className="min-h-[100px]"
            />
          ) : (
            <div className="bg-gray-50 p-4 rounded-md">
              {commentaireGeneral ? (
                <p className="text-gray-700">{commentaireGeneral}</p>
              ) : (
                <p className="text-gray-500 italic">Aucun commentaire général</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          {mode === 'consultation' ? 'Fermer' : 'Annuler'}
        </Button>
        
        {mode === 'validation' && (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 mr-2">
                  <LoadingState isLoading={true} size="sm" showText={false} />
                </div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les vérifications
              </>
            )}
          </Button>
        )}
        
        {mode === 'consultation' && (
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Voir les documents
          </Button>
        )}
      </div>
    </div>
  )
}
