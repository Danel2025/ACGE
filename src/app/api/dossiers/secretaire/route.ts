import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * 📋 API DOSSIERS SECRÉTAIRE
 * 
 * Récupère les dossiers créés par la secrétaire connectée
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Récupération des dossiers secrétaire...')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Récupérer le token d'autorisation
    const authHeader = request.headers.get('authorization')
    const authToken = request.cookies.get('auth-token')?.value
    
    let userId = null
    
    // Vérifier l'authentification via cookie JWT
    if (authToken) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(authToken, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
        userId = decoded.userId
      } catch (jwtError) {
        console.log('⚠️ JWT cookie invalide:', jwtError)
      }
    }
    
    // Vérifier l'authentification via token Supabase Auth
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error } = await supabase.auth.getUser(token)
        
        if (!error && user) {
          // Récupérer l'ID utilisateur depuis la table users
          const { data: userData } = await admin
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single()
          
          if (userData) {
            userId = userData.id
          }
        }
      } catch (supabaseError) {
        console.log('⚠️ Token Supabase Auth invalide:', supabaseError)
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est une secrétaire
    const { data: userData, error: userError } = await admin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    if (userData.role !== 'SECRETAIRE' && userData.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    // Récupérer les dossiers de la secrétaire
    const { data: dossiers, error: dossiersError } = await admin
      .from('dossiers')
      .select(`
        id,
        numeroDossier,
        objetOperation,
        beneficiaire,
        posteComptableId,
        natureDocumentId,
        dateDepot,
        statut,
        commentaires,
        createdAt,
        updatedAt,
        poste_comptable:posteComptableId(numero, intitule),
        nature_document:natureDocumentId(numero, nom)
      `)
      .eq('secretaireId', userId)
      .order('createdAt', { ascending: false })

    if (dossiersError) {
      console.error('❌ Erreur récupération dossiers:', dossiersError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des dossiers' },
        { status: 500 }
      )
    }

    console.log(`✅ ${dossiers?.length || 0} dossiers récupérés pour la secrétaire`)

    return NextResponse.json({
      success: true,
      dossiers: dossiers || []
    })

  } catch (error) {
    console.error('❌ Erreur API dossiers secrétaire:', error)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
