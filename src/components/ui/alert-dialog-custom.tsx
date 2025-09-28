"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ModalBackdrop } from "@/components/ui/modal-backdrop"
import { cn } from "@/lib/utils"
import { AlertTriangle, X } from "lucide-react"
import { LoadingState } from "@/components/ui/loading-states"

interface AlertDialogCustomProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: React.ReactNode
}

interface AlertDialogCustomContentProps {
  className?: string
  children: React.ReactNode
}

interface AlertDialogCustomHeaderProps {
  className?: string
  children: React.ReactNode
}

interface AlertDialogCustomFooterProps {
  className?: string
  children: React.ReactNode
}

interface AlertDialogCustomTitleProps {
  className?: string
  children: React.ReactNode
}

interface AlertDialogCustomDescriptionProps {
  className?: string
  children: React.ReactNode
}

interface AlertDialogCustomActionProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  loadingText?: string
}

interface AlertDialogCustomCancelProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

const AlertDialogCustom = ({ open, onOpenChange, title, description, children }: AlertDialogCustomProps) => {
  if (!open) return null

  return (
    <ModalBackdrop onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-lg bg-background rounded-lg shadow-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-title-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </ModalBackdrop>
  )
}

const AlertDialogCustomContent = ({ className, children }: AlertDialogCustomContentProps) => {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  )
}

const AlertDialogCustomHeader = ({ className, children }: AlertDialogCustomHeaderProps) => {
  return (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>
      {children}
    </div>
  )
}

const AlertDialogCustomFooter = ({ className, children }: AlertDialogCustomFooterProps) => {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
      {children}
    </div>
  )
}

const AlertDialogCustomTitle = ({ className, children }: AlertDialogCustomTitleProps) => {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  )
}

const AlertDialogCustomDescription = ({ className, children }: AlertDialogCustomDescriptionProps) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}

const AlertDialogCustomAction = ({ 
  className, 
  children, 
  onClick, 
  disabled, 
  loading = false, 
  loadingText 
}: AlertDialogCustomActionProps) => {
  return (
    <Button
      className={cn("", className)}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <LoadingState
          isLoading={true}
          message={loadingText || children}
          variant="spinner"
          size="sm"
          showText={true}
        />
      ) : (
        children
      )}
    </Button>
  )
}

const AlertDialogCustomCancel = ({ className, children, onClick, disabled }: AlertDialogCustomCancelProps) => {
  return (
    <Button
      variant="outline"
      className={cn("mt-2 sm:mt-0", className)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}

export {
  AlertDialogCustom,
  AlertDialogCustomContent,
  AlertDialogCustomHeader,
  AlertDialogCustomFooter,
  AlertDialogCustomTitle,
  AlertDialogCustomDescription,
  AlertDialogCustomAction,
  AlertDialogCustomCancel,
}
