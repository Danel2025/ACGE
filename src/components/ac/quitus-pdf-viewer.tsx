'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuitusDisplay } from './quitus-display'
import { generateQuitsuPDFUrl, downloadQuitsuPDF } from '@/lib/quitus-pdf-generator'
import { Download, FileText, Loader2, Eye, Printer } from 'lucide-react'
import { toast } from 'sonner'

interface QuitsuPDFViewerProps {
  quitus: any
  dossierId?: string
}

export function QuitsuPDFViewer({ quitus, dossierId }: QuitsuPDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'pdf'>('preview')

  // Générer le PDF quand on passe à l'onglet PDF
  useEffect(() => {
    if (activeTab === 'pdf' && !pdfUrl && !isGenerating) {
      generatePDF()
    }
  }, [activeTab])

  const generatePDF = async () => {
    try {
      setIsGenerating(true)
      toast.info('Génération du PDF en cours...')

      const url = await generateQuitsuPDFUrl('quitus-container')

      if (url) {
        setPdfUrl(url)
        toast.success('PDF généré avec succès')
      } else {
        toast.error('Erreur lors de la génération du PDF')
      }
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    try {
      toast.info('Téléchargement en cours...')

      const success = await downloadQuitsuPDF('quitus-container', quitus.numeroQuitus)

      if (success) {
        toast.success('PDF téléchargé avec succès')
      } else {
        toast.error('Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error)
      toast.error('Erreur lors du téléchargement')
    }
  }

  const handlePrint = () => {
    if (pdfUrl) {
      // Ouvrir le PDF dans une nouvelle fenêtre pour impression
      const printWindow = window.open(pdfUrl, '_blank')
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print()
        })
      }
    } else {
      // Fallback: utiliser window.print()
      window.print()
    }
  }

  return (
    <div className="w-full h-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'pdf')} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isGenerating}
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isGenerating}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>

        <TabsContent value="preview" className="mt-0">
          <div className="border rounded-lg bg-white">
            <QuitusDisplay quitus={quitus} dossierId={dossierId} />
          </div>
        </TabsContent>

        <TabsContent value="pdf" className="mt-0">
          {isGenerating ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-lg font-medium">Génération du PDF en cours...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Veuillez patienter quelques instants
                </p>
              </CardContent>
            </Card>
          ) : pdfUrl ? (
            <div className="border rounded-lg bg-white overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="Aperçu PDF du quitus"
                style={{ border: 'none' }}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">PDF non généré</p>
                <Button onClick={generatePDF}>
                  Générer le PDF
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Élément caché pour la génération PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div id="quitus-container-hidden">
          <QuitusDisplay quitus={quitus} dossierId={dossierId} />
        </div>
      </div>
    </div>
  )
}
