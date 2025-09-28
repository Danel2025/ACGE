'use client'

import { useState, useCallback } from 'react'
import { useForm, FieldValues } from 'react-hook-form'

interface UseMultiStepFormProps<T extends FieldValues> {
  defaultValues: T
  totalSteps: number
  onSubmit: (data: T) => void | Promise<void>
  onCancel?: () => void
}

export function useMultiStepForm<T extends FieldValues>({
  defaultValues,
  totalSteps,
  onSubmit,
  onCancel
}: UseMultiStepFormProps<T>) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<T>({
    defaultValues
  })

  const { watch, trigger, formState: { errors } } = form
  const watchedValues = watch()

  const validateStep = useCallback(async (step: number, fieldsToValidate: (keyof T)[]) => {
    const isValid = await trigger(fieldsToValidate)
    return isValid
  }, [trigger])

  const handleNext = useCallback(async (fieldsToValidate: (keyof T)[]) => {
    const isValid = await validateStep(currentStep, fieldsToValidate)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }, [currentStep, totalSteps, validateStep])

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }, [])

  const handleSubmit = useCallback(async (fieldsToValidate: (keyof T)[]) => {
    const isValid = await validateStep(currentStep, fieldsToValidate)
    if (isValid) {
      try {
        setIsLoading(true)
        await onSubmit(watchedValues)
      } catch (error) {
        console.error('Erreur lors de la soumission:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [currentStep, validateStep, onSubmit, watchedValues])

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    }
    setCurrentStep(1)
    form.reset()
  }, [onCancel, form])

  return {
    form,
    currentStep,
    totalSteps,
    isLoading,
    errors,
    watchedValues,
    handleNext,
    handlePrevious,
    handleSubmit,
    handleCancel,
    setCurrentStep
  }
}
