import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createJwtToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    console.log('🔑 Tentative de connexion pour:', email)

    // Authentifier l'utilisateur
    const user = await authenticateUser(email, password)

    if (!user) {
      console.log('❌ Authentification échouée pour:', email)
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    console.log('✅ Authentification réussie pour:', email)

    // Créer la réponse avec les informations utilisateur
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: 'Authentification réussie'
    })

    // Créer un token JWT pour la session
    const token = createJwtToken(user)

    // Définir le cookie de session
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    })

    return response

  } catch (error) {
    console.error('Erreur de connexion:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
