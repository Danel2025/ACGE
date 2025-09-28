import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Synchronise les données d'un utilisateur avec Supabase Auth
 * @param supabase - Client Supabase avec les privilèges admin
 * @param userEmail - Email de l'utilisateur à synchroniser
 * @param updateData - Données à synchroniser
 * @param context - Contexte pour les logs (ex: 'PROFILE', 'USER_UPDATE')
 */
export async function syncUserWithAuth(
  supabase: SupabaseClient,
  userEmail: string,
  updateData: {
    name?: string
    email?: string
    role?: string
    password?: string
  },
  context: string = 'SYNC'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔧 [${context}] Synchronisation avec Supabase Auth...`)
    
    // Récupérer l'utilisateur Auth correspondant par email
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error(`❌ [${context}] Erreur lors de la récupération des utilisateurs Auth:`, listError)
      return { success: false, error: listError.message }
    }

    const authUser = authUsers.users.find(u => u.email === userEmail)
    
    if (!authUser) {
      console.warn(`⚠️ [${context}] Utilisateur Auth non trouvé pour l'email:`, userEmail)
      return { success: false, error: 'Utilisateur Auth non trouvé' }
    }

    console.log(`🔧 [${context}] Utilisateur Auth trouvé, mise à jour...`, authUser.id)
    
    // Préparer les données de mise à jour pour Auth
    const authUpdateData: any = {
      user_metadata: {}
    }

    // Mettre à jour l'email si fourni
    if (updateData.email) {
      authUpdateData.email = updateData.email.trim()
    }

    // Mettre à jour le nom si fourni
    if (updateData.name) {
      authUpdateData.user_metadata.name = updateData.name.trim()
    }

    // Mettre à jour le rôle si fourni
    if (updateData.role) {
      authUpdateData.user_metadata.role = updateData.role
    }

    // Ajouter le mot de passe seulement s'il est fourni
    if (updateData.password && updateData.password.length >= 6) {
      authUpdateData.password = updateData.password // Auth gère le hachage automatiquement
    }

    const { data: updatedAuthUser, error: authUpdateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      authUpdateData
    )

    if (authUpdateError) {
      console.error(`❌ [${context}] Erreur mise à jour Supabase Auth:`, authUpdateError)
      return { success: false, error: authUpdateError.message }
    }

    console.log(`✅ [${context}] Utilisateur Auth mis à jour avec succès:`, updatedAuthUser.user?.id)
    return { success: true }

  } catch (authError) {
    console.error(`❌ [${context}] Erreur lors de la synchronisation avec Auth:`, authError)
    return { 
      success: false, 
      error: authError instanceof Error ? authError.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Trouve un utilisateur Auth par email
 * @param supabase - Client Supabase avec les privilèges admin
 * @param email - Email à rechercher
 * @returns L'utilisateur Auth ou null
 */
export async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ user: any; error?: string }> {
  try {
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      return { user: null, error: listError.message }
    }

    const authUser = authUsers.users.find(u => u.email === email)
    return { user: authUser }
  } catch (error) {
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}
