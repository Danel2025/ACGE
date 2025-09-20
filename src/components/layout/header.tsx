'use client'

import { useState } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { useModal } from '@/contexts/modal-context'
import { Search, Settings, LogOut, User, Menu, X, Bell } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchSuggestions, type SearchSuggestion } from '@/components/ui/search-suggestions'
import { useSearchSuggestions } from '@/hooks/use-search-suggestions'
import { useNotifications } from '@/hooks/use-notifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Header({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { user, logout } = useSupabaseAuth()
  const { hideHeader } = useModal()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const { stats: notificationStats } = useNotifications()

  // Hook pour les suggestions de recherche optimisé
  const { 
    suggestions, 
    isLoading: suggestionsLoading, 
    error: suggestionsError,
    cacheStats 
  } = useSearchSuggestions(searchQuery, { 
    debounceMs: 200, // Réduit pour une meilleure réactivité
    minQueryLength: 2, 
    maxSuggestions: 8, // Plus de suggestions
    enableCache: true,
    searchTypes: ['documents', 'folders', 'users'] // Types prioritaires
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Rediriger vers la page documents avec la recherche
      window.location.href = `/documents?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleSearchSelect = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'document':
        window.location.href = `/documents?search=${encodeURIComponent(suggestion.text)}`
        break
      case 'folder':
        window.location.href = `/folders?folder=${suggestion.id.replace('folder-', '')}`
        break
      case 'tag':
        window.location.href = `/documents?search=${encodeURIComponent(suggestion.text)}`
        break
      case 'user':
        window.location.href = `/documents?search=${encodeURIComponent(suggestion.text)}`
        break
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-[9999] bg-background border-b transition-all duration-300 ${
      hideHeader ? 'transform -translate-y-full opacity-0' : 'transform translate-y-0 opacity-100'
    }`}>
      <div className="relative flex h-16 items-center px-2 sm:px-3">
        {/* Logo */}
        <div className={`flex items-center gap-2 sm:gap-3 ${searchOpen ? 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto' : ''}` }>
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px]"
            onClick={() => onOpenMenu?.()}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/dashboard'}
              className="group cursor-pointer transition-all duration-300 hover:scale-105 relative p-0 h-auto"
              aria-label="Retour à l'accueil"
            >
              <Image
                src="/logo-tresor-public.svg"
                alt="Trésor Public Gabon"
                width={48}
                height={48}
                sizes="(max-width: 640px) 40px, 48px"
                priority
                className="relative z-10 object-contain w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 group-hover:scale-105 drop-shadow-md"
              />
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold text-primary">ACGE</h1>
          </div>
        </div>

        {/* Barre de recherche centrée (desktop) */}
        <div className="pointer-events-auto hidden sm:block absolute left-1/2 -translate-x-1/2 w-full max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Actions */}
        <div className={`ml-auto flex items-center gap-2 sm:gap-3 ${searchOpen ? 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto' : ''}` }>
          {/* Recherche (mobile) alignée à droite */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden min-h-[44px] min-w-[44px]"
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher"
          >
            <Search className="h-5 w-5" />
          </Button>
          {/* Toggle de thème */}
          <ThemeToggle />

          {/* Icône de notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative min-h-[44px] min-w-[44px]"
            onClick={() => window.location.href = '/notifications'}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationStats && notificationStats.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationStats.unreadCount}
              </span>
            )}
          </Button>

          {/* Menu utilisateur */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.name || ''} />
                    <AvatarFallback>
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-primary">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                  <div className="p-1 bg-muted rounded-md mr-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                  <div className="p-1 bg-muted rounded-md mr-2">
                    <Settings className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-md mr-2">
                    <LogOut className="h-3 w-3 text-red-600 dark:text-red-400" />
                  </div>
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Barre de recherche mobile intégrée au header */}
        {searchOpen && (
          <div className="sm:hidden absolute inset-x-2 z-10">
            <form
              onSubmit={(e) => {
                handleSearch(e)
                setSearchOpen(false)
              }}
              className="relative"
            >
              <SearchSuggestions
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={handleSearchSelect}
                placeholder="Rechercher..."
                suggestions={suggestions}
                isLoading={suggestionsLoading}
                className="w-full"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1.5 h-7 w-7"
                onClick={() => setSearchOpen(false)}
                aria-label="Fermer la recherche"
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}