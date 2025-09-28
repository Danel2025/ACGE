import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug des variables d\'environnement...')

    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Définie' : 'Non définie',
      DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'N/A',
      DIRECT_URL: process.env.DIRECT_URL ? 'Définie' : 'Non définie',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    }

    console.log('📊 Variables d\'environnement:', envInfo)

    return NextResponse.json({
      success: true,
      message: 'Variables d\'environnement récupérées',
      env: envInfo
    })

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du debug',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
