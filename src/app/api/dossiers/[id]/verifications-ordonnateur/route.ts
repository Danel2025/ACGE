import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { verify } from 'jsonwebtoken'

/**
 * 📋 API VALIDATION VÉRIFICATIONS ORDONNATEUR - ACGE
 *
 * Enregistre les vérifications effectuées par l'ordonnateur pour un dossier
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id

    console.log('📋 Validation vérifications ordonnateur pour dossier:', dossierId)

    const admin = getSupabaseAdmin()

    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // 🔐 Récupérer l'utilisateur depuis le JWT
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      console.error('❌ Cookie auth-token manquant')
      return NextResponse.json(
        { error: 'Non authentifié - Token manquant' },
        { status: 401 }
      )
    }

    let userId: string
    let userRole: string

    try {
      const decoded = verify(authToken, process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'unified-jwt-secret-for-development') as any
      userId = decoded.userId
      userRole = decoded.role

      console.log('🔐 JWT décodé:', { userId, role: userRole })

      // Vérifier que l'utilisateur est un ordonnateur
      if (userRole !== 'ORDONNATEUR' && userRole !== 'ADMIN') {
        console.error('❌ Rôle non autorisé:', userRole)
        return NextResponse.json(
          { error: 'Seuls les ordonnateurs peuvent effectuer des vérifications' },
          { status: 403 }
        )
      }
    } catch (jwtError) {
      console.error('❌ JWT invalide:', jwtError)
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
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
    
    // Vérifier que le dossier existe et est validé par CB
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
    
    if (dossier.statut !== 'VALIDÉ_CB') {
      console.error('❌ Dossier pas validé par CB:', {
        dossierId,
        numeroDossier: dossier.numeroDossier,
        statut: dossier.statut,
        expected: 'VALIDÉ_CB'
      })
      return NextResponse.json(
        { 
          error: 'Seuls les dossiers validés par le CB peuvent faire l\'objet de vérifications ordonnateur',
          details: {
            dossierId,
            numeroDossier: dossier.numeroDossier,
            currentStatus: dossier.statut,
            expectedStatus: 'VALIDÉ_CB'
          }
        },
        { status: 400 }
      )
    }
    
    // Vérifier que toutes les vérifications obligatoires sont présentes
    const { data: verificationsObligatoires, error: verificationsError } = await admin
      .from('verifications_ordonnateur_types')
      .select('id, nom, obligatoire')
      .eq('obligatoire', true)
      .eq('actif', true)
    
    if (verificationsError) {
      console.error('❌ Erreur lors de la récupération des vérifications obligatoires:', verificationsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des vérifications' },
        { status: 500 }
      )
    }
    
    const verificationsTraitees = validations.map(v => v.verification_id)
    const verificationsManquantes = verificationsObligatoires.filter(
      verif => !verificationsTraitees.includes(verif.id)
    )
    
    if (verificationsManquantes.length > 0) {
      console.error('❌ Vérifications obligatoires manquantes:', verificationsManquantes.map(v => v.nom))
      return NextResponse.json(
        { 
          error: 'Vérifications obligatoires manquantes',
          details: verificationsManquantes.map(v => v.nom)
        },
        { status: 400 }
      )
    }
    
    // Supprimer les anciennes validations pour ce dossier (si elles existent)
    const { error: deleteError } = await admin
      .from('validations_verifications_ordonnateur')
      .delete()
      .eq('dossier_id', dossierId)
    
    if (deleteError) {
      console.warn('⚠️ Erreur lors de la suppression des anciennes validations:', deleteError)
      // Ne pas faire échouer l'opération pour cette erreur
    }
    
    // Insérer les nouvelles validations
    const nouvellesValidations = validations.map(validation => ({
      dossier_id: dossierId,
      verification_id: validation.verification_id,
      valide: validation.valide,
      commentaire: validation.commentaire || null,
      piece_justificative_reference: validation.piece_justificative_reference || null,
      valide_par: userId,
      valide_le: new Date().toISOString()
    }))
    
    const { data: validationsCreees, error: insertError } = await admin
      .from('validations_verifications_ordonnateur')
      .insert(nouvellesValidations)
      .select(`
        *,
        verification:verifications_ordonnateur_types(
          nom,
          description,
          question,
          categorie:categories_verifications_ordonnateur(nom, icone, couleur)
        )
      `)
    
    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion des validations:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement des vérifications' },
        { status: 500 }
      )
    }
    
    // Calculer les statistiques
    const totalVerifications = validations.length
    const verificationsValidees = validations.filter(v => v.valide).length
    const verificationsRejetees = validations.filter(v => !v.valide).length
    const toutesValidees = verificationsRejetees === 0
    
    // Créer ou mettre à jour la synthèse
    const { data: synthese, error: syntheseError } = await admin
      .from('syntheses_verifications_ordonnateur')
      .upsert({
        dossier_id: dossierId,
        total_verifications: totalVerifications,
        verifications_validees: verificationsValidees,
        verifications_rejetees: verificationsRejetees,
        commentaire_general: commentaire_general || null,
        statut: toutesValidees ? 'VALIDÉ' : 'REJETÉ',
        valide_par: userId,
        valide_le: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'dossier_id'
      })
      .select()
      .single()
    
    if (syntheseError) {
      console.error('❌ Erreur lors de la création de la synthèse:', syntheseError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la synthèse' },
        { status: 500 }
      )
    }
    
    console.log('✅ Vérifications ordonnateur enregistrées:', {
      dossier: dossier.numeroDossier,
      total: totalVerifications,
      validees: verificationsValidees,
      rejetees: verificationsRejetees,
      statut: synthese.statut
    })
    
    return NextResponse.json({
      success: true,
      validations: validationsCreees,
      synthese,
      statistiques: {
        total: totalVerifications,
        validees: verificationsValidees,
        rejetees: verificationsRejetees,
        toutesValidees
      },
      message: `Vérifications ordonnateur enregistrées : ${verificationsValidees}/${totalVerifications} validées`
    })
    
  } catch (error) {
    console.error('❌ Erreur validation vérifications ordonnateur:', error)
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
 * 📊 API RÉCUPÉRATION VÉRIFICATIONS ORDONNATEUR DOSSIER - ACGE
 * 
 * Récupère les vérifications effectuées par l'ordonnateur pour un dossier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    console.log('📊 Récupération vérifications ordonnateur pour dossier:', dossierId)
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer les validations avec leurs détails
    const { data: validations, error: validationsError } = await admin
      .from('validations_verifications_ordonnateur')
      .select(`
        *,
        verification:verifications_ordonnateur_types(
          *,
          categorie:categories_verifications_ordonnateur(*)
        )
      `)
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: true })
    
    if (validationsError) {
      console.error('❌ Erreur récupération validations:', validationsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des validations' },
        { status: 500 }
      )
    }
    
    // Récupérer la synthèse
    const { data: synthese, error: syntheseError } = await admin
      .from('syntheses_verifications_ordonnateur')
      .select('*')
      .eq('dossier_id', dossierId)
      .single()
    
    // La synthèse peut ne pas exister si aucune vérification n'a été effectuée
    if (syntheseError && syntheseError.code !== 'PGRST116') {
      console.error('❌ Erreur récupération synthèse:', syntheseError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de la synthèse des vérifications' },
        { status: 500 }
      )
    }
    
    // Organiser les validations par catégorie
    const validationsParCategorie = validations?.reduce((acc, validation) => {
      const categorie = validation.verification.categorie
      if (!acc[categorie.id]) {
        acc[categorie.id] = {
          categorie,
          validations: []
        }
      }
      acc[categorie.id].validations.push(validation)
      return acc
    }, {} as any) || {}
    
    console.log('📊 Vérifications récupérées:', {
      total: validations?.length || 0,
      categories: Object.keys(validationsParCategorie).length,
      synthese: synthese ? synthese.statut : 'AUCUNE'
    })
    
    return NextResponse.json({
      success: true,
      validations: validations || [],
      validationsParCategorie,
      synthese: synthese || null,
      statistiques: {
        total: validations?.length || 0,
        validees: validations?.filter(v => v.valide).length || 0,
        rejetees: validations?.filter(v => !v.valide).length || 0,
        categories: Object.keys(validationsParCategorie).length
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur récupération vérifications ordonnateur:', error)
    
    // S'assurer que la réponse est toujours du JSON valide
    try {
      return NextResponse.json(
        { 
          success: false,
          error: 'Erreur interne du serveur',
          details: error instanceof Error ? error.message : 'Erreur inconnue'
        },
        { status: 500 }
      )
    } catch (jsonError) {
      console.error('❌ Erreur lors de la création de la réponse JSON:', jsonError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erreur interne du serveur',
          details: 'Erreur de sérialisation JSON'
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}
