'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QuitusDisplay } from '@/components/ac/quitus-display'
import { LoadingState } from '@/components/ui/loading-states'

export default function PrintQuitusPage() {
  const params = useParams()
  const dossierId = params.id as string
  const [quitus, setQuitus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuitus = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/dossiers/${dossierId}/generate-quitus`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Erreur lors de la génération du quitus')
        }

        const data = await response.json()
        setQuitus(data.quitus)
        
        // Auto-print immédiatement
        setTimeout(() => {
          window.print()
          // Fermer la fenêtre après impression (optionnel)
          setTimeout(() => {
            window.close()
          }, 2000)
        }, 500)
      } catch (err) {
        console.error('Erreur fetchQuitus:', err)
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
            variant="spinner"
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
    <div className="min-h-screen bg-white print:bg-white">
      {/* Instructions pour l'impression - masquées à l'impression */}
      <div className="print:hidden bg-blue-50 border border-blue-200 rounded-lg p-4 m-4 text-sm">
        <h3 className="font-title-semibold text-blue-800 mb-2">📋 Instructions pour une impression parfaite :</h3>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>Dans les options d'impression, décochez <strong>"En-têtes et pieds de page"</strong></li>
          <li>Les marges sont déjà optimisées (15mm latérales, 0mm haut/bas)</li>
          <li>Vérifiez que l'orientation est <strong>"Portrait"</strong></li>
          <li>Pour un PDF : choisissez <strong>"Enregistrer au format PDF"</strong></li>
        </ul>
      </div>
      
      <QuitusDisplay 
        quitus={quitus} 
        onDownload={() => {}} 
        onPrint={() => window.print()} 
      />
    </div>
  )
}
