'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, FileText, Award } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DossierComptable {
  id: string
  numeroDossier: string
  statut: 'EN_ATTENTE' | 'VALIDÉ_CB' | 'REJETÉ_CB' | 'VALIDÉ_ORDONNATEUR' | 'VALIDÉ_DÉFINITIVEMENT' | 'TERMINÉ'
  // ... autres propriétés du dossier
}

interface ACStatusNavigationProps {
  dossiers: DossierComptable[]
  currentFilter: 'all' | 'en_attente' | 'valides_definitivement' | 'termines'
  onFilterChange: (filter: 'all' | 'en_attente' | 'valides_definitivement' | 'termines') => void
}

export function ACStatusNavigation({ 
  dossiers, 
  currentFilter, 
  onFilterChange 
}: ACStatusNavigationProps) {

  const getStatusFilterCount = (dossiers: DossierComptable[], filter: string) => {
    switch (filter) {
      case 'all':
        return dossiers.length
      case 'en_attente':
        return dossiers.filter(d => d.statut === 'VALIDÉ_ORDONNATEUR').length
      case 'valides_definitivement':
        return dossiers.filter(d => d.statut === 'VALIDÉ_DÉFINITIVEMENT').length
      case 'termines':
        return dossiers.filter(d => d.statut === 'TERMINÉ').length
      default:
        return 0
    }
  }

  const filters = [
    {
      key: 'all' as const,
      label: 'Tous les dossiers',
      icon: FileText,
      count: getStatusFilterCount(dossiers, 'all'),
      description: 'Afficher tous les dossiers disponibles'
    },
    {
      key: 'en_attente' as const,
      label: 'En attente',
      icon: Clock,
      count: getStatusFilterCount(dossiers, 'en_attente'),
      description: 'Dossiers validés par l\'Ordonnateur, en attente de validation définitive'
    },
    {
      key: 'valides_definitivement' as const,
      label: 'Validés définitivement',
      icon: Award,
      count: getStatusFilterCount(dossiers, 'valides_definitivement'),
      description: 'Dossiers validés définitivement par l\'AC'
    },
    {
      key: 'termines' as const,
      label: 'Terminés',
      icon: CheckCircle,
      count: getStatusFilterCount(dossiers, 'termines'),
      description: 'Dossiers clôturés et terminés'
    }
  ]

  return (
    <TooltipProvider>
      <div className="bg-card border rounded-lg p-3">
        <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const IconComponent = filter.icon
              return (
                <Tooltip key={filter.key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentFilter === filter.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onFilterChange(filter.key)}
                      className="flex items-center gap-1.5 h-8 px-3"
                    >
                      <IconComponent className="h-4 w-4" />
                      {filter.label}
                      <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                        currentFilter === filter.key 
                          ? 'bg-white/20 text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {filter.count}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{filter.description}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
      </div>
    </TooltipProvider>
  )
}
