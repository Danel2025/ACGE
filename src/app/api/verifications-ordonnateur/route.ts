import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * ✅ API VÉRIFICATIONS ORDONNATEUR - ACGE
 * 
 * Récupère la liste des vérifications que l'ordonnateur doit effectuer,
 * organisées par catégorie
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Récupération des vérifications ordonnateur')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer les catégories avec leurs vérifications
    const { data: categories, error: categoriesError } = await admin
      .from('categories_verifications_ordonnateur')
      .select(`
        *,
        verifications:verifications_ordonnateur_types(
          id,
          nom,
          description,
          question,
          aide,
          obligatoire,
          ordre
        )
      `)
      .eq('actif', true)
      .order('ordre')
    
    if (categoriesError) {
      console.error('❌ Erreur lors de la récupération des catégories:', categoriesError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des vérifications ordonnateur' },
        { status: 500 }
      )
    }
    
    // Organiser les vérifications par catégorie et trier
    const verificationsOrganisees = categories?.map(categorie => ({
      ...categorie,
      verifications: categorie.verifications
        ?.filter(verification => verification.actif !== false)
        ?.sort((a, b) => a.ordre - b.ordre) || []
    })) || []
    
    // Calculer les statistiques
    const statistiques = {
      totalCategories: verificationsOrganisees.length,
      totalVerifications: verificationsOrganisees.reduce(
        (total, cat) => total + cat.verifications.length, 
        0
      ),
      verificationsObligatoires: verificationsOrganisees.reduce(
        (total, cat) => total + cat.verifications.filter(v => v.obligatoire).length,
        0
      )
    }
    
    console.log('✅ Vérifications ordonnateur récupérées:', {
      categories: statistiques.totalCategories,
      verifications: statistiques.totalVerifications,
      obligatoires: statistiques.verificationsObligatoires
    })
    
    return NextResponse.json({
      success: true,
      categories: verificationsOrganisees,
      statistiques
    })
    
  } catch (error) {
    console.error('❌ Erreur API vérifications ordonnateur:', error)
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
 * ✅ API CRÉATION VÉRIFICATION ORDONNATEUR - ACGE
 * 
 * Crée une nouvelle vérification ordonnateur (admin uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('➕ Création d\'une nouvelle vérification ordonnateur')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    const body = await request.json()
    const { 
      categorie_id, 
      nom, 
      description, 
      question, 
      aide, 
      obligatoire = true, 
      ordre 
    } = body
    
    // Validation des données
    if (!categorie_id || !nom || !question) {
      return NextResponse.json(
        { error: 'Données manquantes : categorie_id, nom et question sont requis' },
        { status: 400 }
      )
    }
    
    // Vérifier que la catégorie existe
    const { data: categorie, error: categorieError } = await admin
      .from('categories_verifications_ordonnateur')
      .select('id, nom')
      .eq('id', categorie_id)
      .eq('actif', true)
      .single()
    
    if (categorieError || !categorie) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée ou inactive' },
        { status: 404 }
      )
    }
    
    // Déterminer l'ordre si non fourni
    let ordreCalcule = ordre
    if (!ordreCalcule) {
      const { data: maxOrdre } = await admin
        .from('verifications_ordonnateur_types')
        .select('ordre')
        .eq('categorie_id', categorie_id)
        .order('ordre', { ascending: false })
        .limit(1)
        .single()
      
      ordreCalcule = (maxOrdre?.ordre || 0) + 1
    }
    
    // Créer la vérification
    const { data: nouvelleVerification, error: creationError } = await admin
      .from('verifications_ordonnateur_types')
      .insert({
        categorie_id,
        nom,
        description,
        question,
        aide,
        obligatoire,
        ordre: ordreCalcule
      })
      .select(`
        *,
        categorie:categories_verifications_ordonnateur(nom, description)
      `)
      .single()
    
    if (creationError) {
      console.error('❌ Erreur lors de la création:', creationError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la vérification' },
        { status: 500 }
      )
    }
    
    console.log('✅ Vérification créée:', nouvelleVerification.nom)
    
    return NextResponse.json({
      success: true,
      verification: nouvelleVerification,
      message: 'Vérification créée avec succès'
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ Erreur création vérification ordonnateur:', error)
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
