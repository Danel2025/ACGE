import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Auth simple - Début')
    
    return NextResponse.json({
      success: true,
      message: 'Auth simple fonctionne',
      authenticated: false,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Erreur auth simple:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
