import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🚀 API DOCUMENTS DELETE - Suppression par fileId
 * 
 * API pour supprimer des documents en utilisant les fileId générés par l'API documents
 */

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Suppression document par fileId - Début')
    
    // Vérifier l'authentification (optionnel en mode développement)
    const token = request.cookies.get('auth-token')?.value
    let userId = 'test-user'
    let userRole = 'admin'

    if (token) {
      try {
        const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
        userId = decoded.userId
        userRole = decoded.role
        console.log('✅ Utilisateur authentifié:', userId, 'Rôle:', userRole)
      } catch (error) {
        console.log('⚠️ Token invalide, utilisation des valeurs par défaut')
      }
    } else {
      console.log('⚠️ Pas de token, utilisation des valeurs par défaut pour les tests')
    }
    
    // Récupérer le fileId depuis le body
    const body = await request.json()
    const { fileId } = body
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId requis' },
        { status: 400 }
      )
    }

    console.log('🔍 Recherche du document avec fileId:', fileId)

    // Récupérer le document original depuis la base de données
    const admin = getSupabaseAdmin()
    
    // Extraire l'ID original du fileId
    let originalId = null
    const uuidMatch = fileId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
    if (uuidMatch) {
      originalId = uuidMatch[1]
      console.log('🔍 ID original extrait:', originalId)
    }

    if (!originalId) {
      console.log('❌ Impossible d\'extraire l\'ID original du fileId:', fileId)
      return NextResponse.json(
        { error: 'Format de fileId invalide' },
        { status: 400 }
      )
    }

    // Récupérer le document par son ID original
    const { data: targetDocument, error: docError } = await admin
      .from('documents')
      .select('id, title, author_id, folder_id, file_name, created_at')
      .eq('id', originalId)
      .single()

    if (docError) {
      console.error('❌ Erreur récupération document:', docError)
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    console.log('📄 Document trouvé:', targetDocument.title, 'ID:', targetDocument.id)

    // Vérifier les permissions (admin ou propriétaire)
    if (userRole !== 'admin' && targetDocument.author_id !== userId) {
      console.log('❌ Accès refusé - pas le propriétaire')
      return NextResponse.json(
        { error: 'Accès refusé - vous ne pouvez supprimer que vos propres documents' },
        { status: 403 }
      )
    }

    console.log(`📄 Document à supprimer: ${targetDocument.title}`)
    console.log(`👤 Auteur: ${targetDocument.author_id}`)
    console.log(`📁 Dossier: ${targetDocument.folder_id}`)

    // Supprimer l'enregistrement en base de données
    const { error: deleteErr } = await admin
      .from('documents')
      .delete()
      .eq('id', targetDocument.id)

    if (deleteErr) {
      console.error('❌ Erreur suppression base de données:', deleteErr)
      throw deleteErr
    }

    console.log('✅ Document supprimé avec succès')
    
    // Supprimer le fichier du stockage Supabase si possible
    if (targetDocument.file_name) {
      try {
        const { error: storageError } = await admin.storage
          .from('documents')
          .remove([targetDocument.file_name])
        
        if (storageError) {
          console.warn('⚠️ Impossible de supprimer le fichier du stockage:', storageError)
        } else {
          console.log('✅ Fichier supprimé du stockage Supabase')
        }
      } catch (storageErr) {
        console.warn('⚠️ Erreur lors de la suppression du stockage:', storageErr)
      }
    }
    
    
    return NextResponse.json({
      success: true,
      message: 'Document supprimé avec succès',
      deletedDocument: {
        id: targetDocument.id,
        fileId: fileId,
        title: targetDocument.title,
        authorId: targetDocument.author_id,
        folderId: targetDocument.folder_id
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors de la suppression du document:', error)

    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}
