import { useEffect, useState, useCallback, useRef } from 'react'
import { useRealtime } from '@/contexts/realtime-context'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'

export interface DossierUpdate {
  id: string
  numeroDossier: string
  statut: string
  oldStatut?: string
  updatedAt: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

/**
 * Hook pour écouter les changements de dossiers en temps réel
 * avec filtrage par rôle
 */
export function useRealtimeDossiers(options?: {
  onNewDossier?: (dossier: any) => void
  onUpdateDossier?: (dossier: any) => void
  onDeleteDossier?: (dossierId: string) => void
  filterByStatus?: string[]
  autoRefresh?: boolean
}) {
  const { subscribeToDossierChanges, isConnected } = useRealtime()
  const { user } = useSupabaseAuth()
  const [updates, setUpdates] = useState<DossierUpdate[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Utiliser useRef pour stocker les options et éviter les re-renders
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const handleDossierChange = useCallback((payload: any) => {
    console.log('📦 Hook: Changement de dossier reçu', payload)

    const { eventType, new: newData, old: oldData } = payload

    // Filtrer par statut si spécifié
    if (optionsRef.current?.filterByStatus && newData?.statut) {
      if (!optionsRef.current.filterByStatus.includes(newData.statut)) {
        console.log('🔍 Hook: Dossier filtré par statut', newData.statut)
        return
      }
    }

    // Filtrer par rôle (logique métier)
    const shouldNotify = shouldNotifyUserByRole(user?.role, newData?.statut)
    if (!shouldNotify) {
      console.log('🔍 Hook: Notification filtrée par rôle', user?.role, newData?.statut)
      return
    }

    const update: DossierUpdate = {
      id: newData?.id || oldData?.id,
      numeroDossier: newData?.numeroDossier || oldData?.numeroDossier,
      statut: newData?.statut || oldData?.statut,
      oldStatut: oldData?.statut,
      updatedAt: newData?.updatedAt || new Date().toISOString(),
      eventType
    }

    setUpdates(prev => [update, ...prev].slice(0, 50)) // Garder seulement les 50 derniers
    setLastUpdate(new Date())

    // Callbacks spécifiques
    if (eventType === 'INSERT' && optionsRef.current?.onNewDossier) {
      optionsRef.current.onNewDossier(newData)
    } else if (eventType === 'UPDATE' && optionsRef.current?.onUpdateDossier) {
      optionsRef.current.onUpdateDossier(newData)
    } else if (eventType === 'DELETE' && optionsRef.current?.onDeleteDossier) {
      optionsRef.current.onDeleteDossier(newData?.id || oldData?.id)
    }
  }, [user?.role])

  useEffect(() => {
    if (!user || !isConnected) {
      console.log('⏸️ Hook: Pas d\'abonnement (user ou connexion manquante)')
      return
    }

    console.log('🎯 Hook: Abonnement aux changements de dossiers')
    const unsubscribe = subscribeToDossierChanges(handleDossierChange)

    return () => {
      console.log('🔌 Hook: Désabonnement des changements de dossiers')
      unsubscribe()
    }
  }, [user, isConnected, subscribeToDossierChanges, handleDossierChange])

  const clearUpdates = useCallback(() => {
    setUpdates([])
    setLastUpdate(null)
  }, [])

  return {
    updates,
    lastUpdate,
    isConnected,
    clearUpdates
  }
}

/**
 * Détermine si un utilisateur doit être notifié selon son rôle et le statut du dossier
 */
function shouldNotifyUserByRole(userRole: string | undefined, dossierStatus: string | undefined): boolean {
  if (!userRole || !dossierStatus) return false

  switch (userRole) {
    case 'ADMIN':
      return true // Admin voit tout

    case 'SECRETAIRE':
      // Notifier quand un dossier est créé ou rejeté
      return ['BROUILLON', 'REJETE_CB', 'REJETE_ORDONNATEUR', 'REJETE_AC'].includes(dossierStatus)

    case 'CONTROLEUR_BUDGETAIRE':
      // Notifier quand un dossier est en attente de validation CB
      return ['EN_ATTENTE_CB', 'REJETE_CB'].includes(dossierStatus)

    case 'ORDONNATEUR':
      // Notifier quand un dossier est validé CB et en attente d'ordonnancement
      return ['VALIDE_CB', 'EN_ATTENTE_ORDONNANCEMENT', 'REJETE_ORDONNATEUR'].includes(dossierStatus)

    case 'AGENT_COMPTABLE':
      // Notifier quand un dossier est ordonné et en attente de comptabilisation
      return ['ORDONNE', 'EN_ATTENTE_COMPTABILISATION', 'REJETE_AC'].includes(dossierStatus)

    default:
      return false
  }
}