import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        message: 'Aucun token d\'authentification trouvé'
      })
    }

    return NextResponse.json({
      authenticated: true,
      message: 'Token trouvé',
      hasToken: !!token
    })

  } catch (error) {
    console.error('Erreur API auth/me simple:', error)
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
