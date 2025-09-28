import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'

export interface SidebarStats {
  totalDocuments: number
  totalFolders: number
  spaceUsed: {
    gb: number
  }
}

export interface SidebarFolder {
  id: string
  name: string
  documentCount: number
  recentDocuments: Array<{
    id: string
    title: string
    fileName: string
    fileType: string
  }>
}

export function useSidebarData() {
  const { user } = useSupabaseAuth()
  const [stats, setStats] = useState<SidebarStats | null>(null)
  const [folders, setFolders] = useState<SidebarFolder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSidebarData = async () => {
    // Ne pas faire d'appels API si l'utilisateur n'est pas connecté
    if (!user?.id) {
      console.log('🔍 useSidebarData: Pas d\'utilisateur connecté, utilisation des valeurs par défaut')
      setStats({ totalDocuments: 0, totalFolders: 0, spaceUsed: { gb: 0 } })
      setFolders([])
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔍 useSidebarData: Récupération des données pour l\'utilisateur', user.id)
      
      const [statsResponse, foldersResponse] = await Promise.all([
        fetch('/api/dashboard/stats', { credentials: 'include' }),
        fetch('/api/sidebar/folders', { credentials: 'include' })
      ])

      if (statsResponse.status === 401) {
        // Non authentifié: valeurs par défaut, pas d'exception pour éviter le crash UI
        console.log('🔍 useSidebarData: Utilisateur non authentifié (401)')
        setStats({ totalDocuments: 0, totalFolders: 0, spaceUsed: { gb: 0 } })
        setFolders([])
        setError(null)
        return
      }

      if (!statsResponse.ok) {
        const errorData = await statsResponse.text()
        console.error('❌ Stats API error:', statsResponse.status, errorData)
        throw new Error(`Erreur lors de la récupération des statistiques: ${statsResponse.status}`)
      }

      const statsData = await statsResponse.json()
      setStats({
        totalDocuments: statsData.totalDocuments,
        totalFolders: statsData.totalFolders,
        spaceUsed: { gb: statsData.spaceUsed?.gb || 0 }
      })

      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json()
        setFolders(foldersData.folders || [])
      } else {
        console.warn('⚠️ Folders API error:', foldersResponse.status)
        setFolders([])
      }

      setError(null)
      console.log('✅ useSidebarData: Données chargées avec succès')
    } catch (err) {
      console.error('❌ Erreur sidebar:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setStats({ totalDocuments: 0, totalFolders: 0, spaceUsed: { gb: 0 } })
      setFolders([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSidebarData()
  }, [user?.id]) // Re-exécuter quand l'utilisateur change

  return {
    stats,
    folders,
    isLoading,
    error,
    refresh: fetchSidebarData
  }
}
