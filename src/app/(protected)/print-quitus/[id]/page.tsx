'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { QuitusDisplay } from '@/components/ac/quitus-display'
import { LoadingState } from '@/components/ui/loading-states'

export default function PrintQuitusPage() {
  const params = useParams()
  const dossierId = params.id as string
  const [quitus, setQuitus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasPrintedRef = useRef(false)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    // Éviter le double fetch en mode strict de React
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    const fetchQuitus = async () => {
      try {
        setLoading(true)

        console.log('🔍 Params reçus:', params)
        console.log('🔍 DossierId extrait:', dossierId)

        // Vérifier que dossierId est valide (UUID)
        if (!dossierId || dossierId === 'search' || dossierId.length < 10) {
          throw new Error('ID de dossier invalide. Veuillez ouvrir le quitus depuis le dashboard.')
        }

        console.log('🔍 Tentative de récupération du quitus pour dossier:', dossierId)

        // Essayer d'abord GET pour récupérer un quitus existant
        let response = await fetch(`/api/dossiers/${dossierId}/generate-quitus`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })

        console.log('📥 Réponse GET:', response.status, response.ok)

        let data = await response.json()
        console.log('📦 Données GET:', data)

        // Si le quitus n'existe pas encore, le générer avec POST
        if (!response.ok || !data.success || !data.quitus) {
          console.log('⚡ Quitus non trouvé, génération avec POST...')

          response = await fetch(`/api/dossiers/${dossierId}/generate-quitus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })

          console.log('📥 Réponse POST:', response.status, response.ok)

          if (!response.ok) {
            const errorData = await response.json()
            console.error('❌ Erreur POST:', errorData)
            throw new Error(errorData.error || 'Erreur lors de la génération du quitus')
          }

          data = await response.json()
          console.log('📦 Données POST:', data)
        }

        if (data.success && data.quitus) {
          console.log('✅ Quitus récupéré avec succès')
          setQuitus(data.quitus)

          // Auto-print UNE SEULE FOIS après le chargement
          if (!hasPrintedRef.current) {
            hasPrintedRef.current = true
            setTimeout(() => {
              console.log('🖨️ Déclenchement de l\'impression')
              window.print()
            }, 500)
          }
        } else {
          throw new Error('Quitus non trouvé dans la réponse')
        }
      } catch (err) {
        console.error('❌ Erreur fetchQuitus:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    if (dossierId) {
      fetchQuitus()
    }
  }, [dossierId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <LoadingState
            isLoading={true}
            message="Génération du quitus..."
            size="xl"
            color="primary"
            showText={true}
          />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Erreur</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.close()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  if (!quitus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">❌ Quitus non trouvé</div>
          <button 
            onClick={() => window.close()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Styles optimisés pour l'impression sur 1 page A4 */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }

        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-size: 8pt !important;
            line-height: 1.15 !important;
          }

          .quitus-container {
            padding: 0 !important;
            margin: 0 !important;
            font-size: 8pt !important;
            line-height: 1.15 !important;
          }

          .quitus-header {
            margin-bottom: 2mm !important;
            padding-bottom: 1mm !important;
          }

          .quitus-logo {
            width: 15mm !important;
            height: 15mm !important;
          }

          .quitus-header h1 {
            font-size: 10pt !important;
            margin: 0.5mm 0 !important;
          }

          .quitus-header h2 {
            font-size: 9pt !important;
            margin: 0.5mm 0 !important;
          }

          .quitus-header h3 {
            font-size: 8pt !important;
            margin: 0.5mm 0 !important;
          }

          .quitus-number {
            padding: 1mm 2mm !important;
            margin: 1mm 0 !important;
            font-size: 8pt !important;
          }

          .quitus-section {
            margin-bottom: 1.5mm !important;
            padding: 1.5mm !important;
            border-width: 0.5pt !important;
          }

          .quitus-section h3 {
            font-size: 8pt !important;
            margin: 0 0 1mm 0 !important;
            padding-bottom: 0.5mm !important;
          }

          .quitus-grid-cell {
            padding: 0.75mm 1.5mm !important;
            font-size: 7pt !important;
            line-height: 1.2 !important;
          }

          .quitus-history-cell {
            padding: 0.5mm 1.5mm !important;
            font-size: 7pt !important;
            line-height: 1.2 !important;
          }

          .quitus-verification-cell {
            padding: 0.75mm !important;
            font-size: 7pt !important;
            line-height: 1.2 !important;
          }

          .quitus-conclusion {
            padding: 2mm !important;
            margin: 2mm 0 !important;
          }

          .quitus-conclusion-title {
            font-size: 9pt !important;
            margin: 0 0 1mm 0 !important;
          }

          .quitus-conclusion-status {
            font-size: 8pt !important;
            margin: 1mm 0 !important;
          }

          .quitus-conclusion-text {
            font-size: 7pt !important;
            margin: 1mm 0 !important;
            line-height: 1.2 !important;
          }

          .quitus-signature {
            margin-top: 3mm !important;
            font-size: 7pt !important;
          }

          .quitus-signature-line {
            margin-top: 6mm !important;
            padding-top: 1mm !important;
          }

          /* Section sécurité compactée */
          .quitus-section img {
            max-width: 20mm !important;
            max-height: 20mm !important;
          }

          .quitus-section > div {
            margin: 0.75mm 0 !important;
            font-size: 6.5pt !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-white print:bg-white">
        {/* Instructions pour l'impression - masquées à l'impression */}
        <div className="print:hidden bg-blue-50 border border-blue-200 rounded-lg p-4 m-4 text-sm">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Instructions pour une impression parfaite :</h3>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            <li>Dans les options d'impression, décochez <strong>"En-têtes et pieds de page"</strong></li>
            <li>Les marges sont déjà optimisées (8mm haut/bas, 10mm latérales)</li>
            <li>Vérifiez que l'orientation est <strong>"Portrait"</strong></li>
            <li>Pour un PDF : choisissez <strong>"Enregistrer au format PDF"</strong></li>
          </ul>
          <div className="mt-3 p-2 bg-white rounded border border-blue-300">
            <p className="text-xs text-blue-600">
              <strong>💡 Astuce :</strong> Le document est optimisé pour tenir sur <strong>1 seule page A4</strong>
            </p>
          </div>
        </div>

        <QuitusDisplay
          quitus={quitus}
          onDownload={() => {}}
          onPrint={() => window.print()}
        />
      </div>
    </>
  )
}
