import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG AUTH - Début')

    // Vérifier les cookies
    const allCookies = request.cookies.getAll()
    console.log('🍪 Tous les cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`))

    // Récupérer le token auth
    const authToken = request.cookies.get('auth-token')?.value
    console.log('🔑 Token auth présent:', !!authToken)

    if (!authToken) {
      return NextResponse.json({
        status: 'NO_TOKEN',
        message: 'Aucun token d\'authentification trouvé',
        cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value }))
      })
    }

    // Vérifier le token JWT
    try {
      const decoded = verify(authToken, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
      console.log('✅ Token valide pour:', decoded.email)

      return NextResponse.json({
        status: 'AUTHENTICATED',
        message: 'Utilisateur authentifié',
        user: {
          id: decoded.userId || decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role
        },
        tokenInfo: {
          exp: decoded.exp,
          iat: decoded.iat,
          expiresAt: new Date(decoded.exp * 1000).toISOString()
        }
      })
    } catch (jwtError: any) {
      console.log('❌ Token invalide:', jwtError.message)
      return NextResponse.json({
        status: 'INVALID_TOKEN',
        message: 'Token invalide ou expiré',
        error: jwtError.message
      })
    }

  } catch (error: any) {
    console.error('💥 Erreur debug auth:', error)
    return NextResponse.json({
      status: 'ERROR',
      message: 'Erreur lors du debug d\'authentification',
      error: error.message
    }, { status: 500 })
  }
}
