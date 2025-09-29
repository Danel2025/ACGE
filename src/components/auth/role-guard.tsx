'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingState } from '@/components/ui/loading-states'
import { XCircle, ArrowLeft } from 'lucide-react'
import { Role } from '@/types'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: Role[]
  fallbackPath?: string
  showAccessDenied?: boolean
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard',
  showAccessDenied = true 
}: RoleGuardProps) {
  const { user, isLoading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      if (showAccessDenied) {
        // Ne pas rediriger automatiquement, laisser l'utilisateur voir le message d'erreur
        return
      } else {
        router.push(fallbackPath)
      }
    }
  }, [user, isLoading, allowedRoles, fallbackPath, router, showAccessDenied])

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <LoadingState
              isLoading={true}
              message="Chargement..."
              size="lg"
              color="primary"
              showText={true}
            />
          </div>
        </div>
      </MainLayout>
    )
  }

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-muted-foreground" />
                Non connecté
              </CardTitle>
              <CardDescription>
                Vous devez être connecté pour accéder à cette page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/login')}>
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  // Si l'utilisateur n'a pas les permissions nécessaires
  if (!allowedRoles.includes(user.role)) {
    if (!showAccessDenied) {
      return null // Ne rien afficher si on ne veut pas montrer l'erreur
    }

    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-muted-foreground" />
                Accès refusé
              </CardTitle>
              <CardDescription>
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                <br />
                <span className="font-medium">Rôle requis :</span> {allowedRoles.join(', ')}
                <br />
                <span className="font-medium">Votre rôle :</span> {user.role}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => router.push(fallbackPath)} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/profile')} 
                className="w-full"
              >
                Voir mon profil
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  // Si tout est OK, afficher le contenu
  return <>{children}</>
}

// Composants de protection spécifiques pour chaque rôle
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      {children}
    </RoleGuard>
  )
}

export function SecretaireGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['SECRETAIRE', 'ADMIN']}>
      {children}
    </RoleGuard>
  )
}

export function ControleurBudgetaireGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['CONTROLEUR_BUDGETAIRE', 'ADMIN']}>
      {children}
    </RoleGuard>
  )
}

export function OrdonnateurGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['ORDONNATEUR', 'ADMIN']}>
      {children}
    </RoleGuard>
  )
}

export function AgentComptableGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['AGENT_COMPTABLE', 'ADMIN']}>
      {children}
    </RoleGuard>
  )
}
