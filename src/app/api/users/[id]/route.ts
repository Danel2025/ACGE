import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { syncUserWithAuth } from '@/lib/auth-sync'

const allowedRoles = new Set(['ADMIN', 'SECRETAIRE', 'CONTROLEUR_BUDGETAIRE', 'ORDONNATEUR', 'AGENT_COMPTABLE'])

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    
    // D'abord essayer l'authentification via cookies JWT
    const authToken = request.cookies.get('auth-token')?.value
    
    if (authToken) {
      console.log('🔑 [PUT] Token JWT trouvé dans les cookies')
      
      try {
        // Vérifier le token JWT directement
        const jwt = require('jsonwebtoken')
        const secret = process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development'
        
        if (!secret) {
          console.log('❌ [PUT] NEXTAUTH_SECRET non configuré')
          return null
        }
        
        const decoded = jwt.verify(authToken, secret)
        console.log('✅ [PUT] Token JWT valide:', decoded.email, decoded.role)
        
        // Récupérer les informations complètes de l'utilisateur
        const { data: userData, error: userError } = await admin
          .from('users')
          .select('id, name, email, role')
          .eq('id', decoded.userId)
          .single()
        
        if (userError || !userData) {
          console.log('❌ [PUT] Utilisateur non trouvé dans public.users:', userError)
          return null
        }
        
        console.log('✅ [PUT] Utilisateur authentifié via JWT:', userData.email, userData.role)
        return userData
        
      } catch (jwtError) {
        console.log('❌ [PUT] Token JWT invalide:', jwtError)
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
        console.log('❌ [PUT] Token Supabase invalide:', error)
        return null
      }
    } else {
      console.log('❌ [PUT] Aucun token d\'authentification trouvé')
      return null
    }
    
    // Récupérer les informations complètes de l'utilisateur depuis public.users
    // D'abord essayer par email, puis par ID si l'email ne correspond pas
    let { data: userData, error: userError } = await admin
      .from('users')
      .select('id, name, email, role')
      .eq('email', user.email)
      .single()
    
    // Si pas trouvé par email, essayer par ID (au cas où les IDs ne correspondent pas)
    if (userError || !userData) {
      console.log('⚠️ [PUT] Utilisateur non trouvé par email, tentative par ID...')
      const { data: userDataById, error: userErrorById } = await admin
        .from('users')
        .select('id, name, email, role')
        .eq('id', user.id)
        .single()
      
      if (userErrorById || !userDataById) {
        console.log('❌ [PUT] Utilisateur non trouvé dans public.users:', userErrorById)
        return null
      }
      
      userData = userDataById
    }
    
    console.log('🔧 [PUT] Utilisateur authentifié:', { id: userData.id, email: userData.email, role: userData.role })
    return userData
    
  } catch (error) {
    console.log('❌ [PUT] Erreur authentification:', error)
    return null
  }
}

// PUT - Modifier un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔧 [PUT /api/users/[id]] Début de la mise à jour')
    const resolvedParams = await params
    console.log('🔧 [PUT] ID utilisateur:', resolvedParams.id)
    
    const authenticatedUser = await getAuthenticatedUser(request)
    console.log('🔧 [PUT] Utilisateur authentifié:', authenticatedUser ? 'Oui' : 'Non')

    // Vérifier l'authentification
    if (!authenticatedUser) {
      console.log('❌ [PUT] Non authentifié')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions (seuls les admins peuvent modifier des utilisateurs)
    if (authenticatedUser.role !== 'ADMIN') {
      console.log('❌ [PUT] Permissions insuffisantes:', authenticatedUser.role)
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const { name, email, password, role } = await request.json()
    console.log('🔧 [PUT] Données reçues:', { name, email, role, hasPassword: !!password })

    // Validation des données
    if (!name || !email || !role) {
      console.log('❌ [PUT] Données manquantes:', { name: !!name, email: !!email, role: !!role })
      return NextResponse.json(
        { error: 'Nom, email et rôle sont requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    console.log('🔧 [PUT] Connexion à Supabase...')
    const admin = getSupabaseAdmin()
    console.log('🔧 [PUT] Admin Supabase:', admin ? 'OK' : 'ERREUR')
    
    const { data: existingUser, error: userError } = await admin
      .from('users')
      .select('id, email')
      .eq('id', resolvedParams.id)
      .maybeSingle()

    console.log('🔧 [PUT] Recherche utilisateur:', { userError, existingUser })

    if (userError || !existingUser) {
      console.log('❌ [PUT] Utilisateur non trouvé:', userError)
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
    const { data: emailExists } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', resolvedParams.id)
      .maybeSingle()

    if (emailExists) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    if (role && !allowedRoles.has(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      name,
      email,
      role
    }

    // Hasher le mot de passe seulement s'il est fourni
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Étape 1: Mettre à jour l'utilisateur dans public.users
    console.log('🔧 [PUT] Mise à jour dans public.users avec données:', updateData)
    const { data: user, error: updateError } = await admin
      .from('users')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select('id, name, email, role')
      .single()

    console.log('🔧 [PUT] Résultat mise à jour public.users:', { user, updateError })

    if (updateError) {
      console.error('❌ [PUT] Erreur mise à jour utilisateur dans public.users:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
        { status: 500 }
      )
    }

    // Étape 2: Synchroniser avec Supabase Auth
    const syncResult = await syncUserWithAuth(
      admin,
      existingUser.email,
      {
        name: name.trim(),
        email: email.trim(),
        role: role,
        password: password && password.length >= 6 ? password : undefined
      },
      'USER_UPDATE'
    )

    if (!syncResult.success) {
      console.warn('⚠️ [PUT] Synchronisation Auth échouée:', syncResult.error)
      // Ne pas échouer, juste logger l'avertissement
    }

    return NextResponse.json(
      { 
        message: 'Utilisateur modifié avec succès',
        user 
      }
    )

  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ [DELETE] Début de la suppression')
    const resolvedParams = await params
    console.log('🗑️ [DELETE] ID utilisateur:', resolvedParams.id)
    
    const authenticatedUser = await getAuthenticatedUser(request)
    console.log('🗑️ [DELETE] Utilisateur authentifié:', authenticatedUser ? 'Oui' : 'Non')

    // Vérifier l'authentification
    if (!authenticatedUser) {
      console.log('❌ [DELETE] Non authentifié')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions (seuls les admins peuvent supprimer des utilisateurs)
    if (authenticatedUser.role !== 'ADMIN') {
      console.log('❌ [DELETE] Permissions insuffisantes:', authenticatedUser.role)
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    // Empêcher l'administrateur de se supprimer lui-même
    if (authenticatedUser.id === resolvedParams.id) {
      console.log('❌ [DELETE] Tentative de suppression de son propre compte')
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    const admin = getSupabaseAdmin()
    const { data: existingUser, error: userError } = await admin
      .from('users')
      .select('id')
      .eq('id', resolvedParams.id)
      .maybeSingle()

    if (userError || !existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Étape 1: Récupérer l'email de l'utilisateur avant suppression
    const { data: userToDelete, error: fetchError } = await admin
      .from('users')
      .select('email')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError || !userToDelete) {
      console.error('❌ [DELETE] Erreur récupération utilisateur:', fetchError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'utilisateur' },
        { status: 500 }
      )
    }

    // Étape 2: Supprimer l'utilisateur de public.users
    console.log('🗑️ [DELETE] Suppression de public.users...')
    const { error: deleteError } = await admin
      .from('users')
      .delete()
      .eq('id', resolvedParams.id)

    if (deleteError) {
      console.error('❌ [DELETE] Erreur suppression utilisateur dans public.users:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'utilisateur' },
        { status: 500 }
      )
    }

    // Étape 3: Supprimer l'utilisateur de Supabase Auth
    console.log('🗑️ [DELETE] Suppression de Supabase Auth...')
    try {
      // Trouver l'utilisateur Auth par email
      const { data: authUsers, error: listError } = await admin.auth.admin.listUsers()
      
      if (listError) {
        console.error('❌ [DELETE] Erreur récupération utilisateurs Auth:', listError)
        // Ne pas échouer, juste logger l'erreur
      } else {
        const authUser = authUsers.users.find(u => u.email === userToDelete.email)
        
        if (authUser) {
          console.log('🗑️ [DELETE] Utilisateur Auth trouvé, suppression...', authUser.id)
          
          const { error: authDeleteError } = await admin.auth.admin.deleteUser(authUser.id)
          
          if (authDeleteError) {
            console.error('❌ [DELETE] Erreur suppression Supabase Auth:', authDeleteError)
            // Ne pas échouer, juste logger l'erreur
          } else {
            console.log('✅ [DELETE] Utilisateur Auth supprimé avec succès')
          }
        } else {
          console.warn('⚠️ [DELETE] Utilisateur Auth non trouvé pour l\'email:', userToDelete.email)
        }
      }
    } catch (authError) {
      console.error('❌ [DELETE] Erreur lors de la suppression Auth:', authError)
      // Ne pas échouer, juste logger l'erreur
    }

    console.log('✅ [DELETE] Utilisateur supprimé avec succès')
    return NextResponse.json(
      { message: 'Utilisateur supprimé avec succès' }
    )

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
