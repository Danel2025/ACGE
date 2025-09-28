'use client'

import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { NotificationsProvider } from '@/contexts/notifications-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useMounted } from '@/hooks/use-mounted'
import { LoadingState } from '@/components/ui/loading-states'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useSupabaseAuth()
  const router = useRouter()
  const isMounted = useMounted()

  useEffect(() => {
    if (!isMounted || isLoading) return
    
    if (!user) {
      // Utiliser replace pour éviter l'historique et les transitions
      // Attendre un court délai pour éviter les conflits de redirection
      const timer = setTimeout(() => {
        router.replace('/login')
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [user, isLoading, router, isMounted])

  // Afficher un écran de chargement uniforme pendant les transitions
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState
          isLoading={true}
          message="Chargement..."
          variant="spinner"
          size="lg"
          color="primary"
          showText={true}
        />
      </div>
    )
  }

  // Si pas d'utilisateur, ne rien afficher (évite le flash)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState
          isLoading={true}
          message="Redirection..."
          variant="spinner"
          size="lg"
          color="primary"
          showText={true}
        />
      </div>
    )
  }

  return (
    <NotificationsProvider>
      {children}
    </NotificationsProvider>
  )
}