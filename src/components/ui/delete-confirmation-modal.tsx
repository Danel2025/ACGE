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
import { ButtonLoading } from '@/components/ui/loading-states'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName?: string
  itemType?: string
  isLoading?: boolean
  variant?: 'default' | 'destructive'
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType = 'élément',
  isLoading = false,
  variant = 'destructive'
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              variant === 'destructive' 
                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-title-semibold">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {itemName && (
          <div className="bg-muted/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {itemType} à supprimer :
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              {itemName}
            </p>
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Attention
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Cette action est irréversible. Le {itemType} sera définitivement supprimé.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Annuler
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            {isLoading ? (
              <ButtonLoading
                isLoading={true}
                loadingText="Suppression..."
                variant="delete"
                size="sm"
                color="white"
              >
                Suppression...
              </ButtonLoading>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
