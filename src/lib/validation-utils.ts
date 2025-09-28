/**
 * Utilitaires de validation pour les dossiers CB
 * 
 * Ce module contient les fonctions pour vérifier l'état des validations
 * des dossiers par le Contrôleur Budgétaire.
 */

export interface ValidationStatus {
  hasOperationTypeValidation: boolean
  hasControlesFondValidation: boolean
  canValidate: boolean
  missingValidations: string[]
}

/**
 * Vérifie si un dossier a les deux validations requises pour être validé par le CB
 * 
 * @param dossierId - ID du dossier à vérifier
 * @returns Promise<ValidationStatus> - État des validations
 */
export async function checkDossierValidationStatus(dossierId: string): Promise<ValidationStatus> {
  try {
    // Récupérer les validations du type d'opération
    const operationTypeResponse = await fetch(`/api/dossiers/${dossierId}/validation-operation-type`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    // Récupérer les validations des contrôles de fond
    const controlesFondResponse = await fetch(`/api/dossiers/${dossierId}/validation-controles-fond`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const hasOperationTypeValidation = operationTypeResponse.ok
    const hasControlesFondValidation = controlesFondResponse.ok
    
    const missingValidations: string[] = []
    if (!hasOperationTypeValidation) {
      missingValidations.push('Validation du type d\'opération')
    }
    if (!hasControlesFondValidation) {
      missingValidations.push('Contrôles de fond')
    }
    
    return {
      hasOperationTypeValidation,
      hasControlesFondValidation,
      canValidate: hasOperationTypeValidation && hasControlesFondValidation,
      missingValidations
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des validations:', error)
    return {
      hasOperationTypeValidation: false,
      hasControlesFondValidation: false,
      canValidate: false,
      missingValidations: ['Erreur de vérification']
    }
  }
}

/**
 * Vérifie si un dossier peut être validé (version simplifiée)
 * 
 * @param dossier - Dossier à vérifier
 * @returns boolean - true si le dossier peut être validé
 */
export function canDossierBeValidated(dossier: any): boolean {
  // Un dossier ne peut être validé que s'il est en attente
  return dossier.statut === 'EN_ATTENTE'
}

/**
 * Obtient le message d'état des validations pour l'affichage
 * 
 * @param status - État des validations
 * @returns string - Message descriptif
 */
export function getValidationStatusMessage(status: ValidationStatus): string {
  if (status.canValidate) {
    return 'Toutes les validations sont complètes'
  }
  
  if (status.missingValidations.length === 1) {
    return `Validation manquante: ${status.missingValidations[0]}`
  }
  
  return `Validations manquantes: ${status.missingValidations.join(', ')}`
}
