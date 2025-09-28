'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, User, FileText, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  itemName?: string
  itemType?: string
  details?: {
    recipient?: string
    estimatedTime?: string
    documentsCount?: number
    nextSteps?: string[]
  }
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  description,
  itemName,
  itemType = 'élément',
  details
}: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-full">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-title-semibold text-green-800 dark:text-green-200">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {itemName && (
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {itemType} soumis :
              </span>
            </div>
            <p className="text-sm font-mono text-foreground">
              {itemName}
            </p>
          </div>
        )}

        {details && (
          <div className="space-y-4">
            {/* Informations de traitement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {details.recipient && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                      Destinataire
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {details.recipient}
                    </p>
                  </div>
                </div>
              )}
              
              {details.estimatedTime && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                      Délai estimé
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {details.estimatedTime}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Nombre de documents */}
            {details.documentsCount !== undefined && (
              <div className="flex items-center justify-center">
                <Badge variant="secondary" className="px-3 py-1">
                  <FileText className="h-3 w-3 mr-1" />
                  {details.documentsCount} document{details.documentsCount > 1 ? 's' : ''}
                </Badge>
              </div>
            )}

            {/* Prochaines étapes */}
            {details.nextSteps && details.nextSteps.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="text-sm font-title-medium mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Prochaines étapes
                </h4>
                <ul className="space-y-1">
                  {details.nextSteps.map((step, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Parfait !
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
