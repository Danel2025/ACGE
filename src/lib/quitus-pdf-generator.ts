import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Générateur PDF optimisé pour les quitus
 * Génère un PDF de haute qualité directement visualisable
 */

export interface PDFGenerationOptions {
  filename?: string
  download?: boolean
  preview?: boolean
}

/**
 * Génère un PDF du quitus à partir du DOM
 */
export async function generateQuitsuPDF(
  elementId: string = 'quitus-container',
  options: PDFGenerationOptions = {}
): Promise<Blob | null> {
  try {
    const element = document.getElementById(elementId)

    if (!element) {
      console.error(`Élément ${elementId} non trouvé`)
      return null
    }

    // Masquer les éléments non imprimables
    const printHiddenElements = element.querySelectorAll('.print\\:hidden')
    printHiddenElements.forEach(el => {
      (el as HTMLElement).style.display = 'none'
    })

    // Configuration pour html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Haute résolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId)
        if (clonedElement) {
          // Optimiser les styles pour le PDF
          clonedElement.style.padding = '40px'
          clonedElement.style.maxWidth = '1200px'
          clonedElement.style.margin = '0 auto'
        }
      }
    })

    // Restaurer les éléments cachés
    printHiddenElements.forEach(el => {
      (el as HTMLElement).style.display = ''
    })

    // Dimensions du PDF (A4)
    const imgWidth = 210 // mm
    const pageHeight = 297 // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    // Créer le PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    let position = 0

    // Ajouter l'image au PDF (avec pagination si nécessaire)
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
      heightLeft -= pageHeight
    }

    // Générer le blob
    const pdfBlob = pdf.output('blob')

    // Télécharger si demandé
    if (options.download !== false) {
      const filename = options.filename || `quitus-${Date.now()}.pdf`
      pdf.save(filename)
    }

    return pdfBlob
  } catch (error) {
    console.error('Erreur génération PDF:', error)
    return null
  }
}

/**
 * Génère et ouvre le PDF dans une nouvelle fenêtre
 */
export async function previewQuitsuPDF(
  elementId: string = 'quitus-container',
  filename?: string
): Promise<void> {
  try {
    const pdfBlob = await generateQuitsuPDF(elementId, {
      download: false,
      filename
    })

    if (!pdfBlob) {
      throw new Error('Échec de la génération du PDF')
    }

    // Créer une URL pour le blob
    const pdfUrl = URL.createObjectURL(pdfBlob)

    // Ouvrir dans une nouvelle fenêtre
    const previewWindow = window.open(pdfUrl, '_blank')

    if (!previewWindow) {
      // Si le popup est bloqué, télécharger directement
      console.warn('Popup bloquée, téléchargement direct')
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = filename || `quitus-${Date.now()}.pdf`
      link.click()
    }

    // Nettoyer l'URL après un délai
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl)
    }, 60000) // 1 minute
  } catch (error) {
    console.error('Erreur preview PDF:', error)
    throw error
  }
}

/**
 * Génère le PDF et retourne l'URL blob
 */
export async function generateQuitsuPDFUrl(
  elementId: string = 'quitus-container'
): Promise<string | null> {
  try {
    const pdfBlob = await generateQuitsuPDF(elementId, { download: false })

    if (!pdfBlob) {
      return null
    }

    return URL.createObjectURL(pdfBlob)
  } catch (error) {
    console.error('Erreur génération URL PDF:', error)
    return null
  }
}

/**
 * Télécharge directement le PDF
 */
export async function downloadQuitsuPDF(
  elementId: string = 'quitus-container',
  numeroQuitus: string
): Promise<boolean> {
  try {
    const filename = `quitus-${numeroQuitus}.pdf`
    const pdfBlob = await generateQuitsuPDF(elementId, {
      download: true,
      filename
    })

    return pdfBlob !== null
  } catch (error) {
    console.error('Erreur téléchargement PDF:', error)
    return false
  }
}
