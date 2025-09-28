/**
 * Utilitaire de logging sécurisé pour éviter les erreurs de sérialisation Turbopack
 */

export function safeLogError(prefix: string, ...args: any[]) {
  try {
    // Convertir tous les arguments en chaînes sérialisables
    const safeArgs = args.map(arg => {
      if (arg === null || arg === undefined) {
        return String(arg)
      }
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg
      }
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack
        }
      }
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2)
        } catch {
          return '[Object non sérialisable]'
        }
      }
      return String(arg)
    })
    
    console.error(prefix, ...safeArgs)
  } catch (error) {
    // En cas d'erreur de logging, utiliser un fallback simple
    console.error(prefix, 'Erreur de logging:', String(error))
  }
}

export function safeLogInfo(prefix: string, ...args: any[]) {
  try {
    const safeArgs = args.map(arg => {
      if (arg === null || arg === undefined) {
        return String(arg)
      }
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg
      }
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2)
        } catch {
          return '[Object non sérialisable]'
        }
      }
      return String(arg)
    })
    
    console.log(prefix, ...safeArgs)
  } catch (error) {
    console.log(prefix, 'Erreur de logging:', String(error))
  }
}
