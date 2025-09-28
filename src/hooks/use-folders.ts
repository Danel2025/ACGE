import { useState, useEffect } from 'react'

export interface DossierData {
  id: string
  nomDossier?: string
  foldername?: string
  name: string // Nom d'affichage prioritaire
  numeroDossier: string
  numeroNature: string
  objetOperation: string
  beneficiaire?: string
  description?: string
  statut: string
  montant?: number
  createdAt: string
  updatedAt: string
  dateDepot?: string
  posteComptableId?: string
  natureDocumentId?: string
  secretaireId?: string
  _count: { documents: number }
  documentCount: number // Alias pour faciliter l'utilisation
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
}

export interface DossiersStats {
  totalDossiers: number
  totalDocuments: number
}

export function useFolders() {
  const [folders, setFolders] = useState<DossierData[]>([])
  const [stats, setStats] = useState<DossiersStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('🔄 [useFolders] Hook initialisé, état initial:', {
    foldersLength: folders.length,
    isLoading,
    error
  })

  const fetchFolders = async () => {
    try {
      console.log('📁 [useFolders] Récupération des dossiers - Début')
      setIsLoading(true)
      setError(null)

      // Ajouter un timestamp pour forcer le rechargement et éviter le cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/folders?_t=${timestamp}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      console.log('📊 [useFolders] Réponse API dossiers:', {
        status: response.status,
        ok: response.ok,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Erreur API dossiers:', response.status, errorData)
        throw new Error(`Erreur lors de la récupération des dossiers: ${response.status} - ${errorData}`)
      }

      const responseText = await response.text()
      console.log('📋 [useFolders] Réponse brute:', responseText.substring(0, 200) + '...')

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ [useFolders] Erreur parsing JSON:', parseError)
        throw new Error('Erreur de format de réponse du serveur')
      }

      console.log('📊 [useFolders] Données reçues:', {
        dossiersCount: data.dossiers?.length || 0,
        hasDossiers: !!data.dossiers,
        firstDossier: data.dossiers?.[0]?.numeroDossier || 'N/A',
        firstDossierName: data.dossiers?.[0]?.foldername || 'N/A',
        rawDataKeys: Object.keys(data)
      })

      // Adapter les dossiers au format attendu avec noms d'affichage corrects
      const dossiersWithCount = (data.dossiers || []).map((dossier: any) => ({
        id: dossier.id,
        foldername: dossier.foldername,
        nomDossier: dossier.nomDossier,
        // Nom d'affichage prioritaire
        name: dossier.foldername || dossier.nomDossier || `Dossier ${dossier.numeroDossier}`,
        numeroDossier: dossier.numeroDossier,
        numeroNature: dossier.numeroNature,
        objetOperation: dossier.objetOperation,
        beneficiaire: dossier.beneficiaire,
        statut: dossier.statut,
        montant: dossier.montant,
        createdAt: dossier.createdAt,
        updatedAt: dossier.updatedAt,
        posteComptableId: dossier.posteComptableId,
        natureDocumentId: dossier.natureDocumentId,
        secretaireId: dossier.secretaireId,
        _count: { documents: dossier._count?.documents || 0 },
        // Alias pour compatibilité
        documentCount: dossier._count?.documents || 0,
        poste_comptable: dossier.poste_comptable,
        nature_document: dossier.nature_document,
        secretaire: dossier.secretaire
      }))

      console.log('📁 [useFolders] Dossiers traités:', dossiersWithCount.length)
      console.log('📁 [useFolders] Premier dossier traité:', dossiersWithCount[0])

      setFolders(dossiersWithCount)
      console.log('📁 [useFolders] State folders mis à jour avec', dossiersWithCount.length, 'dossiers')

      // Calculer les stats
      const totalDossiers = data.dossiers?.length || 0
      const totalDocuments = dossiersWithCount.reduce((sum: number, dossier: any) => sum + (dossier._count?.documents || 0), 0)

      console.log('📊 [useFolders] Stats calculées:', { totalDossiers, totalDocuments })
      setStats({ totalDossiers, totalDocuments })
      console.log('📊 [useFolders] State stats mis à jour')

    } catch (err) {
      console.error('❌ [useFolders] Erreur récupération dossiers:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setFolders([])
      setStats({ totalDossiers: 0, totalDocuments: 0 })
      console.log('📁 [useFolders] State réinitialisé à cause de l\'erreur')
    } finally {
      setIsLoading(false)
      console.log('📁 [useFolders] Chargement terminé, isLoading = false')
    }
  }

  useEffect(() => {
    console.log('🔄 [useFolders] Hook monté, lancement de fetchFolders')
    fetchFolders()

    return () => {
      console.log('🔄 [useFolders] Hook démonté')
    }
  }, [])

  const removeFolder = (dossierId: string) => {
    console.log('🗑️ Suppression locale dossier:', dossierId)

    setFolders(prev => {
      const newDossiers = prev.filter(d => d.id !== dossierId)
      console.log('📁 Dossiers restants:', newDossiers.length)
      return newDossiers
    })

    // Mettre à jour les stats
    setStats(prev => {
      if (!prev) return null
      const newStats = {
        totalDossiers: Math.max(0, prev.totalDossiers - 1),
        totalDocuments: prev.totalDocuments
      }
      console.log('📊 Stats mises à jour:', newStats)
      return newStats
    })
  }

  return {
    folders,
    stats,
    isLoading,
    error,
    setError,
    refresh: fetchFolders,
    removeFolder
  }
}
