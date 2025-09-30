import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📊 API RAPPORT DE VÉRIFICATION - ACGE
 * 
 * Génère un rapport complet de vérification à deux volets :
 * - Volet CB : Contrôles budgétaires effectués
 * - Volet Ordonnateur : Vérifications ordonnateur effectuées
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    console.log('📊 Génération rapport de vérification pour dossier:', dossierId)
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // 1. Récupérer les informations du dossier
    const { data: dossier, error: dossierError } = await admin
      .from('dossiers')
      .select(`
        id,
        numeroDossier,
        numeroNature,
        objetOperation,
        beneficiaire,
        statut,
        createdAt,
        updatedAt,
        posteComptableId,
        natureDocumentId,
        secretaireId,
        folderid,
        montant,
        montantordonnance,
        validatedat,
        commentaires,
        dateordonnancement,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .eq('id', dossierId)
      .single()

    if (dossierError) {
      console.error('❌ Erreur récupération dossier:', dossierError)
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    // 2. Récupérer les validations CB (contrôles de fond)
    const { data: controlesCB, error: controlesCBError } = await admin
      .from('validations_controles_fond')
      .select(`
        *,
        controle:controles_fond(
          *,
          categorie:categories_controles_fond(*)
        )
      `)
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: true })

    if (controlesCBError) {
      console.warn('⚠️ Erreur récupération contrôles CB:', controlesCBError)
    }

    // 3. Récupérer la synthèse CB
    const { data: syntheseCB, error: syntheseCBError } = await admin
      .from('syntheses_controles_fond')
      .select('*')
      .eq('dossier_id', dossierId)
      .single()

    if (syntheseCBError && syntheseCBError.code !== 'PGRST116') {
      console.warn('⚠️ Erreur récupération synthèse CB:', syntheseCBError)
    }

    // 4. Récupérer les vérifications Ordonnateur
    const { data: verificationsOrdonnateur, error: verificationsOrdError } = await admin
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

    if (verificationsOrdError) {
      console.warn('⚠️ Erreur récupération vérifications Ordonnateur:', verificationsOrdError)
    }

    // 5. Récupérer la synthèse Ordonnateur
    const { data: syntheseOrdonnateur, error: syntheseOrdError } = await admin
      .from('syntheses_verifications_ordonnateur')
      .select('*')
      .eq('dossier_id', dossierId)
      .single()

    if (syntheseOrdError && syntheseOrdError.code !== 'PGRST116') {
      console.warn('⚠️ Erreur récupération synthèse Ordonnateur:', syntheseOrdError)
    }

    // 6. Organiser les données par catégorie pour le volet CB
    const controlesCBParCategorie = controlesCB?.reduce((acc, controle) => {
      const categorie = controle.controle.categorie
      if (!acc[categorie.id]) {
        acc[categorie.id] = {
          categorie,
          controles: []
        }
      }
      acc[categorie.id].controles.push(controle)
      return acc
    }, {} as Record<string, { categorie: any, controles: any[] }>) || {}

    // 7. Organiser les données par catégorie pour le volet Ordonnateur
    const verificationsOrdParCategorie = verificationsOrdonnateur?.reduce((acc, verification) => {
      const categorie = verification.verification.categorie
      if (!acc[categorie.id]) {
        acc[categorie.id] = {
          categorie,
          verifications: []
        }
      }
      acc[categorie.id].verifications.push(verification)
      return acc
    }, {} as Record<string, { categorie: any, verifications: any[] }>) || {}

    // 8. Analyser les incohérences potentielles
    const incoherences = analyserIncoherences(dossier, controlesCB, verificationsOrdonnateur)

    // 9. Calculer les statistiques globales
    const statistiques = {
      cb: {
        total: controlesCB?.length || 0,
        valides: controlesCB?.filter(c => c.valide).length || 0,
        rejetes: controlesCB?.filter(c => !c.valide).length || 0,
        categories: Object.keys(controlesCBParCategorie).length,
        statut: syntheseCB?.statut || 'NON_EFFECTUÉ'
      },
      ordonnateur: {
        total: verificationsOrdonnateur?.length || 0,
        valides: verificationsOrdonnateur?.filter(v => v.valide).length || 0,
        rejetes: verificationsOrdonnateur?.filter(v => !v.valide).length || 0,
        categories: Object.keys(verificationsOrdParCategorie).length,
        statut: syntheseOrdonnateur?.statut || 'NON_EFFECTUÉ'
      },
      incoherences: incoherences.length
    }

    const rapport = {
      dossier,
      voletCB: {
        synthese: syntheseCB,
        controles: controlesCB || [],
        controlesParCategorie: Object.values(controlesCBParCategorie),
        statistiques: statistiques.cb
      },
      voletOrdonnateur: {
        synthese: syntheseOrdonnateur,
        verifications: verificationsOrdonnateur || [],
        verificationsParCategorie: Object.values(verificationsOrdParCategorie),
        statistiques: statistiques.ordonnateur
      },
      incoherences,
      statistiquesGlobales: statistiques,
      dateGeneration: new Date().toISOString()
    }

    console.log('✅ Rapport de vérification généré avec succès')

    return NextResponse.json({
      success: true,
      rapport
    })

  } catch (error) {
    console.error('❌ Erreur génération rapport de vérification:', error)
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
 * Analyse les incohérences entre les vérifications CB et Ordonnateur
 */
function analyserIncoherences(dossier: any, controlesCB: any[], verificationsOrd: any[]) {
  const incoherences = []

  // Vérifier la cohérence des montants
  const montantsCB = controlesCB?.filter(c => 
    c.controle?.nom?.toLowerCase().includes('montant') && c.valide
  ) || []
  
  const montantsOrd = verificationsOrd?.filter(v => 
    v.verification?.nom?.toLowerCase().includes('montant') && v.valide
  ) || []

  if (montantsCB.length > 0 && montantsOrd.length > 0) {
    // Logique d'analyse des montants
    if (dossier.montantOrdonnance && dossier.montantOrdonnance !== dossier.montant) {
      incoherences.push({
        type: 'MONTANT',
        severite: 'MOYENNE',
        description: 'Différence entre le montant initial et le montant ordonnancé',
        details: {
          montantInitial: dossier.montant,
          montantOrdonnance: dossier.montantOrdonnance
        }
      })
    }
  }

  // Vérifier la cohérence temporelle
  const validationDate = dossier.validatedCBAt || dossier.validated_cb_at || dossier.validatedat
  const ordonnancementDate = dossier.ordonnancedAt || dossier.ordonnanced_at

  if (ordonnancementDate && validationDate) {
    const dateValidation = new Date(validationDate)
    const dateOrdonnancement = new Date(ordonnancementDate)

    if (dateOrdonnancement < dateValidation) {
      incoherences.push({
        type: 'TEMPOREL',
        severite: 'HAUTE',
        description: 'Date d\'ordonnancement antérieure à la date de validation CB',
        details: {
          dateValidation: validationDate,
          dateOrdonnancement: ordonnancementDate
        }
      })
    }
  }

  // Vérifier les rejets croisés
  const rejetsCB = controlesCB?.filter(c => !c.valide) || []
  const rejetsOrd = verificationsOrd?.filter(v => !v.valide) || []

  if (rejetsCB.length > 0 && rejetsOrd.length === 0) {
    incoherences.push({
      type: 'VALIDATION_CROISEE',
      severite: 'MOYENNE',
      description: 'Le CB a identifié des problèmes mais l\'Ordonnateur n\'en a pas trouvé',
      details: {
        rejetsCB: rejetsCB.length,
        rejetsOrdonnateur: rejetsOrd.length
      }
    })
  }

  return incoherences
}
