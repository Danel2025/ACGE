import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { verify } from 'jsonwebtoken'

/**
 * 📄 API GESTION DOCUMENTS DOSSIER - ACGE
 * 
 * Gère les documents d'un dossier lors de la mise à jour
 * - GET: Récupère les documents du dossier
 * - POST: Ajoute un document au dossier
 * - DELETE: Retire un document du dossier
 */

// Récupérer les documents d'un dossier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('📄 Récupération des documents du dossier:', id)
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Récupérer les documents du dossier
    const { data: documents, error } = await admin
      .from('documents')
      .select(`
        id,
        title,
        description,
        file_name,
        file_size,
        file_type,
        file_path,
        created_at,
        updated_at,
        author_id
      `)
      .eq('folder_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur récupération documents:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des documents' },
        { status: 500 }
      )
    }

    console.log(`📄 ${documents?.length || 0} documents trouvés pour le dossier ${id}`)
    
    return NextResponse.json({ 
      success: true,
      documents: documents || []
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des documents:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des documents',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}

// Ajouter un document au dossier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('📄 Ajout d\'un document au dossier:', id)
    
    const body = await request.json()
    const { documentId } = body
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'ID du document requis' },
        { status: 400 }
      )
    }
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Vérifier que le document existe
    const { data: document, error: docError } = await admin
      .from('documents')
      .select('id, title, folder_id')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le document n'est pas déjà dans un autre dossier
    if (document.folder_id && document.folder_id !== id) {
      return NextResponse.json(
        { error: 'Ce document est déjà associé à un autre dossier' },
        { status: 409 }
      )
    }

    // Associer le document au dossier
    const { error: updateError } = await admin
      .from('documents')
      .update({ 
        folder_id: id,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('❌ Erreur association document:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'association du document' },
        { status: 500 }
      )
    }

    console.log('✅ Document associé au dossier:', document.title)
    
    return NextResponse.json({ 
      success: true,
      message: 'Document ajouté au dossier avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'ajout du document',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}

// Retirer un document du dossier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('📄 Retrait d\'un document du dossier:', id)
    
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'ID du document requis' },
        { status: 400 }
      )
    }
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Vérifier que le document appartient au dossier
    const { data: document, error: docError } = await admin
      .from('documents')
      .select('id, title, folder_id')
      .eq('id', documentId)
      .eq('folder_id', id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document non trouvé dans ce dossier' },
        { status: 404 }
      )
    }

    // Retirer le document du dossier (mettre folder_id à null)
    const { error: updateError } = await admin
      .from('documents')
      .update({ 
        folder_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('❌ Erreur retrait document:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors du retrait du document' },
        { status: 500 }
      )
    }

    console.log('✅ Document retiré du dossier:', document.title)
    
    return NextResponse.json({ 
      success: true,
      message: 'Document retiré du dossier avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur lors du retrait du document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors du retrait du document',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
