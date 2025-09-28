import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Journalisation de la config
console.log('🔍 Configuration Supabase:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)

// Client public: peut être indisponible côté serveur si variables publiques manquantes
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Client admin pour les opérations côté serveur (prioritaire pour nos API)
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null

if (!supabase && !supabaseAdmin) {
  console.warn('⚠️ Aucun client Supabase initialisé: variables manquantes')
}
