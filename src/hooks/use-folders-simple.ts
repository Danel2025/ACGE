import { useState, useEffect } from 'react'

export interface DossierData {
  id: string
  name: string
  numeroDossier: string
  foldername?: string
  nomDossier?: string
  documentCount: number
  objetOperation: string
  statut: string
  createdAt: string
}

export function useFoldersSimple() {
  const [folders, setFolders] = useState<DossierData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFolders = async () => {
    try {
      console.log('🚀 [useFoldersSimple] Début de la récupération')
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/folders', {
        credentials: 'include'
      })

      console.log('📡 [useFoldersSimple] Réponse API:', response.status, response.ok)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 [useFoldersSimple] Données API:', data)

      if (data.dossiers && Array.isArray(data.dossiers)) {
        const processedFolders = data.dossiers.map((dossier: any) => ({
          id: dossier.id,
          name: dossier.foldername || dossier.nomDossier || `Dossier ${dossier.numeroDossier}`,
          numeroDossier: dossier.numeroDossier,
          foldername: dossier.foldername,
          nomDossier: dossier.nomDossier,
          documentCount: dossier._count?.documents || 0,
          objetOperation: dossier.objetOperation,
          statut: dossier.statut,
          createdAt: dossier.createdAt
        }))

        console.log('✅ [useFoldersSimple] Dossiers traités:', processedFolders.length)
        console.log('📁 [useFoldersSimple] Premier dossier:', processedFolders[0])

        setFolders(processedFolders)
      } else {
        console.warn('⚠️ [useFoldersSimple] Pas de dossiers dans la réponse')
        setFolders([])
      }

    } catch (err) {
      console.error('❌ [useFoldersSimple] Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setFolders([])
    } finally {
      setIsLoading(false)
      console.log('🏁 [useFoldersSimple] Chargement terminé')
    }
  }

  useEffect(() => {
    console.log('🔄 [useFoldersSimple] Hook monté')
    fetchFolders()
  }, [])

  return {
    folders,
    isLoading,
    error,
    refresh: fetchFolders
  }
}