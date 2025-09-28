import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModalBackdropProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function ModalBackdrop({ 
  children, 
  className,
  onClick 
}: ModalBackdropProps) {
  return (
    <div 
      className={cn(
        "fixed inset-0 bg-primary/50 backdrop-blur-sm flex items-center justify-center z-[9999] h-screen",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
