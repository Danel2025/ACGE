import { supabaseAdmin } from '@/lib/supabase'

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante: opérations serveur/admin indisponibles')
  }
  return supabaseAdmin
}

export async function selectUsersMinimal() {
  const admin = getSupabaseAdmin()
  return admin
    .from('users')
    .select('id, name, email, role, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(1000)
}


