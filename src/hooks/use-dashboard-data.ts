import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'

export interface DashboardStats {
  totalDocuments: number
  totalFolders: number
  totalUsers: number
  activeUsers: number
  monthlyGrowthPercentage: number
  spaceUsed: {
    bytes: number
    gb: number
    percentage: number
    quota: number
  }
  recentDocuments: Array<{
    id: string
    name: string
    title: string
    size: number
    type: string
    createdAt: string
    updatedAt: string
    author: {
      name: string | null
      email: string
    }
    folder: {
      name: string
    } | null
  }>
  documentsThisMonth: number
  documentsLastMonth: number
}

export interface DashboardActivity {
  activities: Array<{
    id: string
    type: string
    action: string
    target: string
    targetId: string
    timestamp: string
    metadata: {
      fileType?: string
    }
  }>
}

export function useDashboardData() {
  const { user } = useSupabaseAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<DashboardActivity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Ne pas faire d'appels API si l'utilisateur n'est pas connecté
      if (!user?.id) {
        console.log('🔍 useDashboardData: Pas d\'utilisateur connecté, utilisation des valeurs par défaut')
        setStats({
          totalDocuments: 0,
          totalFolders: 0,
          totalUsers: 0,
          activeUsers: 0,
          monthlyGrowthPercentage: 0,
          spaceUsed: { bytes: 0, gb: 0, percentage: 0, quota: 0 },
          recentDocuments: [],
          documentsThisMonth: 0,
          documentsLastMonth: 0
        })
        setActivity({ activities: [] })
        setError(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        console.log('🔍 useDashboardData: Récupération des données pour l\'utilisateur', user.id)
        
        // Récupérer les statistiques et l'activité en parallèle
        const [statsResponse, activityResponse] = await Promise.all([
          fetch('/api/dashboard/stats', { credentials: 'include' }),
          fetch('/api/dashboard/activity', { credentials: 'include' })
        ])

        if (statsResponse.status === 401 || activityResponse.status === 401) {
          console.log('🔍 useDashboardData: Utilisateur non authentifié (401)')
          setStats({
            totalDocuments: 0,
            totalFolders: 0,
            totalUsers: 0,
            activeUsers: 0,
            monthlyGrowthPercentage: 0,
            spaceUsed: { bytes: 0, gb: 0, percentage: 0, quota: 0 },
            recentDocuments: [],
            documentsThisMonth: 0,
            documentsLastMonth: 0
          })
          setActivity({ activities: [] })
          setError(null)
          return
        }

        if (!statsResponse.ok || !activityResponse.ok) {
          throw new Error('Erreur lors de la récupération des données')
        }

        let statsData, activityData
        
        try {
          statsData = await statsResponse.json()
        } catch (e) {
          console.error('Erreur parsing stats response:', e)
          throw new Error('Erreur lors du parsing des statistiques')
        }
        
        try {
          activityData = await activityResponse.json()
        } catch (e) {
          console.error('Erreur parsing activity response:', e)
          throw new Error('Erreur lors du parsing de l\'activité')
        }

        setStats(statsData)
        setActivity(activityData)
        setError(null)
        console.log('✅ useDashboardData: Données chargées avec succès')
      } catch (err) {
        console.error('❌ Erreur dashboard:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id]) // Re-exécuter quand l'utilisateur change

  const refreshData = async () => {
    setIsLoading(true)
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/dashboard/stats', { credentials: 'include' }),
        fetch('/api/dashboard/activity', { credentials: 'include' })
      ])

      if (!statsResponse.ok || !activityResponse.ok) {
        throw new Error('Erreur lors de la récupération des données')
      }

      let statsData, activityData
      
      try {
        statsData = await statsResponse.json()
      } catch (e) {
        console.error('Erreur parsing stats response:', e)
        throw new Error('Erreur lors du parsing des statistiques')
      }
      
      try {
        activityData = await activityResponse.json()
      } catch (e) {
        console.error('Erreur parsing activity response:', e)
        throw new Error('Erreur lors du parsing de l\'activité')
      }

      setStats(statsData)
      setActivity(activityData)
      setError(null)
    } catch (err) {
      console.error('Erreur refresh dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    stats,
    activity,
    isLoading,
    error,
    refreshData
  }
}
