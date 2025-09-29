import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * API temporaire pour créer des documents de test liés au dossier comptable
 * Utilise folder_id pour stocker l'ID du dossier comptable
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📄 Création de documents de test pour le dossier comptable')

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 })
    }

    const dossierId = '9270988d-f17d-42f0-972d-44db343fcde0'
    const authorId = 'e4a8c25e-5239-4134-8aa9-2d49d87a16d9' // CB user

    // Créer des documents de test avec folder_id = dossierId (solution temporaire)
    const testDocuments = [
      {
        title: 'Facture fournisseur',
        description: 'Facture du fournisseur pour l\'opération de cotisations internationales',
        author_id: authorId,
        folder_id: dossierId, // Utilise folder_id pour stocker l'ID du dossier comptable
        file_name: 'facture_fournisseur.pdf',
        file_size: 245760, // 240 KB
        file_type: 'application/pdf',
        file_path: '/storage/documents/facture_fournisseur.pdf',
        is_public: false,
        tags: ['facture', 'fournisseur', 'cotisations']
      },
      {
        title: 'Bon de commande',
        description: 'Bon de commande pour les cotisations internationales',
        author_id: authorId,
        folder_id: dossierId,
        file_name: 'bon_commande.pdf',
        file_size: 189440, // 185 KB
        file_type: 'application/pdf',
        file_path: '/storage/documents/bon_commande.pdf',
        is_public: false,
        tags: ['bon de commande', 'cotisations']
      },
      {
        title: 'Justificatif bancaire',
        description: 'Relevé bancaire justifiant le paiement des cotisations',
        author_id: authorId,
        folder_id: dossierId,
        file_name: 'releve_bancaire.pdf',
        file_size: 512000, // 500 KB
        file_type: 'application/pdf',
        file_path: '/storage/documents/releve_bancaire.pdf',
        is_public: false,
        tags: ['bancaire', 'justificatif', 'paiement']
      }
    ]

    // Supprimer les anciens documents de test
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('folder_id', dossierId)
      .in('title', ['Facture fournisseur', 'Bon de commande', 'Justificatif bancaire'])

    if (deleteError) {
      console.log('⚠️ Erreur suppression anciens documents:', deleteError.message)
    }

    // Insérer les nouveaux documents
    const { data: insertedDocs, error: insertError } = await supabase
      .from('documents')
      .insert(testDocuments)
      .select()

    if (insertError) {
      console.error('❌ Erreur insertion documents:', insertError)
      return NextResponse.json({
        error: 'Erreur lors de la création des documents',
        details: insertError.message
      }, { status: 500 })
    }

    console.log(`✅ ${insertedDocs?.length || 0} documents de test créés`)

    return NextResponse.json({
      success: true,
      documentsCreated: insertedDocs?.length || 0,
      documents: insertedDocs
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({
      error: 'Erreur lors de la création',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}