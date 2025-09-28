// Alternative PDF generator using print page
export async function downloadQuitusAsPDFAlternative(dossierId: string, quitus: any) {
  try {
    // Ouvrir la page d'impression dans une nouvelle fenêtre
    const printWindow = window.open(
      `/print-quitus/${dossierId}?download=pdf`, 
      '_blank', 
      'width=800,height=600,scrollbars=yes,resizable=yes'
    )
    
    if (!printWindow) {
      throw new Error('Impossible d\'ouvrir la fenêtre d\'impression')
    }
    
    // Attendre que la page se charge et déclencher le téléchargement
    printWindow.addEventListener('load', () => {
      // Injecter un script pour déclencher le téléchargement PDF
      const script = printWindow.document.createElement('script')
      script.textContent = `
        setTimeout(() => {
          // Utiliser l'API Print du navigateur pour générer un PDF
          window.print()
          setTimeout(() => {
            window.close()
          }, 2000)
        }, 1000)
      `
      printWindow.document.head.appendChild(script)
    })
    
    return true
  } catch (error) {
    console.error('Erreur téléchargement PDF alternatif:', error)
    throw error
  }
}

// Fonction simple qui utilise window.print() avec instructions
export async function downloadQuitusSimple(dossierId: string, quitus: any) {
  try {
    // Afficher des instructions à l'utilisateur
    const userChoice = confirm(
      `Pour télécharger le quitus en PDF :\n\n` +
      `1. Une nouvelle fenêtre va s'ouvrir\n` +
      `2. L'impression se lancera automatiquement\n` +
      `3. Dans les options d'impression :\n` +
      `   - Choisissez "Enregistrer au format PDF"\n` +
      `   - Décochez "En-têtes et pieds de page" si visible\n` +
      `   - Vérifiez que les marges sont sur "Minimum"\n` +
      `4. Cliquez sur "Enregistrer"\n\n` +
      `Continuer ?`
    )
    
    if (!userChoice) {
      return false
    }
    
    // Ouvrir la page d'impression
    const printWindow = window.open(
      `/print-quitus/${dossierId}`, 
      '_blank', 
      'width=800,height=600,scrollbars=yes,resizable=yes'
    )
    
    if (!printWindow) {
      throw new Error('Impossible d\'ouvrir la fenêtre d\'impression')
    }
    
    return true
  } catch (error) {
    console.error('Erreur téléchargement PDF simple:', error)
    throw error
  }
}
