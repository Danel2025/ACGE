/**
 * 🔀 Redirection basée sur le rôle utilisateur
 * 
 * Cette fonction détermine la page de destination appropriée
 * selon le rôle de l'utilisateur connecté.
 */

export function getRoleRedirectPath(role: string): string {
  console.log('🔀 getRoleRedirectPath appelé avec role:', role)
  console.log('🔀 Type du role:', typeof role)
  console.log('🔀 Role en minuscules:', role?.toLowerCase())

  // Normaliser le rôle (supprimer espaces et convertir en majuscules)
  const normalizedRole = role?.trim().toUpperCase() || ''

  switch (normalizedRole) {
    case 'ADMIN':
      console.log('🔀 Redirection ADMIN vers /dashboard')
      return '/dashboard'

    case 'SECRETAIRE':
      console.log('🔀 Redirection SECRETAIRE vers /folders')
      return '/folders'

    case 'CONTROLEUR_BUDGETAIRE':
    case 'CONTROLEUR':
    case 'CB':
      console.log('🔀 Redirection CONTROLEUR_BUDGETAIRE vers /cb-dashboard')
      return '/cb-dashboard'

    case 'ORDONNATEUR':
    case 'ORD':
      console.log('🔀 Redirection ORDONNATEUR vers /ordonnateur-dashboard')
      return '/ordonnateur-dashboard'

    case 'AGENT_COMPTABLE':
    case 'AGENT':
    case 'AC':
      console.log('🔀 Redirection AGENT_COMPTABLE vers /ac-dashboard')
      return '/ac-dashboard'

    default:
      console.log('🔀 Rôle inconnu, redirection vers dashboard:', role, 'normalized:', normalizedRole)
      // Rôle inconnu, rediriger vers le dashboard général
      return '/dashboard'
  }
}

/**
 * ✅ Vérifier si un rôle est autorisé pour un dashboard spécifique
 *
 * Retourne true si le rôle est autorisé à accéder au dashboard spécifié.
 */
export function isRoleAuthorizedForDashboard(userRole: string, dashboard: 'ac' | 'cb' | 'ordonnateur' | 'secretaire'): boolean {
  const normalizedRole = userRole?.trim().toUpperCase() || ''

  switch (dashboard) {
    case 'ac':
      return ['AGENT_COMPTABLE', 'AGENT', 'AC', 'ADMIN'].includes(normalizedRole)
    case 'cb':
      return ['CONTROLEUR_BUDGETAIRE', 'CONTROLEUR', 'CB', 'ADMIN'].includes(normalizedRole)
    case 'ordonnateur':
      return ['ORDONNATEUR', 'ORD', 'ADMIN'].includes(normalizedRole)
    case 'secretaire':
      return ['SECRETAIRE', 'ADMIN'].includes(normalizedRole)
    default:
      return false
  }
}

/**
 * 🎯 Redirection intelligente avec fallback
 *
 * Redirige vers la page appropriée selon le rôle,
 * avec fallback vers le dashboard général si le rôle n'est pas reconnu.
 */
export function redirectByRole(role: string | undefined, router: any): void {
  console.log(`🔀 redirectByRole appelé avec role: ${role}`)
  console.log(`🔀 Type du role dans redirectByRole: ${typeof role}`)

  if (!role) {
    console.warn('⚠️ Rôle utilisateur non défini, redirection vers dashboard général')
    router.push('/dashboard')
    return
  }

  const redirectPath = getRoleRedirectPath(role)
  console.log(`🔀 Redirection ${role} vers: ${redirectPath}`)

  // Forcer la redirection
  router.replace(redirectPath)
}
