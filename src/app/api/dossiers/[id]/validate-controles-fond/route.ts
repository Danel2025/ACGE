import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * ✅ API VALIDATION CONTRÔLES DE FOND - ACGE
 * 
 * Valide les contrôles de fond d'un dossier
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    console.log('✅ Validation contrôles de fond pour dossier:', dossierId)
    
    // Récupérer l'utilisateur depuis les headers
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Informations utilisateur manquantes' },
        { status: 401 }
      )
    }
    
    // Vérifier que l'utilisateur est un CB
    if (userRole !== 'CONTROLEUR_BUDGETAIRE') {
      return NextResponse.json(
        { error: 'Accès non autorisé - Rôle CB requis' },
        { status: 403 }
      )
    }
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Vérifier que l'utilisateur existe dans la base de données
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      console.error('❌ Utilisateur non trouvé:', userId, userError)
      return NextResponse.json(
        { error: 'Utilisateur non trouvé dans la base de données' },
        { status: 404 }
      )
    }
    
    // Vérifier que l'utilisateur est bien un CB
    if (user.role !== 'CONTROLEUR_BUDGETAIRE') {
      return NextResponse.json(
        { error: 'Accès non autorisé - Rôle CB requis' },
        { status: 403 }
      )
    }
    
    // Récupérer les données de validation
    const body = await request.json()
    const { validations, commentaire_general } = body
    
    if (!validations || !Array.isArray(validations)) {
      return NextResponse.json(
        { error: 'Données de validation invalides' },
        { status: 400 }
      )
    }
    
    // Vérifier que le dossier existe et est en attente de validation CB
    const { data: dossier, error: dossierError } = await admin
      .from('dossiers')
      .select('*')
      .eq('id', dossierId)
      .single()
    
    if (dossierError || !dossier) {
      console.error('❌ Dossier non trouvé:', dossierId, dossierError)
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }
    
    console.log('🔍 Statut du dossier:', dossier.statut, 'pour le dossier:', dossier.numeroDossier)
    
    if (dossier.statut !== 'EN_ATTENTE') {
      console.error('❌ Dossier pas en attente:', {
        dossierId,
        numeroDossier: dossier.numeroDossier,
        statut: dossier.statut,
        expected: 'EN_ATTENTE'
      })
      return NextResponse.json(
        { 
          error: 'Seuls les dossiers en attente peuvent être validés',
          details: {
            dossierId,
            numeroDossier: dossier.numeroDossier,
            currentStatus: dossier.statut,
            expectedStatus: 'EN_ATTENTE'
          }
        },
        { status: 400 }
      )
    }
    
    // Vérifier que tous les contrôles obligatoires sont présents
    const { data: controlesObligatoires, error: controlesError } = await admin
      .from('controles_fond')
      .select('id, nom, obligatoire')
      .eq('obligatoire', true)
      .eq('actif', true)
    
    if (controlesError) {
      console.error('❌ Erreur lors de la récupération des contrôles obligatoires:', controlesError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des contrôles' },
        { status: 500 }
      )
    }
    
    const controlesValides = validations.map(v => v.controle_fond_id)
    const controlesManquants = controlesObligatoires.filter(controle => 
      !controlesValides.includes(controle.id)
    )
    
    if (controlesManquants.length > 0) {
      return NextResponse.json(
        { 
          error: 'Contrôles obligatoires manquants',
          details: controlesManquants.map(c => c.nom)
        },
        { status: 400 }
      )
    }
    
    // Supprimer les anciennes validations pour ce dossier
    const { error: deleteError } = await admin
      .from('validations_controles_fond')
      .delete()
      .eq('dossier_id', dossierId)
    
    if (deleteError) {
      console.error('❌ Erreur lors de la suppression des anciennes validations:', deleteError)
      // Ne pas faire échouer la validation pour cette erreur
    }
    
    // Créer les nouvelles validations
    const validationsToInsert = validations.map(validation => ({
      dossier_id: dossierId,
      controle_fond_id: validation.controle_fond_id,
      valide: validation.valide,
      commentaire: validation.commentaire || null,
      valide_par: userId,
      valide_le: new Date().toISOString()
    }))
    
    const { data: newValidations, error: insertError } = await admin
      .from('validations_controles_fond')
      .insert(validationsToInsert)
      .select()
    
    if (insertError) {
      console.error('❌ Erreur lors de la création des validations:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la validation des contrôles' },
        { status: 500 }
      )
    }
    
     // Ne pas mettre à jour le statut du dossier ici
     // Le dossier ne sera validé qu'après les deux validations (type d'opération + contrôles de fond)
     // Le statut reste 'EN_ATTENTE' jusqu'à ce que les deux validations soient complètes
     // La validation finale du dossier se fait via l'API /api/dossiers/[id]/validate
     
     console.log('✅ Validation contrôles de fond terminée avec succès')
     
     return NextResponse.json({
       success: true,
       message: 'Contrôles de fond validés avec succès',
       validations: newValidations
     })
    
  } catch (error) {
    console.error('❌ Erreur API validation contrôles de fond:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * ✅ API CONSULTATION VALIDATIONS CONTRÔLES DE FOND - ACGE
 * 
 * Récupère les validations des contrôles de fond d'un dossier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer les validations avec les détails des contrôles
    const { data: validations, error: validationsError } = await admin
      .from('validations_controles_fond')
      .select(`
        *,
        controle_fond:controles_fond(
          id,
          nom,
          description,
          obligatoire,
          categorie:categories_controles_fond(
            id,
            nom,
            ordre
          )
        )
      `)
      .eq('dossier_id', dossierId)
      .order('valide_le', { ascending: false })
    
    if (validationsError) {
      console.error('❌ Erreur lors de la récupération des validations:', validationsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des validations' },
        { status: 500 }
      )
    }
    
    // Organiser par catégorie
    const validationsParCategorie = validations?.reduce((acc, validation) => {
      const categorie = validation.controle_fond?.categorie
      if (!categorie) return acc
      
      if (!acc[categorie.id]) {
        acc[categorie.id] = {
          categorie: {
            id: categorie.id,
            nom: categorie.nom,
            ordre: categorie.ordre
          },
          validations: []
        }
      }
      
      acc[categorie.id].validations.push({
        id: validation.id,
        controle_fond_id: validation.controle_fond_id,
        nom: validation.controle_fond?.nom,
        description: validation.controle_fond?.description,
        obligatoire: validation.controle_fond?.obligatoire,
        valide: validation.valide,
        commentaire: validation.commentaire,
        valide_par: validation.valide_par,
        valide_le: validation.valide_le
      })
      
      return acc
    }, {} as Record<string, any>) || {}
    
    return NextResponse.json({
      success: true,
      validations: Object.values(validationsParCategorie)
    })
    
  } catch (error) {
    console.error('❌ Erreur API consultation validations:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
