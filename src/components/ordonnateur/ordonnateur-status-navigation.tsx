'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, FileText, ClipboardCheck } from 'lucide-react'

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

interface OrdonnateurStatusNavigationProps {
  dossiers: DossierComptable[]
  currentFilter: 'all' | 'en_attente' | 'verifications_en_cours' | 'ordonnes' | 'rejetes'
  onFilterChange: (filter: 'all' | 'en_attente' | 'verifications_en_cours' | 'ordonnes' | 'rejetes') => void
}

export function OrdonnateurStatusNavigation({ 
  dossiers, 
  currentFilter, 
  onFilterChange 
}: OrdonnateurStatusNavigationProps) {
  // Fonction pour compter les dossiers par statut
  const getStatusFilterCount = (dossiers: DossierComptable[], filter: string) => {
    switch (filter) {
      case 'all':
        return dossiers.length
      case 'en_attente':
        return dossiers.filter(d => d.statut === 'VALIDÉ_CB').length
      case 'verifications_en_cours':
        // Dossiers validés par CB mais pas encore ordonnés (en cours de vérifications)
        return dossiers.filter(d => d.statut === 'VALIDÉ_CB').length
      case 'ordonnes':
        return dossiers.filter(d => ['VALIDÉ_ORDONNATEUR', 'PAYÉ', 'TERMINÉ'].includes(d.statut)).length
      case 'rejetes':
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
      count: getStatusFilterCount(dossiers, 'en_attente'),
      description: 'Dossiers validés par le CB'
    },
    {
      key: 'verifications_en_cours' as const,
      label: 'Vérifications en cours',
      icon: ClipboardCheck,
      count: getStatusFilterCount(dossiers, 'verifications_en_cours'),
      description: 'En cours de vérifications ordonnateur'
    },
    {
      key: 'ordonnes' as const,
      label: 'Ordonnés',
      icon: CheckCircle,
      count: getStatusFilterCount(dossiers, 'ordonnes'),
      description: 'Dépenses ordonnées'
    },
    {
      key: 'rejetes' as const,
      label: 'Rejetés',
      icon: XCircle,
      count: getStatusFilterCount(dossiers, 'rejetes'),
      description: 'Dossiers rejetés'
    }
  ]

  return (
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
              title={filter.description}
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
  )
}
