import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 🔍 API DEBUG DOSSIERS - ACGE
 * 
 * Script de diagnostic pour vérifier l'état des dossiers
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnostic des dossiers')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // Récupérer tous les dossiers avec leurs détails
    const { data: allDossiers, error: allError } = await admin
      .from('dossiers')
      .select(`
        id,
        numeroDossier,
        statut,
        createdAt,
        updatedAt,
        poste_comptable:posteComptableId(numero, intitule),
        nature_document:natureDocumentId(numero, nom),
        secretaire:secretaireId(name, email)
      `)
      .order('createdAt', { ascending: false })

    if (allError) {
      console.error('❌ Erreur Supabase tous dossiers:', allError)
      throw allError
    }

    // Récupérer spécifiquement les dossiers en attente
    const { data: pendingDossiers, error: pendingError } = await admin
      .from('dossiers')
      .select(`
        id,
        numeroDossier,
        statut,
        createdAt,
        updatedAt
      `)
      .eq('statut', 'EN_ATTENTE')
      .order('createdAt', { ascending: false })

    if (pendingError) {
      console.error('❌ Erreur Supabase dossiers en attente:', pendingError)
      throw pendingError
    }

    console.log(`🔍 ${allDossiers?.length || 0} dossiers au total`)
    console.log(`🔍 ${pendingDossiers?.length || 0} dossiers en attente`)
    
    return NextResponse.json({ 
      success: true,
      total: allDossiers?.length || 0,
      pending: pendingDossiers?.length || 0,
      allDossiers: allDossiers || [],
      pendingDossiers: pendingDossiers || []
    })

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic des dossiers:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors du diagnostic des dossiers',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    )
  }
}
