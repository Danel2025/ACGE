import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Mode test - Profil simulé...')
    
    // Simuler un profil utilisateur de test
    const user = {
      id: 'test-user-id',
      name: 'Utilisateur Test',
      email: 'test@acge.com',
      role: 'USER',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        documents: 5,
        folders: 2
      }
    }

    return NextResponse.json({
      user
    })

  } catch (error) {
    console.error('💥 Erreur profil test:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
