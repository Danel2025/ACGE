// Configuration d'authentification simplifiée sans NextAuth
// Utilise l'API personnalisée /api/auth/login

import { getSupabaseAdmin } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const supabase = getSupabaseAdmin()

    // Récupérer l'utilisateur depuis Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, password')
      .eq('email', email)
      .single()

    if (error || !user) {
      console.log('Utilisateur non trouvé:', email)
      return null
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      console.log('Mot de passe invalide pour:', email)
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
    }
  } catch (error) {
    console.error('Erreur d\'authentification:', error)
    return null
  }
}

export function createJwtToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'unified-jwt-secret-for-development',
    { expiresIn: '7d' }
  )
}

export function verifyJwtToken(token: string): User | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'unified-jwt-secret-for-development'
    ) as any

    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    }
  } catch (error) {
    console.error('Erreur de vérification du token:', error)
    return null
  }
}