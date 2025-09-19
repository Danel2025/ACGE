'use client'

import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
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
      router.push('/login')
    }
  }, [user, isLoading, router, isMounted])

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  if (!user) {
    return null
  }

  return <>{children}</>
}