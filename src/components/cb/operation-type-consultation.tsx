'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, CheckCircle, XCircle, FileText, Calendar, User } from 'lucide-react'

interface ValidationData {
  id: string
  dossier_id: string
  type_operation_id: string
  nature_operation_id: string
  pieces_justificatives: Record<string, boolean>
  commentaire: string
  created_at: string
  user_id: string
  type_operation: {
    id: string
    nom: string
    description: string
  }
  nature_operation: {
    id: string
    nom: string
    description: string
  }
  user: {
    id: string
    name: string
    email: string
  }
}

interface OperationTypeConsultationProps {
  dossierId: string
  dossierNumero: string
  onClose: () => void
}

export function OperationTypeConsultation({
  dossierId,
  dossierNumero,
  onClose
}: OperationTypeConsultationProps) {
  const [validationData, setValidationData] = useState<ValidationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadValidationData()
  }, [dossierId])

  const loadValidationData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/dossiers/${dossierId}/validation-operation-type`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du chargement des données de validation')
      }

      const data = await response.json()
      setValidationData(data.validation)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultation - Validation Type d'Opération
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

  if (!validationData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultation - Validation Type d'Opération
          </CardTitle>
          <CardDescription>
            Dossier: <Badge variant="outline">{dossierNumero}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">Aucune validation de type d'opération trouvée pour ce dossier.</p>
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Validation Type d'Opération
        </CardTitle>
        <CardDescription>
          Dossier: <Badge variant="outline">{dossierNumero}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-title-medium text-sm text-gray-600">Type d'Opération</h4>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">{validationData.type_operation.nom}</p>
              <p className="text-sm text-gray-600">{validationData.type_operation.description}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-title-medium text-sm text-gray-600">Nature d'Opération</h4>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">{validationData.nature_operation.nom}</p>
              <p className="text-sm text-gray-600">{validationData.nature_operation.description}</p>
            </div>
          </div>
        </div>

        {/* Pièces justificatives */}
        <div className="space-y-2">
          <h4 className="font-title-medium text-sm text-gray-600">Pièces Justificatives</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(validationData.pieces_justificatives).map(([piece, present]) => (
              <div key={piece} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                {present ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={present ? 'text-green-800' : 'text-red-800'}>
                  {piece}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Commentaire */}
        {validationData.commentaire && (
          <div className="space-y-2">
            <h4 className="font-title-medium text-sm text-gray-600">Commentaire</h4>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm">{validationData.commentaire}</p>
            </div>
          </div>
        )}

        {/* Informations de validation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <h4 className="font-title-medium text-sm text-gray-600">Validé par</h4>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{validationData.user.name}</span>
            </div>
            <p className="text-xs text-gray-500">{validationData.user.email}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-title-medium text-sm text-gray-600">Date de validation</h4>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {new Date(validationData.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
