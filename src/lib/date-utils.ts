/**
 * Utilitaires pour la gestion des dates et timestamps
 */

/**
 * Calcule un timestamp relatif en français
 * @param dateString - Date au format ISO string
 * @returns String formatée (ex: "Il y a 2h", "Hier", etc.)
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date()
  const targetDate = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'À l\'instant'
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`
  if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
  if (diffInMinutes < 10080) return `Il y a ${Math.floor(diffInMinutes / 1440)}j`
  
  // Pour les dates plus anciennes, afficher la date complète
  return targetDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: targetDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

/**
 * Obtient la couleur CSS selon la priorité de notification
 * @param priority - Priorité de la notification
 * @returns Classes CSS pour la couleur
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT': return 'text-red-500'
    case 'HIGH': return 'text-orange-500'
    case 'MEDIUM': return 'text-blue-500'
    case 'LOW': return 'text-green-500'
    default: return 'text-muted-foreground'
  }
}

/**
 * Obtient la couleur de fond selon la priorité de notification
 * @param priority - Priorité de la notification
 * @returns Classes CSS pour la couleur de fond
 */
export function getPriorityBgColor(priority: string): string {
  switch (priority) {
    case 'URGENT': return 'bg-red-50 border-red-200'
    case 'HIGH': return 'bg-orange-50 border-orange-200'
    case 'MEDIUM': return 'bg-blue-50 border-blue-200'
    case 'LOW': return 'bg-green-50 border-green-200'
    default: return 'bg-muted/30 border-muted'
  }
}

/**
 * Formate une date pour l'affichage complet
 * @param dateString - Date au format ISO string
 * @returns Date formatée en français
 */
export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
