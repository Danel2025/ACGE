'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface FormFieldWithIconProps {
  icon: LucideIcon
  placeholder?: string
  className?: string
  type?: 'text' | 'email' | 'password' | 'textarea'
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  rows?: number
}

export function FormFieldWithIcon({
  icon: Icon,
  placeholder,
  className,
  type = 'text',
  value,
  onChange,
  disabled = false,
  rows = 3
}: FormFieldWithIconProps) {
  const inputProps = {
    placeholder,
    className: cn("pl-10", className),
    value,
    onChange: onChange ? (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value) : undefined,
    disabled
  }

  if (type === 'textarea') {
    return (
      <div className="relative">
        <Icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Textarea
          {...inputProps}
          rows={rows}
          className={cn("pl-10", className)}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        {...inputProps}
        type={type}
      />
    </div>
  )
}
