'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Building,
  Eye,
  Printer
} from 'lucide-react'
import { downloadQuitusSimple } from '@/lib/pdf-generator-alternative'

interface QuitusDisplayProps {
  quitus: any
  dossierId?: string
  onDownload?: () => void
  onPrint?: () => void
}

export function QuitusDisplay({ quitus, dossierId, onDownload, onPrint }: QuitusDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  return (
    <div id="quitus-container" className="quitus-container quitus-print quitus-modal-container" role="dialog">
      {/* En-tête officiel avec logo */}
      <div className="quitus-header">
        <div className="quitus-logo-section">
          <img 
            src="/logo-tresor-public.svg" 
            alt="Logo ACGE" 
            className="quitus-logo"
          />
        </div>
        <div className="quitus-title-section">
          <h1>RÉPUBLIQUE GABONAISE</h1>
          <h2>MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</h2>
          <h3>AGENCE COMPTABLE DES GRANDES ÉCOLES</h3>
        </div>
        <div className="quitus-number">
          QUITUS N° {quitus.numeroQuitus}
        </div>
        <div>
          <p><strong>QUITUS DE GESTION COMPTABLE</strong></p>
          <p>Généré le {formatDate(quitus.dateGeneration)}</p>
        </div>
      </div>

      {/* Informations du dossier */}
      <div className="quitus-section">
        <h3>INFORMATIONS DU DOSSIER</h3>
        <table className="quitus-grid">
          <tbody>
            <tr className="quitus-grid-row">
              <td className="quitus-grid-cell label">N° Dossier</td>
              <td className="quitus-grid-cell value">{quitus.dossier.numero}</td>
              <td className="quitus-grid-cell label">Date dépôt</td>
              <td className="quitus-grid-cell value">{formatDate(quitus.dossier.dateDepot)}</td>
            </tr>
            <tr className="quitus-grid-row">
              <td className="quitus-grid-cell label">Poste comptable</td>
              <td className="quitus-grid-cell value" colSpan={3}>{quitus.dossier.posteComptable}</td>
            </tr>
            <tr className="quitus-grid-row">
              <td className="quitus-grid-cell label">Objet</td>
              <td className="quitus-grid-cell value" colSpan={3}>{quitus.dossier.objet}</td>
            </tr>
            <tr className="quitus-grid-row">
              <td className="quitus-grid-cell label">Bénéficiaire</td>
              <td className="quitus-grid-cell value">{quitus.dossier.beneficiaire}</td>
              <td className="quitus-grid-cell label">Nature document</td>
              <td className="quitus-grid-cell value">{quitus.dossier.natureDocument}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Historique des validations */}
      <div className="quitus-section">
        <h3>HISTORIQUE DES VALIDATIONS</h3>
        <table className="quitus-history">
          <tbody>
            <tr className="quitus-history-row">
              <td className="quitus-history-cell">Création par {quitus.historique.creation.par}</td>
              <td className="quitus-history-cell">{formatDate(quitus.historique.creation.date)}</td>
            </tr>
            {quitus.historique.validationCB.date && (
              <tr className="quitus-history-row">
                <td className="quitus-history-cell">Validation CB</td>
                <td className="quitus-history-cell">{formatDate(quitus.historique.validationCB.date)}</td>
              </tr>
            )}
            {quitus.historique.ordonnancement.date && (
              <tr className="quitus-history-row">
                <td className="quitus-history-cell">Ordonnancement</td>
                <td className="quitus-history-cell">{formatDate(quitus.historique.ordonnancement.date)}</td>
              </tr>
            )}
            <tr className="quitus-history-row">
              <td className="quitus-history-cell">Validation Définitive AC</td>
              <td className="quitus-history-cell">{formatDate(quitus.historique.validationDefinitive.date)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Synthèse des vérifications */}
      <div className="quitus-section">
        <h3>SYNTHÈSE DES VÉRIFICATIONS</h3>
        <table className="quitus-verification">
          <thead>
            <tr className="quitus-verification-row">
              <td className="quitus-verification-cell quitus-verification-header">Type de Vérification</td>
              <td className="quitus-verification-cell quitus-verification-header">Total</td>
              <td className="quitus-verification-cell quitus-verification-header">Validés</td>
              <td className="quitus-verification-cell quitus-verification-header">Rejetés</td>
            </tr>
          </thead>
          <tbody>
            <tr className="quitus-verification-row">
              <td className="quitus-verification-cell"><strong>Contrôles CB</strong></td>
              <td className="quitus-verification-cell">{quitus.verifications.cb.total}</td>
              <td className="quitus-verification-cell">{quitus.verifications.cb.valides}</td>
              <td className="quitus-verification-cell">{quitus.verifications.cb.rejetes}</td>
            </tr>
            <tr className="quitus-verification-row">
              <td className="quitus-verification-cell"><strong>Vérifications Ordonnateur</strong></td>
              <td className="quitus-verification-cell">{quitus.verifications.ordonnateur.total}</td>
              <td className="quitus-verification-cell">{quitus.verifications.ordonnateur.valides}</td>
              <td className="quitus-verification-cell">{quitus.verifications.ordonnateur.rejetes}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Conclusion */}
      <div className="quitus-conclusion">
        <h3 className="quitus-conclusion-title">CONCLUSION</h3>
        <div className="quitus-conclusion-status">
          {quitus.conclusion.conforme ? '✓ DOSSIER CONFORME' : '✗ DOSSIER NON CONFORME'}
        </div>
        <div className="quitus-conclusion-text">
          {quitus.conclusion.recommandations}
        </div>

        {/* Signature */}
        <div className="quitus-signature">
          <div>
            {quitus.conclusion.signature.lieu}, le {formatDate(quitus.conclusion.signature.date)}
          </div>
          <div className="quitus-signature-line">
            <strong>{quitus.conclusion.signature.fonction}</strong>
          </div>
          <div style={{ marginTop: '20px', fontSize: '10px' }}>
            Signature et cachet
          </div>
        </div>
      </div>

      {/* Sécurité et vérification */}
      {quitus.securite && (
        <div className="quitus-section" style={{ marginTop: '30px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
          <h3>INFORMATIONS DE SÉCURITÉ</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Hash de vérification:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '5px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  {quitus.securite.hash}
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Document:</strong> <span style={{ color: '#007bff', fontWeight: 'bold' }}>{quitus.securite.watermark}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                Pour vérifier l'authenticité de ce document, scannez le QR code ou visitez:
                <br />
                <code style={{ fontSize: '10px' }}>{process.env.NEXT_PUBLIC_APP_URL}/verify-quitus/{quitus.numeroQuitus}</code>
              </div>
            </div>
            {quitus.securite.qrCode && (
              <div style={{ marginLeft: '20px', textAlign: 'center' }}>
                <img
                  src={quitus.securite.qrCode}
                  alt="QR Code de vérification"
                  style={{ width: '120px', height: '120px', border: '1px solid #ccc' }}
                />
                <div style={{ fontSize: '10px', marginTop: '5px' }}>Scannez pour vérifier</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions (masquées à l'impression) */}
      <div className="flex justify-center gap-4 print:hidden">
        <Button 
          variant="outline" 
          onClick={async () => {
            try {
              if (dossierId) {
                await downloadQuitusSimple(dossierId, quitus)
              } else {
                alert('ID du dossier non trouvé. Impossible de télécharger le PDF.')
              }
            } catch (error) {
              console.error('Erreur téléchargement PDF:', error)
              alert('Erreur lors du téléchargement PDF. Veuillez utiliser le bouton Imprimer et choisir "Enregistrer au format PDF".')
            }
          }} 
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Télécharger PDF
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            console.log('🖨️ Clic sur Imprimer')
            console.log('📋 dossierId:', dossierId)
            console.log('📋 quitus:', quitus)

            if (dossierId) {
              console.log('✅ DossierId trouvé, ouverture de /print-quitus/' + dossierId)
              // Ouvrir la page d'impression dédiée qui génère un vrai document
              window.open(`/print-quitus/${dossierId}`, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
            } else {
              console.warn('⚠️ Pas de dossierId, tentative de fallback')
              alert('Erreur : ID du dossier non disponible. Veuillez fermer et réouvrir le quitus.')
            }
          }}
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>
    </div>
  )
}
