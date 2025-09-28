'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryItem {
  label: string
  value: string | React.ReactNode
}

interface SummarySection {
  title: string
  items: SummaryItem[]
}

interface FormSummaryProps {
  title: string
  description: string
  sections: SummarySection[]
  className?: string
}

export function FormSummary({
  title,
  description,
  sections,
  className
}: FormSummaryProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-title-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardContent className="p-3">
              <h4 className="font-title-medium mb-2">{section.title}</h4>
              <div className="space-y-1 text-sm">
                {section.items.map((item, itemIndex) => (
                  <p key={itemIndex}>
                    <span className="text-muted-foreground">{item.label}:</span> {item.value}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
