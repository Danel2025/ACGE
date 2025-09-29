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
    console.log('🔍 Vérification des validations pour dossier:', dossierId)

    // Utiliser la nouvelle API combinée pour plus de fiabilité
    const response = await fetch(`/api/dossiers/${dossierId}/validation-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.status) {
        console.log('✅ Statut récupéré via nouvelle API:', data.status)
        return data.status
      }
    }

    console.log('⚠️ Nouvelle API non disponible, fallback vers ancienne méthode')

    // Fallback vers l'ancienne méthode si la nouvelle API n'est pas disponible
    const operationTypeResponse = await fetch(`/api/dossiers/${dossierId}/validation-operation-type`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const controlesFondResponse = await fetch(`/api/dossiers/${dossierId}/validation-controles-fond`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    console.log('🔍 Résultats des API de validation (fallback):', {
      operationType: {
        status: operationTypeResponse.status,
        ok: operationTypeResponse.ok
      },
      controlesFond: {
        status: controlesFondResponse.status,
        ok: controlesFondResponse.ok
      }
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

    const result = {
      hasOperationTypeValidation,
      hasControlesFondValidation,
      canValidate: hasOperationTypeValidation && hasControlesFondValidation,
      missingValidations
    }

    console.log('🔍 Statut final des validations (fallback):', result)

    return result
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
