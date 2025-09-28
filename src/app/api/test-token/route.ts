import { NextRequest, NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    
    // Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, password')
      .eq('email', email)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe (si stocké en hash)
    if (user.password) {
      const bcrypt = require('bcryptjs')
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect' },
          { status: 401 }
        )
      }
    }

    // Générer le token JWT
    const token = sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development',
      { expiresIn: '1h' }
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Erreur génération token de test:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
