'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
// import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react'

interface DossierComptable {
  id: string
  numeroDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire: string
  statut: 'EN_ATTENTE' | 'VALIDÉ_CB' | 'REJETÉ_CB' | 'VALIDÉ_ORDONNATEUR' | 'PAYÉ' | 'TERMINÉ'
  dateDepot: string
  folderId?: string
  foldername?: string
  poste_comptable: {
    id: string
    numero: string
    intitule: string
  }
  nature_document: {
    id: string
    numero: string
    nom: string
  }
  secretaire: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  // Colonnes de rejet
  rejectedAt?: string
  rejectionReason?: string
  rejectionDetails?: string
}

interface CBStatusNavigationProps {
  dossiers: DossierComptable[]
  currentFilter: 'all' | 'en_attente' | 'valide' | 'rejete'
  onFilterChange: (filter: 'all' | 'en_attente' | 'valide' | 'rejete') => void
}

export function CBStatusNavigation({ 
  dossiers, 
  currentFilter, 
  onFilterChange 
}: CBStatusNavigationProps) {
  // Fonction pour compter les dossiers par statut
  const getStatusFilterCount = (dossiers: DossierComptable[], filter: string) => {
    switch (filter) {
      case 'all':
        return dossiers.length
      case 'en_attente':
        return dossiers.filter(d => d.statut === 'EN_ATTENTE').length
      case 'valide':
        return dossiers.filter(d => d.statut === 'VALIDÉ_CB').length
      case 'rejete':
        return dossiers.filter(d => d.statut === 'REJETÉ_CB').length
      default:
        return 0
    }
  }

  const filters = [
    {
      key: 'all' as const,
      label: 'Tous les dossiers',
      icon: FileText,
      count: getStatusFilterCount(dossiers, 'all')
    },
    {
      key: 'en_attente' as const,
      label: 'En attente',
      icon: Clock,
      count: getStatusFilterCount(dossiers, 'en_attente')
    },
    {
      key: 'valide' as const,
      label: 'Validés',
      icon: CheckCircle,
      count: getStatusFilterCount(dossiers, 'valide')
    },
    {
      key: 'rejete' as const,
      label: 'Rejetés',
      icon: XCircle,
      count: getStatusFilterCount(dossiers, 'rejete')
    }
  ]

  return (
    <div className="bg-card border rounded-lg p-3">
      <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const IconComponent = filter.icon
            return (
              <Button
                key={filter.key}
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
            )
          })}
        </div>
    </div>
  )
}
