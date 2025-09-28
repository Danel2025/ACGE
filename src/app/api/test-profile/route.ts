import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Retourner des données de test sans authentification
    const mockProfile = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@acge.com',
      role: 'SECRETAIRE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        documents: 0,
        folders: 0
      }
    }

    return NextResponse.json({
      success: true,
      user: mockProfile,
      message: 'Test profile endpoint working (mock data)'
    })

  } catch (error: any) {
    console.error('Error in test-profile endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
