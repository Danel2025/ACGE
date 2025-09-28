import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function generateQuitusPDF(elementId: string, filename: string = 'quitus.pdf') {
  try {
    // Trouver l'élément à convertir
    const element = document.getElementById(elementId) || document.querySelector('.quitus-container')
    
    if (!element) {
      throw new Error('Élément du quitus non trouvé')
    }

    // Cloner l'élément pour éviter de modifier l'original
    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // Appliquer des styles compatibles avec html2canvas
    clonedElement.style.backgroundColor = '#ffffff'
    clonedElement.style.color = '#000000'
    clonedElement.style.fontFamily = 'Arial, sans-serif'
    
    // Remplacer toutes les couleurs lab() par des couleurs compatibles
    const allElements = clonedElement.querySelectorAll('*')
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      const computedStyle = window.getComputedStyle(el)
      
      // Forcer des couleurs simples
      if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('lab(')) {
        htmlEl.style.backgroundColor = '#ffffff'
      }
      if (computedStyle.color && computedStyle.color.includes('lab(')) {
        htmlEl.style.color = '#000000'
      }
      if (computedStyle.borderColor && computedStyle.borderColor.includes('lab(')) {
        htmlEl.style.borderColor = '#000000'
      }
    })
    
    // Ajouter temporairement l'élément cloné au DOM
    document.body.appendChild(clonedElement)
    clonedElement.style.position = 'absolute'
    clonedElement.style.left = '-9999px'
    clonedElement.style.top = '0'

    // Créer un canvas à partir de l'élément cloné
    const canvas = await html2canvas(clonedElement, {
      scale: 2, // Haute qualité
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (element) => {
        return element.tagName === 'BUTTON' || element.classList.contains('print:hidden')
      }
    })
    
    // Supprimer l'élément cloné
    document.body.removeChild(clonedElement)

    // Créer un PDF avec les dimensions A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Calculer les dimensions pour s'adapter à A4
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    
    // Calculer le ratio pour s'adapter à la page
    const ratio = Math.min(pdfWidth / (canvasWidth * 0.264583), pdfHeight / (canvasHeight * 0.264583))
    
    const imgWidth = canvasWidth * 0.264583 * ratio
    const imgHeight = canvasHeight * 0.264583 * ratio
    
    // Centrer l'image sur la page
    const x = (pdfWidth - imgWidth) / 2
    const y = (pdfHeight - imgHeight) / 2

    // Ajouter l'image au PDF
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)

    // Télécharger le PDF
    pdf.save(filename)
    
    return true
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    throw error
  }
}

export async function downloadQuitusAsPDF(quitus: any) {
  try {
    const filename = `quitus-${quitus.numeroQuitus || 'document'}.pdf`
    await generateQuitusPDF('quitus-container', filename)
    return true
  } catch (error) {
    console.error('Erreur téléchargement PDF:', error)
    alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    return false
  }
}
