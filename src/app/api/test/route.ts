import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API test: Début de la requête')
    
    return NextResponse.json({ 
      success: true, 
      message: 'API test fonctionne',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Erreur API test:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
