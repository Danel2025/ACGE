import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🔍 Logout simple - Début')
    
    // En production, vous invalideriez le token ici
    // Pour l'instant, on retourne juste un succès
    
    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie'
    })
    
  } catch (error: any) {
    console.error('❌ Erreur logout simple:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
