'use client'

import React, { useState, cloneElement, ReactElement, forwardRef, useImperativeHandle } from 'react'
import { ModernUploadModal } from './modern-upload-modal'

interface UploadWithTriggerProps {
  trigger: ReactElement
  folderId?: string
  onSuccess?: () => void
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
}

export interface UploadWithTriggerRef {
  openModal: () => void
}

export const UploadWithTrigger = forwardRef<UploadWithTriggerRef, UploadWithTriggerProps & React.RefAttributes<UploadWithTriggerRef>>((props, ref) => {
  const {
    trigger,
    folderId,
    onSuccess,
    maxFiles = 10,
    maxSize = 50,
    acceptedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/*',
      'text/*'
    ]
  } = props

  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess()
    }
    setIsOpen(false)
  }

  // Exposer la méthode openModal via useImperativeHandle
  useImperativeHandle(ref, () => ({
    openModal: () => setIsOpen(true)
  }))

  // Cloner le trigger en ajoutant le gestionnaire de clic
  const triggerWithHandler = cloneElement(trigger, {
    onClick: () => setIsOpen(true)
  })

  return (
    <>
      {triggerWithHandler}
      <ModernUploadModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        folderId={folderId}
        onUploadSuccess={handleSuccess}
        maxFiles={maxFiles}
        maxSize={maxSize}
        acceptedTypes={acceptedTypes}
      />
    </>
  )
})