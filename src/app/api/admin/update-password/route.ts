import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { syncUserWithAuth } from '@/lib/auth-sync'

/**
 * 🔐 Mettre à jour le mot de passe admin dans les deux tables
 * Email: admin@acge-gabon.com
 * Nouveau mot de passe: Admin2025!
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 ===== MISE À JOUR MOT DE PASSE ADMIN =====')
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }

    const adminEmail = 'admin@acge-gabon.com'
    const newPassword = 'Admin2025!'

    // Étape 1: Vérifier que l'utilisateur admin existe dans public.users
    console.log('🔍 Vérification de l\'utilisateur admin...')
    const { data: adminUser, error: adminError } = await admin
      .from('users')
      .select('id, email, name, role')
      .eq('email', adminEmail)
      .single()

    if (adminError || !adminUser) {
      console.error('❌ Utilisateur admin non trouvé:', adminError)
      return NextResponse.json(
        { error: 'Utilisateur admin non trouvé' },
        { status: 404 }
      )
    }

    console.log('✅ Utilisateur admin trouvé:', adminUser.email)

    // Étape 2: Mettre à jour le mot de passe dans public.users (hashé)
    console.log('🔐 Mise à jour du mot de passe dans public.users...')
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    const { error: updateError } = await admin
      .from('users')
      .update({ 
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      })
      .eq('id', adminUser.id)

    if (updateError) {
      console.error('❌ Erreur mise à jour public.users:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      )
    }

    console.log('✅ Mot de passe mis à jour dans public.users')

    // Étape 3: Synchroniser avec Supabase Auth
    console.log('🔄 Synchronisation avec Supabase Auth...')
    const syncResult = await syncUserWithAuth(
      admin,
      adminEmail,
      {
        password: newPassword // Auth gère le hachage automatiquement
      },
      'ADMIN_PASSWORD_UPDATE'
    )

    if (!syncResult.success) {
      console.warn('⚠️ Synchronisation Auth échouée:', syncResult.error)
      // Ne pas échouer, juste logger l'avertissement
    } else {
      console.log('✅ Mot de passe synchronisé avec Supabase Auth')
    }

    console.log('🎉 ===== MISE À JOUR TERMINÉE =====')
    
    return NextResponse.json({
      success: true,
      message: 'Mot de passe admin mis à jour avec succès',
      admin: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      },
      syncStatus: syncResult.success ? 'Synchronisé' : 'Erreur de synchronisation'
    })

  } catch (error) {
    console.error('💥 Erreur mise à jour mot de passe admin:', error)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
