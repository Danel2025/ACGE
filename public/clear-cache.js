/**
 * 🧹 SCRIPT DE NETTOYAGE COMPLET DU CACHE NAVIGATEUR
 *
 * À copier-coller dans la console DevTools du navigateur (F12)
 * pour vider complètement tous les caches sans redémarrer.
 */

(async function clearAllCaches() {
  console.log('🧹 Début du nettoyage complet du cache...')

  try {
    // 1. Vider le Cache Storage (Service Workers)
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      console.log(`📦 ${cacheNames.length} cache(s) trouvé(s):`, cacheNames)

      for (const cacheName of cacheNames) {
        await caches.delete(cacheName)
        console.log(`✅ Cache supprimé: ${cacheName}`)
      }
    }

    // 2. Vider localStorage
    const localStorageCount = localStorage.length
    localStorage.clear()
    console.log(`🗑️  localStorage vidé (${localStorageCount} entrées)`)

    // 3. Vider sessionStorage
    const sessionStorageCount = sessionStorage.length
    sessionStorage.clear()
    console.log(`🗑️  sessionStorage vidé (${sessionStorageCount} entrées)`)

    // 4. Vider les cookies (si possible depuis JS)
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + location.hostname
    }
    console.log(`🍪 ${cookies.length} cookie(s) supprimé(s)`)

    // 5. Vider IndexedDB (si utilisé)
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases()
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name)
          console.log(`🗄️  IndexedDB supprimée: ${db.name}`)
        }
      }
    }

    // 6. Forcer le rechargement sans cache
    console.log('✨ Nettoyage terminé !')
    console.log('🔄 Rechargement de la page en cours...')

    setTimeout(() => {
      location.reload(true) // Hard reload
    }, 500)

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  }
})()