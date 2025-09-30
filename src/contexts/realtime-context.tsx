'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { toast } from 'sonner'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface RealtimeContextType {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
  subscribeToDossierChanges: (callback: (payload: any) => void) => () => void
  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => () => void
  broadcastEvent: (event: string, payload: any) => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabaseAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map())

  useEffect(() => {
    if (!user) {
      console.log('🔌 Realtime: Utilisateur non connecté, pas de connexion')
      setConnectionStatus('disconnected')
      setIsConnected(false)

      // Nettoyer tous les channels existants
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
      setChannels(new Map())

      return
    }

    console.log('🔌 Realtime: Initialisation de la connexion pour', user.email)
    setConnectionStatus('connecting')

    // Créer un channel de présence pour vérifier la connexion
    const presenceChannel = supabase.channel('presence', {
      config: {
        presence: {
          key: user.id
        }
      }
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        console.log('✅ Realtime: Connexion établie')
        setIsConnected(true)
        setConnectionStatus('connected')
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 Realtime: Utilisateur rejoint', key)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 Realtime: Utilisateur quitte', key)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          })
        }
      })

    setChannels(prev => new Map(prev).set('presence', presenceChannel))

    return () => {
      console.log('🔌 Realtime: Nettoyage des connexions')
      presenceChannel.unsubscribe()
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }
  }, [user?.id])

  const subscribeToDossierChanges = useCallback((callback: (payload: any) => void) => {
    if (!user) {
      console.warn('⚠️ Realtime: Impossible de s\'abonner sans utilisateur connecté')
      return () => {}
    }

    console.log('📡 Realtime: Abonnement aux changements de dossiers')

    const channel = supabase
      .channel('dossiers-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Écouter tous les événements (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'dossiers'
        },
        (payload) => {
          console.log('📦 Realtime: Changement de dossier détecté', payload)
          callback(payload)

          // Notification toast selon le type d'événement
          if (payload.eventType === 'INSERT') {
            toast.info('Nouveau dossier créé', {
              description: `Dossier ${payload.new?.numeroDossier || 'N/A'} créé`
            })
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Dossier mis à jour', {
              description: `Dossier ${payload.new?.numeroDossier || 'N/A'} modifié`
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status abonnement dossiers:', status)
      })

    setChannels(prev => new Map(prev).set('dossiers-changes', channel))

    return () => {
      console.log('🔌 Realtime: Désabonnement des changements de dossiers')
      channel.unsubscribe()
      setChannels(prev => {
        const newMap = new Map(prev)
        newMap.delete('dossiers-changes')
        return newMap
      })
    }
  }, [user])

  const subscribeToNotifications = useCallback((userId: string, callback: (payload: any) => void) => {
    if (!user) {
      console.warn('⚠️ Realtime: Impossible de s\'abonner sans utilisateur connecté')
      return () => {}
    }

    console.log('📡 Realtime: Abonnement aux notifications pour', userId)

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `userId=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 Realtime: Nouvelle notification', payload)
          callback(payload)

          // Toast notification
          if (payload.new) {
            toast.success('Nouvelle notification', {
              description: payload.new.message || 'Vous avez une nouvelle notification'
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status abonnement notifications:', status)
      })

    setChannels(prev => new Map(prev).set(`notifications-${userId}`, channel))

    return () => {
      console.log('🔌 Realtime: Désabonnement des notifications')
      channel.unsubscribe()
      setChannels(prev => {
        const newMap = new Map(prev)
        newMap.delete(`notifications-${userId}`)
        return newMap
      })
    }
  }, [user])

  const broadcastEvent = useCallback((event: string, payload: any) => {
    if (!isConnected) {
      console.warn('⚠️ Realtime: Impossible de broadcaster, pas de connexion')
      return
    }

    const broadcastChannel = channels.get('broadcast') || supabase.channel('broadcast')

    broadcastChannel.send({
      type: 'broadcast',
      event,
      payload
    })

    if (!channels.has('broadcast')) {
      broadcastChannel.subscribe()
      setChannels(prev => new Map(prev).set('broadcast', broadcastChannel))
    }
  }, [isConnected, channels])

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        connectionStatus,
        subscribeToDossierChanges,
        subscribeToNotifications,
        broadcastEvent
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}