import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// GET - Récupérer les partages d'un document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
    const userId = decoded.userId

    // Vérifier les permissions et récupérer le document
    const admin = getSupabaseAdmin()
    const { data: document, error: docError } = await admin
      .from('documents')
      .select('id, title, author_id')
      .eq('id', resolvedParams.id)
      .maybeSingle()

    if (docError || !document) {
      return NextResponse.json({ 
        error: 'Document non trouvé' 
      }, { status: 404 })
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (document.author_id !== userId) {
      // Vérifier si l'utilisateur a des permissions de partage
      const { data: share } = await admin
        .from('document_shares')
        .select('permission')
        .eq('document_id', resolvedParams.id)
        .eq('user_id', userId)
        .in('permission', ['ADMIN', 'WRITE'])
        .maybeSingle()

      if (!share) {
        return NextResponse.json({ 
          error: 'Permissions insuffisantes' 
        }, { status: 403 })
      }
    }

    // Récupérer les partages
    const { data: shares, error: sharesError } = await admin
      .from('document_shares')
      .select(`
        id,
        permission,
        created_at,
        users!fk_document_shares_user_id (
          id,
          name,
          email
        )
      `)
      .eq('document_id', resolvedParams.id)
      .order('created_at', { ascending: false })

    if (sharesError) {
      console.error('Erreur récupération partages:', sharesError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des partages' }, { status: 500 })
    }

    return NextResponse.json({ shares })

  } catch (error) {
    console.error('Erreur lors de la récupération des partages:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// POST - Partager un document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
    const userId = decoded.userId

    const { userEmail, permission } = await request.json()

    if (!userEmail || !permission) {
      return NextResponse.json({ 
        error: 'Email utilisateur et permission requis' 
      }, { status: 400 })
    }

    // Vérifier les permissions et récupérer le document
    const admin = getSupabaseAdmin()
    const { data: document, error: docError } = await admin
      .from('documents')
      .select('id, title, author_id')
      .eq('id', resolvedParams.id)
      .maybeSingle()

    if (docError || !document) {
      return NextResponse.json({ 
        error: 'Document non trouvé' 
      }, { status: 404 })
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (document.author_id !== userId) {
      const { data: share } = await admin
        .from('document_shares')
        .select('permission')
        .eq('document_id', resolvedParams.id)
        .eq('user_id', userId)
        .eq('permission', 'ADMIN')
        .maybeSingle()

      if (!share) {
        return NextResponse.json({ 
          error: 'Permissions insuffisantes' 
        }, { status: 403 })
      }
    }

    // Trouver l'utilisateur cible
    const { data: targetUser, error: userError } = await admin
      .from('users')
      .select('id, name, email')
      .eq('email', userEmail)
      .maybeSingle()

    if (userError || !targetUser) {
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé' 
      }, { status: 404 })
    }

    // Vérifier que l'utilisateur ne se partage pas à lui-même
    if (targetUser.id === userId) {
      return NextResponse.json({ 
        error: 'Vous ne pouvez pas partager un document avec vous-même' 
      }, { status: 400 })
    }

    // Vérifier si le partage existe déjà
    const { data: existingShare } = await admin
      .from('document_shares')
      .select('id')
      .eq('document_id', resolvedParams.id)
      .eq('user_id', targetUser.id)
      .maybeSingle()

    if (existingShare) {
      return NextResponse.json({ 
        error: 'Ce document est déjà partagé avec cet utilisateur' 
      }, { status: 400 })
    }

    // Créer le partage
    const { data: share, error: shareError } = await admin
      .from('document_shares')
      .insert({
        document_id: resolvedParams.id,
        user_id: targetUser.id,
        permission: permission.toUpperCase()
      })
      .select(`
        id,
        permission,
        created_at,
        users!fk_document_shares_user_id (
          id,
          name,
          email
        )
      `)
      .single()

    if (shareError) {
      console.error('Erreur création partage:', shareError)
      return NextResponse.json({ error: 'Erreur lors de la création du partage' }, { status: 500 })
    }

    // Document partagé avec succès

    return NextResponse.json({
      message: 'Document partagé avec succès',
      share: {
        id: share.id,
        user: share.user,
        permission: share.permission,
        createdAt: share.createdAt
      }
    })

  } catch (error) {
    console.error('Erreur lors du partage:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un partage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
    const userId = decoded.userId

    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('shareId')
    const targetUserId = searchParams.get('userId')

    if (!shareId && !targetUserId) {
      return NextResponse.json({ 
        error: 'ID de partage ou ID utilisateur requis' 
      }, { status: 400 })
    }

    // Vérifier les permissions et récupérer le document
    const admin = getSupabaseAdmin()
    const { data: document, error: docError } = await admin
      .from('documents')
      .select('id, author_id')
      .eq('id', resolvedParams.id)
      .maybeSingle()

    if (docError || !document) {
      return NextResponse.json({ 
        error: 'Document non trouvé' 
      }, { status: 404 })
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (document.author_id !== userId) {
      const { data: share } = await admin
        .from('document_shares')
        .select('permission')
        .eq('document_id', resolvedParams.id)
        .eq('user_id', userId)
        .eq('permission', 'ADMIN')
        .maybeSingle()

      if (!share) {
        return NextResponse.json({ 
          error: 'Permissions insuffisantes' 
        }, { status: 403 })
      }
    }

    // Supprimer le partage
    let deleteQuery = admin
      .from('document_shares')
      .delete()

    if (shareId) {
      deleteQuery = deleteQuery.eq('id', shareId)
    } else {
      deleteQuery = deleteQuery
        .eq('document_id', resolvedParams.id)
        .eq('user_id', targetUserId!)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('Erreur suppression partage:', deleteError)
      return NextResponse.json({ error: 'Erreur lors de la suppression du partage' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Partage supprimé avec succès' })

  } catch (error) {
    console.error('Erreur lors de la suppression du partage:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
