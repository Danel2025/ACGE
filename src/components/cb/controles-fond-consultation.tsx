'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, CheckCircle, XCircle, FileText, Calendar, User } from 'lucide-react'

interface ValidationControle {
  id: string
  controle_fond_id: string
  valide: boolean
  commentaire?: string
  controle_fond: {
    id: string
    nom: string
    description: string
    obligatoire: boolean
    categorie: {
      id: string
      nom: string
    }
  }
}

interface ControlesFondConsultationProps {
  dossierId: string
  dossierNumero: string
  onClose: () => void
}

export function ControlesFondConsultation({
  dossierId,
  dossierNumero,
  onClose
}: ControlesFondConsultationProps) {
  const [validations, setValidations] = useState<ValidationControle[]>([])
  const [commentaireGeneral, setCommentaireGeneral] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadValidationData()
  }, [dossierId])

  const loadValidationData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/dossiers/${dossierId}/validation-controles-fond`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du chargement des données de validation')
      }

      const data = await response.json()
      setValidations(data.validations || [])
      setCommentaireGeneral(data.commentaire_general || '')
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // Grouper les validations par catégorie
  const validationsParCategorie = validations.reduce((acc, validation) => {
    const categorie = validation.controle_fond?.categorie?.nom || 'Non catégorisé'
    if (!acc[categorie]) {
      acc[categorie] = []
    }
    acc[categorie].push(validation)
    return acc
  }, {} as Record<string, ValidationControle[]>)

  const totalControles = validations.length
  const controlesValides = validations.filter(v => v.valide).length
  const controlesObligatoires = validations.filter(v => v.controle_fond?.obligatoire)
  const controlesObligatoiresValides = controlesObligatoires.filter(v => v.valide).length

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultation - Contrôles de Fond
          </CardTitle>
          <CardDescription>
            Dossier: <Badge variant="outline">{dossierNumero}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Erreur de Chargement
          </CardTitle>
          <CardDescription>
            Dossier: <Badge variant="outline">{dossierNumero}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button onClick={loadValidationData}>
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (validations.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultation - Contrôles de Fond
          </CardTitle>
          <CardDescription>
            Dossier: <Badge variant="outline">{dossierNumero}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">Aucune validation de contrôles de fond trouvée pour ce dossier.</p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Contrôles de Fond
        </CardTitle>
        <CardDescription>
          Dossier: <Badge variant="outline">{dossierNumero}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Résumé global */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{controlesValides}</div>
            <div className="text-sm text-gray-600">Contrôles validés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{totalControles}</div>
            <div className="text-sm text-gray-600">Total contrôles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{controlesObligatoiresValides}</div>
            <div className="text-sm text-gray-600">Obligatoires validés</div>
          </div>
        </div>

        {/* Contrôles par catégorie */}
        {Object.entries(validationsParCategorie).map(([categorie, controles]) => (
          <div key={categorie} className="space-y-3">
            <h4 className="font-title-medium text-lg text-gray-800 border-b pb-2">
              {categorie}
            </h4>
            
            <div className="space-y-2">
              {controles.map((validation) => (
                <div key={validation.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {validation.valide ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${validation.valide ? 'text-green-800' : 'text-red-800'}`}>
                        {validation.controle_fond?.nom || 'Contrôle inconnu'}
                      </span>
                      {validation.controle_fond?.obligatoire && (
                        <Badge variant="outline" className="text-xs">
                          Obligatoire
                        </Badge>
                      )}
                    </div>

                    {validation.controle_fond?.description && (
                      <p className="text-sm text-gray-600">
                        {validation.controle_fond.description}
                      </p>
                    )}
                    
                    {validation.commentaire && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <strong>Commentaire:</strong> {validation.commentaire}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Commentaire général */}
        {commentaireGeneral && commentaireGeneral.trim() && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-title-medium text-sm text-gray-600">Commentaire Général</h4>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm">{commentaireGeneral}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
