'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormNavigationProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  onCancel: () => void
  isLoading?: boolean
  nextLabel?: string
  submitLabel?: string
  cancelLabel?: string
  className?: string
}

export function FormNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  onCancel,
  isLoading = false,
  nextLabel = "Suivant",
  submitLabel = "Sauvegarder",
  cancelLabel = "Annuler",
  className
}: FormNavigationProps) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  return (
    <div className={cn("flex justify-between pt-6 border-t", className)}>
      <Button
        variant="outline"
        onClick={isFirstStep ? onCancel : onPrevious}
        disabled={isLoading}
      >
        {isFirstStep ? (
          cancelLabel
        ) : (
          <>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </>
        )}
      </Button>

      {!isLastStep ? (
        <Button onClick={onNext} disabled={isLoading}>
          {nextLabel}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      ) : (
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading ? 'Sauvegarde...' : submitLabel}
        </Button>
      )}
    </div>
  )
}
