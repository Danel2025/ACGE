import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test auth - Début')
    
    // Vérifier les cookies
    const cookies = request.cookies
    console.log('🍪 Cookies reçus:', Object.fromEntries(cookies.getAll().map(c => [c.name, c.value])))
    
    const authToken = cookies.get('auth-token')
    console.log('🔑 Auth token présent:', !!authToken)
    
    // Vérifier les headers
    const headers = request.headers
    console.log('📋 Headers:', Object.fromEntries(headers.entries()))
    
    return NextResponse.json({
      success: true,
      message: 'Test auth réussi',
      hasAuthToken: !!authToken,
      cookiesCount: cookies.size,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Erreur test auth:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
