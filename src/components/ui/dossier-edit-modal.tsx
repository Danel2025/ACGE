'use client'

import React from 'react'
import { DossierEditForm } from './dossier-edit-form'

interface DossierComptable {
  id: string
  nomDossier?: string
  numeroDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire?: string
  statut: string
  dateDepot?: string
  posteComptableId?: string
  natureDocumentId?: string
  poste_comptable?: {
    id: string
    numero: string
    intitule: string
  }
  nature_document?: {
    id: string
    numero: string
    nom: string
  }
  secretaire?: {
    id: string
    name: string
    email: string
  }
  _count?: { documents: number }
  createdAt: string
  updatedAt: string
}

interface DossierEditModalProps {
  dossier: DossierComptable | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedDossier: DossierComptable) => void
}

export function DossierEditModal({ dossier, isOpen, onClose, onSave }: DossierEditModalProps) {
  return (
    <DossierEditForm
      dossier={dossier}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
    />
  )
}
