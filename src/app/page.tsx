'use client'

import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useMounted } from '@/hooks/use-mounted'
import { redirectByRole } from '@/lib/role-redirect'
import { LoadingState } from '@/components/ui/loading-states'

export default function HomePage() {
  const { user, isLoading } = useSupabaseAuth()
  const router = useRouter()
  const isMounted = useMounted()

  useEffect(() => {
    if (!isMounted || isLoading) return // Attendre le montage et le chargement

    console.log('🏠 Page d\'accueil - user:', user)
    console.log('🏠 Page d\'accueil - user.role:', user?.role)
    console.log('🏠 Page d\'accueil - isLoading:', isLoading)
    console.log('🏠 Page d\'accueil - isMounted:', isMounted)

    if (!user) {
      // Non authentifié, rediriger vers login avec replace
      console.log('🏠 Redirection vers login - utilisateur non connecté')
      // Attendre un court délai pour éviter les conflits de redirection
      const timer = setTimeout(() => {
        router.replace('/login')
      }, 150)
      
      return () => clearTimeout(timer)
    } else {
      // Authentifié, rediriger vers la page appropriée selon le rôle
      console.log('🏠 Redirection basée sur le rôle:', user.role)
      // Attendre un court délai pour éviter les conflits de redirection
      const timer = setTimeout(() => {
        redirectByRole(user.role, router)
      }, 150)
      
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
          size="lg"
          color="primary"
          showText={true}
        />
      </div>
    )
  }

  // Pendant la redirection, afficher un écran de chargement
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingState
        isLoading={true}
        message="Redirection..."
        size="lg"
        color="primary"
        showText={true}
      />
    </div>
  )
}