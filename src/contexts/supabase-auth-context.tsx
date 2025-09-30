'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  forceReloadFromAPI: () => Promise<void>
  resetAuthState: () => void
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Fonction pour logger les changements d'utilisateur
  const logUserChange = (from: string, newUser: User | null, oldUser: User | null) => {
    console.log(`🔄 User change [${from}]:`)
    console.log(`  - Ancien:`, oldUser ? `${oldUser.email} (${oldUser.role})` : 'null')
    console.log(`  - Nouveau:`, newUser ? `${newUser.email} (${newUser.role})` : 'null')

    if (oldUser && newUser && oldUser.role !== newUser.role) {
      console.warn(`⚠️ RÔLE CHANGÉ [${from}]: ${oldUser.role} → ${newUser.role}`)
      console.warn(`⚠️ Redirection potentielle de ${newUser.role} vers cb-dashboard`)
    }
  }

  // Wrapper pour setUser avec logging
  const setUserWithLogging = (newUser: User | null) => {
    const oldUser = user
    setUser(newUser)
    logUserChange('setUserWithLogging', newUser, oldUser)
  }

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth()
    
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUserData(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkAuth = async () => {
    try {
      // SÉCURITÉ : Vérifier le consentement aux cookies avant de tenter une reconnexion automatique
      const sessionConsent = sessionStorage.getItem('cookie-consent')
      const persistentConsent = localStorage.getItem('cookie-consent-persistent')
      const hasValidConsent = sessionConsent === 'accepted' || persistentConsent === 'accepted'
      const isTemporaryDecline = sessionConsent === 'declined-temp'

      // PRIORITÉ ABSOLUE : Vérifier le localStorage d'abord (données de connexion récente)
      const storedAuth = localStorage.getItem('acge-auth')
      if (storedAuth && hasValidConsent) {
        try {
          const parsed = JSON.parse(storedAuth)
          // Vérifier le timestamp pour s'assurer que les données sont récentes (moins de 30 minutes)
          const isRecent = parsed.timestamp && (Date.now() - parsed.timestamp < 30 * 60 * 1000)

          if (parsed.user && parsed.user.role && isRecent && parsed.source === 'JWT_LOGIN') {
            console.log('💾 Utilisateur trouvé dans localStorage (récents et authentiques):', parsed.user.email, parsed.user.role)
            console.log('⏰ Timestamp localStorage:', new Date(parsed.timestamp).toLocaleTimeString())
            console.log('🔗 Source localStorage:', parsed.source)
            console.log('🍪 Consentement cookies validé')
            setUserWithLogging({
              id: parsed.user.id,
              email: parsed.user.email,
              name: parsed.user.name,
              role: parsed.user.role
            })
            setIsLoading(false)
            return
          } else if (parsed.timestamp) {
            console.log('⚠️ Données localStorage trop anciennes ou pas de source authentique, suppression')
            console.log('⚠️ Source localStorage:', parsed.source)
            console.log('⚠️ Timestamp localStorage:', new Date(parsed.timestamp).toLocaleTimeString())
            localStorage.removeItem('acge-auth')
          }
        } catch (e) {
          console.log('⚠️ Erreur parsing localStorage:', e)
          localStorage.removeItem('acge-auth') // Nettoyer les données corrompues
        }
      } else if (storedAuth && !hasValidConsent && !isTemporaryDecline) {
        console.log('🛡️ Reconnexion automatique bloquée - consentement cookies requis')
        localStorage.removeItem('acge-auth') // Nettoyer pour forcer une nouvelle connexion
      } else if (storedAuth && isTemporaryDecline) {
        console.log('⏳ Consentement temporairement refusé, données conservées pour nouvelle tentative')
      }

      // SECONDE CHANCE : Essayer l'API /api/auth/me seulement si pas de localStorage valide ET consentement validé
      if (hasValidConsent) {
        console.log('🔍 Vérification auth via API /api/auth/me (fallback avec consentement)...')
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            console.log('✅ Utilisateur trouvé via API auth/me:', data.user.email, data.user.role)
            console.log('🔍 Données complètes via API:', data)
            console.log('🍪 Consentement cookies validé pour API')

            setUserWithLogging({
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role
            })
            setIsLoading(false)
            return
          }
        } else if (response.status === 401) {
          // 401 est normal quand l'utilisateur n'est pas connecté, ne pas logger d'erreur
          console.log('ℹ️ Aucune session active (401 - comportement normal)')
        }
      } else {
        console.log('🛡️ Vérification API bloquée - consentement cookies requis')
      }

      // DERNIER RECOURS : Supabase Auth
      console.log('🔍 Vérification via Supabase Auth (dernier recours)...')
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserData(session.user)
      } else {
        console.log('❌ Aucune authentification trouvée')
        setUserWithLogging(null)
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error)
      setUserWithLogging(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserData = async (authUser: any) => {
    try {
      // Récupérer le token d'accès
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('Aucun token d\'accès disponible')
        setUser(null)
        return
      }

      console.log('🔐 Chargement données utilisateur pour:', authUser.email)

      // Utiliser l'API spécifique pour récupérer l'utilisateur connecté
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        console.error('Erreur API auth/me:', response.status, response.statusText)
        setUser(null)
        return
      }

      const data = await response.json()
      if (!data.success || !data.user) {
        console.error('Erreur données API auth/me:', data)
        setUser(null)
        return
      }

      console.log('✅ Utilisateur chargé:', data.user.name, data.user.role)

      setUserWithLogging({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role
      })
    } catch (error) {
      console.error('Erreur loadUserData:', error)
      setUserWithLogging(null)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Utiliser l'API de connexion JWT au lieu de Supabase Auth
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          console.log('✅ Connexion réussie via API JWT:', data.user.email, data.user.role)
          console.log('🔍 Données utilisateur après connexion:', data.user)

          // Synchroniser Supabase Auth avec les données JWT
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              // Mettre à jour les métadonnées de l'utilisateur dans Supabase Auth
              await supabase.auth.updateUser({
                data: {
                  role: data.user.role,
                  user_id: data.user.id,
                  name: data.user.name
                }
              })
              console.log('✅ Supabase Auth synchronisé avec les données JWT')
            }
          } catch (syncError) {
            console.warn('⚠️ Impossible de synchroniser Supabase Auth:', syncError)
          }

          // Mettre à jour immédiatement le localStorage AVANT de modifier l'état
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role
          }
          localStorage.setItem('acge-auth', JSON.stringify({
            user: userData,
            timestamp: Date.now(), // Ajouter un timestamp pour éviter les conflits
            source: 'JWT_LOGIN' // Marquer la source pour éviter les conflits
          }))
          console.log('💾 localStorage mis à jour avec:', data.user.email, data.user.role)

          // Mettre à jour l'état utilisateur
          setUserWithLogging({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role
          })

          setIsLoading(false)

          return true
        }
      }

      return false
    } catch (error) {
      console.error('Erreur login:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Déconnexion en cours...')

      // 1. D'abord, mettre l'état de chargement pour éviter les re-renders
      setIsLoading(true)

      // 2. Nettoyer immédiatement le localStorage
      localStorage.removeItem('acge-auth')
      console.log('🧹 localStorage nettoyé')

      // 3. Appeler l'API de déconnexion
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      // 4. Nettoyer l'état utilisateur
      setUserWithLogging(null)

      // 5. S'assurer que isLoading est remis à false après la déconnexion
      setIsLoading(false)

      // 6. Redirection fluide avec replace pour éviter l'historique
      router.replace('/login')

      console.log('✅ Déconnexion terminée')
    } catch (error) {
      console.error('❌ Erreur logout:', error)
      // En cas d'erreur, forcer la déconnexion locale
      localStorage.removeItem('acge-auth')
      setUserWithLogging(null)
      setIsLoading(false)
      router.replace('/login')
    }
  }

  const refreshUser = async () => {
    console.log('🔄 Forçage du rechargement des données utilisateur...')
    // Nettoyer le localStorage pour forcer un rechargement depuis l'API
    localStorage.removeItem('acge-auth')
    await checkAuth()
  }

  const resetAuthState = () => {
    console.log('🔄 Réinitialisation complète de l\'état d\'authentification...')
    setUserWithLogging(null)
    setIsLoading(false)
    localStorage.removeItem('acge-auth')
  }

  const forceReloadFromAPI = async () => {
    console.log('⚡ Rechargement forcé depuis l\'API...')
    // Nettoyer complètement et recharger depuis l'API
    localStorage.removeItem('acge-auth')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          console.log('✅ Rechargement forcé réussi:', data.user.email, data.user.role)
          setUserWithLogging({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role
          })
          return
        }
      }

      console.log('❌ Rechargement forcé échoué')
      setUserWithLogging(null)
    } catch (error) {
      console.error('Erreur rechargement forcé:', error)
      setUserWithLogging(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getAccessToken = async (): Promise<string | null> => {
    try {
      // D'abord essayer de récupérer le token JWT depuis les cookies
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          // Pour les requêtes API, utiliser le token JWT depuis les cookies
          // Le token est automatiquement inclus dans les cookies
          return 'jwt-token-from-cookies'
        }
      }
      
      // Fallback vers Supabase Auth
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error('Erreur récupération token:', error)
      return null
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      refreshUser,
      forceReloadFromAPI,
      resetAuthState,
      getAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}
