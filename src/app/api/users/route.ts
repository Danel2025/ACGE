import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const allowedRoles = new Set(['ADMIN', 'SECRETAIRE', 'CONTROLEUR_BUDGETAIRE', 'ORDONNATEUR', 'AGENT_COMPTABLE'])

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    
    // D'abord essayer l'authentification via cookies JWT
    const authToken = request.cookies.get('auth-token')?.value
    
    if (authToken) {
      console.log('🔑 [POST] Token JWT trouvé dans les cookies')
      
      try {
        // Vérifier le token JWT directement
        const jwt = require('jsonwebtoken')
        const secret = process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development'
        
        if (!secret) {
          console.log('❌ [POST] NEXTAUTH_SECRET non configuré')
          return null
        }
        
        const decoded = jwt.verify(authToken, secret)
        console.log('✅ [POST] Token JWT valide:', decoded.email, decoded.role)
        
        // Récupérer les informations complètes de l'utilisateur
        const { data: userData, error: userError } = await admin
          .from('users')
          .select('id, name, email, role')
          .eq('id', decoded.userId)
          .single()
        
        if (userError || !userData) {
          console.log('❌ [POST] Utilisateur non trouvé dans public.users:', userError)
          return null
        }
        
        console.log('✅ [POST] Utilisateur authentifié via JWT:', userData.email, userData.role)
        return userData
        
      } catch (jwtError) {
        console.log('❌ [POST] Token JWT invalide:', jwtError)
        // Continuer vers le fallback
      }
    }
    
    // Fallback vers l'authentification Bearer token (pour compatibilité)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Vérifier le token avec Supabase Auth
      const { data: { user }, error } = await admin.auth.getUser(token)
      
      if (error || !user) {
        console.log('❌ [POST] Token Supabase invalide:', error)
        return null
      }
      
      // Récupérer les informations complètes de l'utilisateur depuis public.users
      const { data: userData, error: userError } = await admin
        .from('users')
        .select('id, name, email, role')
        .eq('email', user.email)
        .single()
      
      if (userError || !userData) {
        console.log('❌ [POST] Utilisateur non trouvé dans public.users:', userError)
        return null
      }
      
      console.log('✅ [POST] Utilisateur authentifié via Supabase:', userData.email, userData.role)
      return userData
    }
    
    console.log('❌ [POST] Aucun token d\'authentification trouvé')
    return null
    
  } catch (error) {
    console.log('❌ [POST] Erreur authentification:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('👥 Récupération des utilisateurs...')
    
    const supabase = getSupabaseAdmin()
    
    // Récupérer tous les utilisateurs avec colonnes existantes seulement
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, createdAt')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('❌ Erreur récupération utilisateurs:', error)
      return NextResponse.json(
        { error: 'Erreur récupération utilisateurs', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ ${users?.length || 0} utilisateur(s) trouvé(s)`)
    
    if (users && users.length > 0) {
      console.log('📋 Utilisateurs:', users.map(u => ({ id: u.id, email: u.email, name: u.name })))
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      count: users?.length || 0
    })

  } catch (error) {
    console.error('💥 Erreur générale:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    console.log('👤 ===== DÉBUT CRÉATION UTILISATEUR =====')
    console.log('👤 Création d\'un nouvel utilisateur...')
    
    // Vérifier l'authentification
    const authenticatedUser = await getAuthenticatedUser(request)
    console.log('👤 [POST] Utilisateur authentifié:', authenticatedUser ? 'Oui' : 'Non')

    if (!authenticatedUser) {
      console.log('❌ [POST] Non authentifié')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions (seuls les admins peuvent créer des utilisateurs)
    if (authenticatedUser.role !== 'ADMIN') {
      console.log('❌ [POST] Permissions insuffisantes:', authenticatedUser.role)
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }
    
    const { name, email, password, role } = await request.json()
    console.log('👤 Données reçues:', { name, email, role, hasPassword: !!password })
    console.log('👤 Types:', { 
      nameType: typeof name, 
      emailType: typeof email, 
      passwordType: typeof password, 
      roleType: typeof role 
    })

    // Validation des données
    if (!name || !email || !password || !role) {
      console.log('❌ Données manquantes:', { name: !!name, email: !!email, password: !!password, role: !!role })
      return NextResponse.json(
        { error: 'Nom, email, mot de passe et rôle sont requis' },
        { status: 400 }
      )
    }

    // Validation du rôle
    if (!allowedRoles.has(role)) {
      console.log('❌ Rôle invalide:', role)
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      )
    }

    // Validation du mot de passe
    if (password.length < 6) {
      console.log('❌ Mot de passe trop court')
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    
    if (!admin) {
      console.log('❌ Service de base de données indisponible')
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    // Vérifier si l'email existe déjà
    console.log('👤 Vérification de l\'email...')
    const { data: existingUser, error: userError } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      console.error('❌ Erreur vérification email:', userError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification de l\'email' },
        { status: 500 }
      )
    }

    if (existingUser) {
      console.log('❌ Email déjà utilisé:', email)
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Étape 1: Créer l'utilisateur dans Supabase Auth
    console.log('👤 Création dans Supabase Auth...')
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Confirmer automatiquement l'email
      user_metadata: {
        name: name.trim(),
        role: role
      }
    })

    if (authError || !authUser.user) {
      console.error('❌ Erreur création Supabase Auth:', authError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'utilisateur dans Supabase Auth', details: authError?.message },
        { status: 500 }
      )
    }

    console.log('✅ Utilisateur créé dans Supabase Auth:', authUser.user.id)

    // Étape 2: Créer l'utilisateur dans notre table public.users
    console.log('👤 Création dans public.users...')
    const now = new Date().toISOString()
    const { data: newUser, error: createError } = await admin
      .from('users')
      .insert({
        id: authUser.user.id, // Utiliser l'UID de Supabase Auth
        name: name.trim(),
        email: email.trim(),
        password: '', // Pas besoin de stocker le mot de passe (géré par Supabase Auth)
        role: role,
        createdAt: now,
        updatedAt: now
      })
      .select('id, name, email, role, createdAt')
      .single()

    if (createError) {
      console.error('❌ Erreur création dans public.users:', createError)
      
      // Nettoyer : supprimer l'utilisateur de Supabase Auth si la création dans public.users échoue
      console.log('🧹 Nettoyage: suppression de l\'utilisateur Supabase Auth...')
      try {
        await admin.auth.admin.deleteUser(authUser.user.id)
        console.log('✅ Utilisateur Supabase Auth supprimé')
      } catch (cleanupError) {
        console.error('❌ Erreur lors du nettoyage:', cleanupError)
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'utilisateur dans la base de données', details: createError.message },
        { status: 500 }
      )
    }

    console.log('✅ Utilisateur créé avec succès:', newUser)
    console.log('👤 ===== FIN CRÉATION UTILISATEUR =====')
    
    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: newUser
    })

  } catch (error) {
    console.error('💥 Erreur création utilisateur:', error)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
