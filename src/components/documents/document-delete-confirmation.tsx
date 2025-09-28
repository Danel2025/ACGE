'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertTriangle, FileText, HardDrive, Calendar, User } from 'lucide-react'
import { DocumentItem } from '@/types/document'

interface DocumentDeleteConfirmationProps {
  document: DocumentItem | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (documentId: string) => Promise<void>
  isLoading?: boolean
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function DocumentDeleteConfirmation({
  document,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: DocumentDeleteConfirmationProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const [error, setError] = useState('')
  
  const expectedText = document?.title || 'document'
  const isConfirmationValid = confirmationText === expectedText

  const handleClose = () => {
    setConfirmationText('')
    setError('')
    onClose()
  }

  const handleConfirm = async () => {
    if (!document || !isConfirmationValid) return

    try {
      setError('')
      await onConfirm(document.id)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  if (!document) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Confirmer la suppression
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Cette action est irréversible. Le document et toutes ses versions seront définitivement supprimés.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Informations du document */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-title-medium text-sm truncate" title={document.title}>
                  {document.title}
                </h4>
                {document.description && (
                  <p className="text-xs text-muted-foreground mt-1 overflow-hidden text-ellipsis">
                    {document.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3 w-3" />
                <span>{formatFileSize(document.fileSize)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(document.createdAt)}</span>
              </div>
              {document.author && (
                <div className="flex items-center gap-2 col-span-2">
                  <User className="h-3 w-3" />
                  <span>Par {document.author.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Avertissement */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Attention :</strong> Cette action supprimera définitivement :
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Le document et toutes ses métadonnées</li>
                <li>Toutes les versions du document</li>
                <li>L'historique des modifications</li>
                <li>Les partages et permissions associés</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Confirmation par saisie */}
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Pour confirmer, tapez le nom du document : <strong>"{expectedText}"</strong>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Tapez "${expectedText}"`}
              className={!isConfirmationValid && confirmationText ? 'border-destructive' : ''}
            />
            {!isConfirmationValid && confirmationText && (
              <p className="text-xs text-destructive">
                Le texte saisi ne correspond pas au nom du document
              </p>
            )}
          </div>

          {/* Message d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer définitivement
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
