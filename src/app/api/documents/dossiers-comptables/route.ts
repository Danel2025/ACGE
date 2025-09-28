import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📋 API DOSSIERS COMPTABLES - ACGE
 * 
 * Récupère la liste des dossiers comptables depuis Supabase
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Récupération des dossiers comptables')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer les dossiers comptables (simplifié pour éviter les erreurs de relations)
    const { data: dossiersComptables, error } = await admin
      .from('dossiers')
      .select(`
        id,
        numeroDossier,
        numeroNature,
        objetOperation,
        beneficiaire,
        montant,
        statut,
        createdAt,
        updatedAt,
        posteComptableId,
        natureDocumentId,
        secretaireId
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('❌ Erreur Supabase dossiers comptables:', error)
      throw error
    }

    console.log(`📋 ${dossiersComptables?.length || 0} dossiers comptables trouvés`)
    
    return NextResponse.json({ 
      success: true, 
      dossiers: dossiersComptables || [],
      count: dossiersComptables?.length || 0
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des dossiers comptables:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des dossiers comptables',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}

/**
 * Créer un nouveau dossier comptable
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📋 Création d\'un nouveau dossier comptable')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    const body = await request.json()
    const { numeroNature, objetOperation, beneficiaire, posteComptableId, natureDocumentId } = body
    
    // Validation des données
    if (!numeroNature || !objetOperation || !beneficiaire || !posteComptableId || !natureDocumentId) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }
    
    // Générer un numéro de dossier unique
    const currentYear = new Date().getFullYear()
    const { data: existingDossiers, error: countError } = await admin
      .from('dossiers')
      .select('numeroDossier')
      .ilike('numeroDossier', `DOSS-ACGE-${currentYear}%`)
      .order('numeroDossier', { ascending: false })
      .limit(1)
    
    if (countError) {
      console.error('❌ Erreur lors du comptage des dossiers:', countError)
      throw countError
    }
    
    let nextNumber = 1
    if (existingDossiers && existingDossiers.length > 0) {
      const lastNumber = existingDossiers[0].numeroDossier.split('-').pop()
      nextNumber = parseInt(lastNumber || '0') + 1
    }
    
    const numeroDossier = `DOSS-ACGE-${currentYear}${nextNumber.toString().padStart(3, '0')}`
    
    // Créer le dossier comptable
    const { data: newDossier, error } = await admin
      .from('dossiers')
      .insert({
        numeroDossier,
        numeroNature,
        objetOperation,
        beneficiaire,
        posteComptableId,
        natureDocumentId,
        secretaireId: 'user-temp', // À remplacer par l'ID de l'utilisateur authentifié
        statut: 'EN_ATTENTE'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur création dossier comptable:', error)
      throw error
    }

    console.log('✅ Dossier comptable créé:', newDossier.numeroDossier)
    
    return NextResponse.json({ 
      success: true, 
      dossier: newDossier
    })

  } catch (error) {
    console.error('❌ Erreur lors de la création du dossier comptable:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la création du dossier comptable',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
