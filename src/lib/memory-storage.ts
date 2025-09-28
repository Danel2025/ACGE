/**
 * Stockage en mémoire simple pour les tests
 * Remplace temporairement la base de données
 */

interface Folder {
  id: string
  name: string
  description?: string
  authorId: string
  createdAt: string
  updatedAt: string
  _count?: {
    documents: number
    children: number
  }
  author?: {
    name: string
    email: string
  }
}

interface Document {
  id: string
  name: string
  size: number
  type: string
  folderId?: string
  authorId: string
  createdAt: string
  updatedAt: string
}

// Stockage global persistant
declare global {
  var __memoryStorage: {
    folders: Folder[]
    documents: Document[]
  } | undefined
}

// Initialiser le stockage global
if (!global.__memoryStorage) {
  global.__memoryStorage = {
    folders: [],
    documents: []
  }
}

const storage = global.__memoryStorage

export const memoryStorage = {
  // Gestion des dossiers
  folders: {
    create: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>): Folder => {
      const newFolder: Folder = {
        ...folder,
        id: 'folder_' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { documents: 0, children: 0 },
        author: { name: 'Administrateur', email: 'admin@example.com' }
      }
      storage.folders.push(newFolder)
      console.log('📁 Dossier créé dans le stockage global:', newFolder.name, 'Total:', storage.folders.length)
      return newFolder
    },

    findMany: (): Folder[] => {
      console.log('📁 Récupération dossiers du stockage global:', storage.folders.length)
      return storage.folders
    },

    findById: (id: string): Folder | undefined => {
      return storage.folders.find(f => f.id === id)
    },

    delete: (id: string): boolean => {
      const index = storage.folders.findIndex(f => f.id === id)
      if (index > -1) {
        storage.folders.splice(index, 1)
        return true
      }
      return false
    },

    count: (): number => {
      return storage.folders.length
    }
  },

  // Gestion des documents
  documents: {
    create: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Document => {
      const newDocument: Document = {
        ...document,
        id: 'doc_' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      storage.documents.push(newDocument)
      return newDocument
    },

    findMany: (): Document[] => {
      return storage.documents
    },

    count: (): number => {
      return storage.documents.length
    },

    findByFolderId: (folderId: string): Document[] => {
      return storage.documents.filter(d => d.folderId === folderId)
    }
  },

  // Statistiques
  getStats: () => {
    const stats = {
      totalDocuments: storage.documents.length,
      totalFolders: storage.folders.length,
      totalUsers: 2, // Simulation
      activeUsers: 2, // Simulation
      monthlyGrowthPercentage: 0,
      spaceUsed: {
        bytes: storage.documents.reduce((sum, doc) => sum + doc.size, 0),
        gb: 0,
        percentage: 0,
        quota: 10737418240 // 10GB
      },
      recentDocuments: storage.documents.slice(-5).reverse(),
      documentsThisMonth: storage.documents.filter(doc => {
        const docDate = new Date(doc.createdAt)
        const now = new Date()
        return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear()
      }).length
    }
    console.log('📊 Statistiques calculées:', stats)
    return stats
  }
}
