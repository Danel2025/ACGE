import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { ensureDocumentsBucket, diagnoseStorageIssues } from '@/lib/supabase-storage-setup'

/**
 * API pour diagnostiquer et configurer le storage Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    try {
      const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
      console.log('✅ Utilisateur authentifié:', decoded.userId)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    // Diagnostic
    const diagnosis = await diagnoseStorageIssues()

    return NextResponse.json(diagnosis)

  } catch (error) {
    console.error('Erreur diagnostic storage:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du diagnostic',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentification
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    let userId: string
    try {
      const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
      userId = decoded.userId
      console.log('✅ Utilisateur authentifié:', userId)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    // Configuration du bucket
    const result = await ensureDocumentsBucket()

    return NextResponse.json({
      success: true,
      message: 'Configuration du storage réussie',
      ...result
    })

  } catch (error) {
    console.error('Erreur configuration storage:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la configuration',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}