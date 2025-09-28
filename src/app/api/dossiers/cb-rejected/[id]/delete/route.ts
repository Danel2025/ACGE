import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { verify } from 'jsonwebtoken'

/**
 * 🗑️ API SUPPRESSION DOSSIER REJETÉ CB - ACGE
 * 
 * Permet au Contrôleur Budgétaire de supprimer définitivement un dossier rejeté
 * pour éviter la saturation de la mémoire
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🗑️ Suppression dossier rejeté CB:', id)
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Récupérer l'utilisateur connecté
    let userData = null
    const authToken = request.cookies.get('auth-token')?.value
    
    if (authToken) {
      try {
        const decoded = verify(authToken, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
        const userId = decoded.userId
        
        const { data: user, error: userError } = await admin
          .from('users')
          .select('id, name, email, role, createdAt, updatedAt')
          .eq('id', userId)
          .single()

        if (!userError && user) {
          userData = user
        }
      } catch (jwtError) {
        console.log('⚠️ JWT cookie invalide:', jwtError)
      }
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est un contrôleur budgétaire
    if (userData.role !== 'CONTROLEUR_BUDGETAIRE') {
      return NextResponse.json(
        { error: 'Accès refusé: rôle contrôleur budgétaire requis' },
        { status: 403 }
      )
    }

    // Vérifier que le dossier existe et est rejeté
    const { data: existingDossier, error: checkError } = await admin
      .from('dossiers')
      .select(`
        id,
        numeroDossier,
        statut,
        folderId,
        poste_comptable:posteComptableId(numero, intitule),
        nature_document:natureDocumentId(numero, nom),
        secretaire:secretaireId(name, email)
      `)
      .eq('id', id)
      .single()

    if (checkError) {
      console.error('❌ Erreur vérification dossier:', checkError)
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    if (existingDossier.statut !== 'REJETÉ_CB') {
      return NextResponse.json(
        { error: 'Seuls les dossiers rejetés par le CB peuvent être supprimés' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Suppression du dossier rejeté: ${existingDossier.numeroDossier}`)
    console.log(`📊 Détails du dossier:`)
    console.log(`   - Poste comptable: ${existingDossier.poste_comptable?.numero} - ${existingDossier.poste_comptable?.intitule}`)
    console.log(`   - Nature: ${existingDossier.nature_document?.numero} - ${existingDossier.nature_document?.nom}`)
    console.log(`   - Secrétaire: ${existingDossier.secretaire?.name} (${existingDossier.secretaire?.email})`)
    console.log(`   - FolderId: ${existingDossier.folderId || 'Aucun'}`)

    // Supprimer le dossier de la base de données
    const { error: deleteError } = await admin
      .from('dossiers')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ Erreur suppression dossier:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du dossier' },
        { status: 500 }
      )
    }

    console.log('✅ Dossier rejeté supprimé avec succès:', existingDossier.numeroDossier)
    
    return NextResponse.json({ 
      success: true,
      message: 'Dossier rejeté supprimé avec succès',
      deletedDossier: {
        id: existingDossier.id,
        numeroDossier: existingDossier.numeroDossier,
        posteComptable: existingDossier.poste_comptable?.numero,
        natureDocument: existingDossier.nature_document?.numero,
        secretaire: existingDossier.secretaire?.name
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors de la suppression du dossier rejeté CB:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la suppression du dossier rejeté',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
