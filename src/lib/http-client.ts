/**
 * Client HTTP robuste avec gestion des timeouts et des AbortError
 */

interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
}

class HttpClient {
  private defaultTimeout = 10000 // 10 secondes
  private defaultRetries = 1

  async request(url: string, options: RequestOptions = {}): Promise<Response> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      ...fetchOptions
    } = options

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          console.log(`⏰ Timeout de la requête ${url} après ${timeout}ms (tentative ${attempt + 1})`)
          controller.abort()
        }, timeout)

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            ...fetchOptions.headers
          }
        })

        clearTimeout(timeoutId)
        return response

      } catch (error) {
        lastError = error as Error
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`⏰ Requête ${url} annulée (tentative ${attempt + 1}/${retries + 1})`)
          
          if (attempt < retries) {
            // Attendre avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
            continue
          }
        } else {
          console.error(`❌ Erreur lors de la requête ${url}:`, error)
          throw error
        }
      }
    }

    throw lastError || new Error('Toutes les tentatives ont échoué')
  }

  async get(url: string, options: RequestOptions = {}) {
    return this.request(url, { ...options, method: 'GET' })
  }

  async post(url: string, body?: any, options: RequestOptions = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }

  async put(url: string, body?: any, options: RequestOptions = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }

  async delete(url: string, options: RequestOptions = {}) {
    return this.request(url, { ...options, method: 'DELETE' })
  }
}

export const httpClient = new HttpClient()
export default httpClient
