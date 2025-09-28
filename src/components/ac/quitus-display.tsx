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
  DollarSign,
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

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(montant)
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
              <td className="quitus-grid-cell label">Montant</td>
              <td className="quitus-grid-cell value">{formatMontant(quitus.dossier.montantOrdonnance)}</td>
              <td className="quitus-grid-cell label">Poste comptable</td>
              <td className="quitus-grid-cell value">{quitus.dossier.posteComptable}</td>
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
            if (dossierId) {
              // Ouvrir la page d'impression dédiée qui génère un vrai document
              window.open(`/print-quitus/${dossierId}`, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
            } else {
              // Fallback : essayer d'extraire l'ID depuis le quitus
              const numeroQuitus = quitus?.numeroQuitus || ''
              const match = numeroQuitus.match(/DOSS-ACGE-(\d+)/)
              if (match) {
                // Rechercher le dossier correspondant
                window.open(`/print-quitus/search?numero=${match[1]}`, '_blank')
              } else {
                alert('Impossible d\'imprimer : ID du dossier non trouvé')
              }
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
