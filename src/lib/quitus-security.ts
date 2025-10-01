import crypto from 'crypto'
import QRCode from 'qrcode'

/**
 * Génère un hash de vérification pour le quitus
 * Ce hash garantit l'intégrité du document
 */
export function generateQuitusHash(quitusData: any): string {
  // Créer une version normalisée des données pour le hash
  const dataToHash = {
    numeroQuitus: quitusData.numeroQuitus,
    dossierId: quitusData.dossier.numero,
    dateGeneration: quitusData.dateGeneration,
    beneficiaire: quitusData.dossier.beneficiaire,
    montant: quitusData.dossier.montantOrdonnance,
    statut: quitusData.conclusion.conforme ? 'CONFORME' : 'NON_CONFORME'
  }

  // Générer le hash SHA-256
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(dataToHash))
    .digest('hex')

  return hash.toUpperCase().substring(0, 16) // 16 premiers caractères
}

/**
 * Génère un QR code pour la vérification du quitus
 * Le QR code contient l'URL de vérification avec le hash
 */
export async function generateQuitusQRCode(
  numeroQuitus: string,
  hash: string,
  baseUrl?: string
): Promise<string> {
  // Déterminer l'URL de base avec fallback intelligent
  let resolvedBaseUrl = baseUrl

  if (!resolvedBaseUrl) {
    // Priorité 1 : NEXT_PUBLIC_APP_URL (variable dédiée pour l'app)
    resolvedBaseUrl = process.env.NEXT_PUBLIC_APP_URL

    // Priorité 2 : NEXTAUTH_URL (déjà configurée)
    if (!resolvedBaseUrl) {
      resolvedBaseUrl = process.env.NEXTAUTH_URL
    }

    // Priorité 3 : Détecter si on est en production Vercel
    if (!resolvedBaseUrl && process.env.VERCEL_URL) {
      resolvedBaseUrl = `https://${process.env.VERCEL_URL}`
    }

    // Fallback : localhost pour le développement
    if (!resolvedBaseUrl) {
      resolvedBaseUrl = 'http://localhost:3000'
    }
  }

  // Nettoyer l'URL (supprimer le trailing slash)
  resolvedBaseUrl = resolvedBaseUrl.replace(/\/$/, '')

  // URL de vérification complète
  const verificationUrl = `${resolvedBaseUrl}/verify-quitus/${numeroQuitus}?hash=${hash}`

  console.log('🔐 Génération du QR code pour:', verificationUrl)

  try {
    // Générer le QR code en base64
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    console.log('✅ QR code généré avec succès')
    return qrCodeDataUrl
  } catch (error) {
    console.error('❌ Erreur génération QR code:', error)
    throw error
  }
}

/**
 * Vérifie l'intégrité d'un quitus en comparant son hash
 */
export function verifyQuitusIntegrity(quitusData: any, providedHash: string): boolean {
  const calculatedHash = generateQuitusHash(quitusData)
  return calculatedHash === providedHash
}

/**
 * Génère un numéro unique de quitus
 */
export function generateQuitusNumber(numeroDossier: string): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return `QUITUS-${numeroDossier}-${year}-${random}-${timestamp}`
}

/**
 * Génère un filigrane pour le PDF
 */
export function generateWatermark(type: 'ORIGINAL' | 'COPIE' = 'ORIGINAL'): string {
  return type
}
