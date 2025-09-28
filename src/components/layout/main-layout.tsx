'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { useSessionTimeout } from '@/hooks/use-session-timeout'
import { SessionWarning } from '@/components/ui/session-warning'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { useModal } from '@/contexts/modal-context'
import { useModalDetection } from '@/hooks/use-modal-detection'
import { ErrorHandler } from '@/components/error-handler'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useSupabaseAuth()
  const { hideHeader } = useModal()
  const router = useRouter()

  // Détecter automatiquement les modals
  useModalDetection()

  // Utiliser le hook de déconnexion automatique (qui gère lui-même les paramètres)
  const { getTimeUntilExpiration, extendSession, sessionTimeout } = useSessionTimeout({
    enabled: true
  })

  const handleExtendSession = () => {
    extendSession()
  }

  const handleLogout = async () => {
    try {
      await logout()
      // La redirection est déjà gérée dans le contexte d'auth
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ErrorHandler />
      {/* Header */}
      <Header onOpenMenu={() => setSidebarOpen(true)} />

      {/* Mobile sidebar controlled by header button */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent 
          side="left" 
          className="w-[280px] max-w-[90vw] p-0 sm:w-[320px]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de navigation</SheetTitle>
            <SheetDescription>Menu principal de navigation de l'application</SheetDescription>
          </SheetHeader>
          <Sidebar className="border-r-0" inSheet />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar - responsive width */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content - responsive margin */}
      <main className={`min-h-screen transition-all duration-300 md:ml-64 lg:ml-72 xl:ml-80 ${
        hideHeader ? 'pt-0' : 'pt-16'
      }`}>
        <div className="p-3 w-full sm:p-4">
          <div className="max-w-full overflow-x-hidden">
            {children}
          </div>
        </div>
      </main>

      {/* Avertissement d'expiration de session */}
      <SessionWarning
        timeUntilExpiration={getTimeUntilExpiration()}
        onExtendSession={handleExtendSession}
        onLogout={handleLogout}
        warningThreshold={60} // Avertir 60 secondes avant expiration
      />
    </div>
  )
}
