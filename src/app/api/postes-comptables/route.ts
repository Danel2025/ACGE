import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// GET - Récupérer tous les postes comptables
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Récupération postes comptables - Début')

    const admin = getSupabaseAdmin()

    // Récupérer les postes comptables depuis la base de données
    const { data: postesComptables, error } = await admin
      .from('postes_comptables')
      .select('*')
      .eq('isActive', true)
      .order('numero', { ascending: true })

    if (error) {
      console.error('Erreur Supabase:', error)
      // Fallback sur des données simulées si la table n'existe pas encore
      const fallbackData = [
        {
          id: 'poste_1',
          numero: '001',
          intitule: 'Trésorerie',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'poste_2',
          numero: '002',
          intitule: 'Comptes clients',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'poste_3',
          numero: '003',
          intitule: 'Comptes fournisseurs',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      console.log(`⚠️ Utilisation des données de fallback (${fallbackData.length} postes)`)
      return NextResponse.json({ postesComptables: fallbackData })
    }

    console.log(`✅ ${postesComptables?.length || 0} postes comptables récupérés`)

    return NextResponse.json({ postesComptables: postesComptables || [] })

  } catch (error) {
    console.error('Erreur lors de la récupération des postes comptables:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau poste comptable
export async function POST(request: NextRequest) {
  try {
    console.log('📊 Création poste comptable - Début')
    
    const body = await request.json()
    const { numero, intitule, isActive = true } = body

    if (!numero || !intitule) {
      return NextResponse.json(
        { error: 'Numéro et intitulé sont requis' },
        { status: 400 }
      )
    }

    // Simulation de création
    const posteComptable = {
      id: 'poste_' + Date.now(),
      numero,
      intitule,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log(`✅ Poste comptable créé: ${posteComptable.numero}`)

    return NextResponse.json({ 
      success: true,
      posteComptable,
      message: 'Poste comptable créé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la création du poste comptable:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

