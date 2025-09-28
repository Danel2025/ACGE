import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * ✅ API CONTRÔLES DE FOND - ACGE
 * 
 * Récupère la liste des contrôles de fond organisés par catégorie
 */
export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer les catégories avec leurs contrôles
    const { data: categories, error: categoriesError } = await admin
      .from('categories_controles_fond')
      .select(`
        *,
        controles_fond:controles_fond(
          id,
          nom,
          description,
          obligatoire,
          ordre
        )
      `)
      .eq('actif', true)
      .order('ordre')
    
    if (categoriesError) {
      console.error('❌ Erreur lors de la récupération des catégories:', categoriesError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des contrôles de fond' },
        { status: 500 }
      )
    }
    
    // Organiser les contrôles par catégorie
    const controlesOrganises = categories?.map(categorie => ({
      ...categorie,
      controles: categorie.controles_fond
        ?.filter(controle => controle.actif !== false)
        ?.sort((a, b) => a.ordre - b.ordre) || []
    })) || []
    
    console.log('✅ Contrôles de fond récupérés:', controlesOrganises.length, 'catégories')
    
    return NextResponse.json({
      success: true,
      categories: controlesOrganises
    })
    
  } catch (error) {
    console.error('❌ Erreur API contrôles de fond:', error)
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
 * ✅ API CRÉATION CONTRÔLE DE FOND - ACGE
 * 
 * Crée un nouveau contrôle de fond (admin uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    const body = await request.json()
    const { categorie_id, nom, description, obligatoire = true, ordre } = body
    
    if (!categorie_id || !nom) {
      return NextResponse.json(
        { error: 'Catégorie et nom requis' },
        { status: 400 }
      )
    }
    
    const { data: controle, error: controleError } = await admin
      .from('controles_fond')
      .insert({
        categorie_id,
        nom,
        description,
        obligatoire,
        ordre: ordre || 999
      })
      .select()
      .single()
    
    if (controleError) {
      console.error('❌ Erreur lors de la création du contrôle:', controleError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du contrôle' },
        { status: 500 }
      )
    }
    
    console.log('✅ Contrôle de fond créé:', controle.id)
    
    return NextResponse.json({
      success: true,
      controle
    })
    
  } catch (error) {
    console.error('❌ Erreur API création contrôle:', error)
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
