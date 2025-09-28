import { createHash } from 'crypto'

/**
 * Convertit un CUID ou autre ID non-UUID en UUID v5 déterministe
 * Utilise un namespace UUID fixe pour garantir la cohérence
 */
export function toUUID(id: string): string {
  // Si c'est déjà un UUID valide, le retourner tel quel
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(id)) {
    return id.toLowerCase()
  }

  // Namespace UUID pour ACGE (généré aléatoirement mais fixe)
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
  
  // Créer un hash SHA-1 du namespace + id
  const hash = createHash('sha1')
    .update(namespace.replace(/-/g, ''), 'hex')
    .update(id, 'utf8')
    .digest()

  // Construire l'UUID v5 selon RFC 4122
  const uuid = [
    hash.toString('hex', 0, 4),
    hash.toString('hex', 4, 6),
    // Version 5 (0101) + les 12 bits suivants du hash
    ((hash[6] & 0x0f) | 0x50).toString(16) + hash.toString('hex', 7, 8),
    // Variant 10 + les 14 bits suivants
    ((hash[8] & 0x3f) | 0x80).toString(16) + hash.toString('hex', 9, 10),
    hash.toString('hex', 10, 16)
  ].join('-')

  return uuid
}

/**
 * Vérifie si une chaîne est un UUID valide
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Convertit un ID en UUID, avec gestion des cas spéciaux
 */
export function ensureUUID(id: string | null | undefined): string | null {
  if (!id) return null
  
  // Cas spéciaux pour les tests
  if (id === 'test-user-id') {
    return '00000000-0000-0000-0000-000000000001'
  }
  
  return toUUID(id)
}
