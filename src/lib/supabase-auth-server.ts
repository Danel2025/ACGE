import { getSupabaseAdmin } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'

export async function findUserByEmail(email: string) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .select('id, email, name, role, password')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  if (error) throw error
  return data
}

export async function validatePassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed)
}

export function createAuthToken(payload: { userId: string; email: string; name?: string | null; role: string }) {
  return sign(
    {
      userId: payload.userId,
      email: payload.email,
      name: payload.name || '',
      role: payload.role,
    },
    process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development',
    { expiresIn: '7d' }
  )
}


