/**
 * Utilitaire de téléchargement sans manipulation DOM
 * Solution drastique pour éviter l'erreur removeChild
 */

export async function downloadFile(blob: Blob, fileName: string): Promise<void> {
  // Méthode 1: API moderne File System Access (Chrome/Edge)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (err: any) {
      // Si l'utilisateur annule, on ne fait rien
      if (err.name === 'AbortError') {
        return
      }
      // Sinon on continue avec le fallback
      console.warn('File System Access API failed, using fallback:', err)
    }
  }

  // Méthode 2: Fallback sans manipulation DOM
  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName

    // Déclencher le téléchargement SANS ajouter au DOM
    a.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }))

    // Nettoyer immédiatement
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
    throw error
  }
}

/**
 * Télécharger depuis une URL
 */
export async function downloadFromUrl(url: string, fileName?: string): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }
    const blob = await response.blob()
    const name = fileName || url.split('/').pop() || 'document'
    await downloadFile(blob, name)
  } catch (error) {
    console.error('Erreur lors du téléchargement depuis URL:', error)
    throw error
  }
}
