'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ModalWrapper } from './modal-wrapper'
import { ReactNode } from 'react'

interface AutoModalProps {
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  className?: string
}

/**
 * Composant Dialog qui masque automatiquement le header quand ouvert
 */
export function AutoModal({ 
  children, 
  open, 
  onOpenChange, 
  title, 
  description, 
  className 
}: AutoModalProps) {
  return (
    <ModalWrapper isOpen={open} onOpenChange={onOpenChange}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={className} showCloseButton={false}>
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}
          {children}
        </DialogContent>
      </Dialog>
    </ModalWrapper>
  )
}
